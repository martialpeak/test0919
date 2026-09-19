#!/usr/bin/env python3
# Sequential TMDB import for folders 241..1768 (moviebrowser-alpha)
# - For each folder row: POST /api/tmdb/autofill (en title + year) -> build payload -> POST /api/movies/bulk (1 per batch for progress granularity)
# -(message_id continues server-side via nextMovieId; expected 424+)
# - Checkpoint file data/import_241_progress.json survives restarts; run script again to resume.
# - TMDB calls are throttled (~1.1s) to be gentle; autofill has server-side 6.5s timeout.
import json, time, os, sys, urllib.request, urllib.parse

BASE = 'http://localhost:3000'
DATA = '/root/moviebrowser-alpha/data'
TOKEN = json.load(open('/root/moviebrowser-alpha/data/admin_tokens.json'))
LIST_FILE = os.path.join(DATA, 'folders_241.json')
PROG_FILE = os.path.join(DATA, 'import_241_progress.json')
LOG_FILE = '/root/moviebrowser-alpha/data/import_241.log'

def log(msg):
    line = '[%s] %s' % (time.strftime('%H:%M:%S'), msg)
    print(line, flush=True)
    with open(LOG_FILE, 'a', encoding='utf-8') as f:
        f.write(line + '\n')

def http_json(path, payload=None, timeout=30):
    url = BASE + path
    if payload is None:
        req = urllib.request.Request(url)
    else:
        req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'),
                                     headers={'Content-Type': 'application/json', 'x-admin-token': [k for k,v in TOKEN.items() if v>time.time()*1000][0]})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode('utf-8'))

def load_json(path, default):
    try:
        with open(path, encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return default

rows = load_json(LIST_FILE, [])
prog = load_json(PROG_FILE, {'done': {}, 'results': {}})
done = prog.setdefault('done', {})
results = prog.setdefault('results', {})

pending = [r for r in rows if not done.get(str(r['num']))]
log('resume: %d done, %d pending of %d' % (len(done), len(pending), len(rows)))

# Quality default happens server-side; category fixed to foreign_movies
CATEGORY = 'foreign_movies'
ok_count = 0
for r in rows:
    key = str(r['num'])
    if done.get(key):
        continue
    en = (r.get('en') or '').strip()
    year = r.get('year')
    if not en:
        done[key] = 'no-title'
        results[key] = {'ok': False, 'why': 'no english title parsed'}
        continue
    q = '/api/tmdb/autofill?title=%s&media_type=movie' % urllib.parse.quote(en)
    if year:
        q += '&year=%d' % year
    try:
        af = http_json(q, timeout=40)
    except Exception as e:
        log('%s %s: autofill HTTP error %s' % (key, en, e))
        done[key] = 'http-error'
        results[key] = {'ok': False, 'why': str(e)[:120]}
        continue
    if not af.get('ok') or not af.get('title'):
        log('%s %s: no TMDB result' % (key, en))
        done[key] = 'no-result'
        results[key] = {'ok': False, 'why': 'no tmdb result'}
        continue
    payload = {
        'title': af.get('title') or r.get('fa_raw') or en,
        'english_title': af.get('english_title') or en,
        'description': af.get('description') or '',
        'year': str(af.get('year') or year or ''),
        'genre': af.get('genre') or '',
        'rating': str(af.get('rating') or ''),
        'country': af.get('country') or '',
        'actors': af.get('actors') or '',
        'actor_photos': af.get('actor_photos') or '[]',
        'quality': af.get('quality') or '720p BluRay',
        'category': CATEGORY,
        'poster_url': af.get('poster_url') or '',
        'backdrop_url': af.get('backdrop_url') or '',
        'movie_stills': af.get('movie_stills') or '[]',
        'trailer_url': af.get('trailer_url') or '',
        'imdb_id': af.get('imdb_id') or '',
        'box_office': af.get('box_office') or '',
        'awards_summary': af.get('awards_summary') or '',
        'awards': af.get('awards') or [],
    }
    try:
        resp = http_json('/api/movies/bulk', {'movies': [payload]}, timeout=60)
    except Exception as e:
        log('%s %s: bulk HTTP error %s' % (key, en, e))
        done[key] = 'bulk-error'
        results[key] = {'ok': False, 'why': str(e)[:120]}
        continue
    if resp.get('ok') and resp.get('added', 0) + resp.get('updated', 0) > 0:
        done[key] = 'ok'
        results[key] = {'ok': True, 'title': payload['title'], 'year': payload['year']}
        ok_count += 1
        log('%s OK %s (%s) -> %s' % (key, payload['english_title'], payload['year'], payload['title']))
    else:
        done[key] = 'bulk-rejected'
        results[key] = {'ok': False, 'why': json.dumps(resp)[:150]}
        log('%s REJECTED %s: %s' % (key, en, json.dumps(resp)[:120]))
    # checkpoint every record (cheap: small json)
    with open(PROG_FILE, 'w', encoding='utf-8') as f:
        json.dump(prog, f, ensure_ascii=False)
    time.sleep(1.1)

log('DONE run: +ok this run=%d, total done=%d/%d' % (ok_count, len(done), len(rows)))
