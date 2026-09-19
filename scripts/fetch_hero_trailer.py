#!/usr/bin/env python3
# Keeps the hero banner's self-hosted trailer fresh — fully server-side, no YouTube.
#
# Hero rule mirrors HomeScreen's featuredMovie: the FIRST movie in data order with
# rating >= 8.5 (else the first movie). For that movie it asks the server's own
# /api/movies/:id/trailer resolver (IMDb GraphQL -> pre-signed media-imdb CDN mp4),
# downloads the mp4 into nginx's /downloads/trailers/<id>.mp4, clears local_trailer
# on every other record, sets it on the hero, and restarts the API so the slim
# /api/movies payload picks the field up. YouTube stays only as the client-side
# fallback (FeaturedBanner) when a hero has no IMDb mp4.
#
# Cron: 30 4 * * *  (added to root crontab). Safe to re-run any time: idempotent
# unless --force is passed (re-downloads even when the file is already current).

import json, os, subprocess, sys, time, urllib.request, urllib.parse

BASE = '/root/moviebrowser-alpha'
DB = BASE + '/data/movies.json'
DIR = '/var/www/movie.movieney.ir/downloads/trailers'
API = 'http://127.0.0.1:3000'
UA = {'User-Agent': 'Mozilla/5.0 (MovieBrowser hero trailer worker)'}


def log(msg):
    line = '[%s] %s' % (time.strftime('%Y-%m-%d %H:%M:%S'), msg)
    print(line, flush=True)


def die(msg):
    log('FAIL: ' + msg)
    sys.exit(1)


def fetch(url, timeout=150):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def want_url(hid, size):
    """Version the URL by file size — every re-encode gets a fresh cache key
    (the CDN caches /downloads/* for a week, so a same-name overwrite would
    otherwise keep serving the stale mp4)."""
    return '/downloads/trailers/%s.mp4?v=%d' % (hid, size)


def find_hero(movies):
    """Same deterministic rotation the client uses (HomeScreen featuredMovie):
    every 8-hour slot steps one movie further through the rating>=8.5 pool,
    in list order. Cron runs hourly so the trailer is always the current
    slot's (download happens at most once per slot)."""
    def rating_ok(m):
        try:
            return float(m.get('rating') or 0) >= 8.5
        except (TypeError, ValueError):
            return False
    pool = [m for m in movies if rating_ok(m)] or list(movies)
    if not pool:
        return None
    slot = int(time.time() // 28800)
    return pool[slot % len(pool)]


def get_cdn_url(movie):
    q = urllib.parse.urlencode({
        'imdb_id': movie.get('imdb_id') or '',
        'title': movie.get('english_title') or movie.get('title') or '',
    })
    url = '%s/api/movies/%s/trailer?%s' % (API, movie['message_id'], q)
    data = json.loads(fetch(url, timeout=25))
    vu = data.get('video_url') or ''
    if not vu:
        return None
    if 'url=' in vu:  # '/api/video-proxy?url=ENCODED' — unwrap to the real CDN link
        vu = urllib.parse.unquote(vu.split('url=', 1)[1])
    return vu


def reencode_compact(src):
    """Shrink the trailer for fast hero loading: 540p H.264 + AAC + faststart.
    Keeps the result only when ffmpeg is present and the output is smaller."""
    out = src + '.enc.mp4'
    try:
        os.remove(out)
    except OSError:
        pass
    cmd = ['ffmpeg', '-y', '-i', src,
           '-vf', 'scale=-2:min(540\\,ih)',
           '-c:v', 'libx264', '-crf', '27', '-preset', 'medium',
           '-c:a', 'aac', '-b:a', '128k',
           '-movflags', '+faststart', out]
    try:
        r = subprocess.run(cmd, capture_output=True, timeout=600)
    except FileNotFoundError:
        log('ffmpeg not installed — keeping original size')
        return
    if (r.returncode == 0 and os.path.exists(out)
            and os.path.getsize(out) > 500_000
            and os.path.getsize(out) < os.path.getsize(src)):
        was = os.path.getsize(src) / 1e6
        os.replace(out, src)
        log('re-encoded to %.1fMB (was %.1fMB)' % (os.path.getsize(src) / 1e6, was))
    else:
        log('re-encode skipped (rc=%s, kept original)' % r.returncode)
        try:
            os.remove(out)
        except OSError:
            pass


def main():
    force = '--force' in sys.argv
    movies = json.load(open(DB, encoding='utf-8'))
    if not movies:
        die('movies.json empty')

    hero = find_hero(movies)
    if hero is None:
        die('movies.json empty or hero pool empty')
    hid = str(hero['message_id'])
    dest = os.path.join(DIR, hid + '.mp4')

    log('hero=%s (%s)' % (hid, hero.get('title')))

    if (not force and os.path.exists(dest) and os.path.getsize(dest) > 1_000_000
            and hero.get('local_trailer') == want_url(hid, os.path.getsize(dest))):
        log('up to date, nothing to do')
        return

    os.makedirs(DIR, exist_ok=True)

    cdn = get_cdn_url(hero)
    if not cdn:
        die('no IMDb mp4 for hero %s — YouTube embed stays as fallback' % hid)

    tmp = dest + '.tmp'
    blob = fetch(cdn, timeout=150)
    if len(blob) < 1_000_000:
        die('downloaded file too small (%d bytes)' % len(blob))
    if b'ftyp' not in blob[:64]:
        die('downloaded file is not an mp4')
    with open(tmp, 'wb') as f:
        f.write(blob)
    os.replace(tmp, dest)
    log('downloaded %.1fMB -> %s' % (len(blob) / 1e6, dest))
    reencode_compact(dest)
    log('final size %.1fMB' % (os.path.getsize(dest) / 1e6))

    # Remove stale trailers of previous heroes (dir should only hold the current one)
    for name in os.listdir(DIR):
        if name.endswith('.mp4') and name != hid + '.mp4':
            try:
                os.remove(os.path.join(DIR, name))
                log('removed stale %s' % name)
            except OSError:
                pass

    # Rewire local_trailer: clear everywhere, set on the hero — atomic write
    for m in movies:
        m.pop('local_trailer', None)
    hero['local_trailer'] = want_url(hid, os.path.getsize(dest))
    tmp_db = DB + '.tmp'
    with open(tmp_db, 'w', encoding='utf-8') as f:
        json.dump(movies, f, ensure_ascii=False)
    os.replace(tmp_db, DB)
    log('movies.json updated')

    rc = os.system('systemctl restart moviebrowser-alpha')
    time.sleep(2)
    log('service restart rc=%s' % rc)
    log('OK')


if __name__ == '__main__':
    main()
