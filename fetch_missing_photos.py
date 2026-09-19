#!/usr/bin/env python3
"""Fetch & store real photos for actors in app_database.json that currently have none.
Uses the server's TMDB-backed resolution by calling the local /api/actors/store-photos
style logic directly: we re-implement the TMDB person search + download here so it runs
as a one-off maintenance script on the server.
"""
import json, os, sys, urllib.request, urllib.parse, time

DB = '/root/moviebrowser-alpha/data/app_database.json'
TMDB_KEY = os.environ.get('TMDB_API_KEY', '4e44d9029b1270a757cddc766a1bcb63')
# We also read the key the server uses, if present
try:
    env = open('/root/moviebrowser-alpha/.env').read()
    for line in env.splitlines():
        if line.startswith('TMDB_API_KEY'):
            TMDB_KEY = line.split('=', 1)[1].strip().strip('"').strip("'")
except Exception:
    pass

def tmdb_search(name):
    q = urllib.parse.quote(name)
    url = f'https://api.themoviedb.org/3/search/person?api_key={TMDB_KEY}&query={q}&language=en-US'
    try:
        with urllib.request.urlopen(url, timeout=15) as r:
            data = json.load(r)
        return data.get('results', [])
    except Exception as e:
        print(f'  search err {name}: {e}')
        return []

def download(url, dest):
    try:
        with urllib.request.urlopen(url, timeout=20) as r:
            buf = r.read()
        with open(dest, 'wb') as f:
            f.write(buf)
        return True
    except Exception as e:
        print(f'  dl err: {e}')
        return False

def main():
    d = json.load(open(DB))
    actors = d['actors']
    need = []
    for k, rec in actors.items():
        photo = rec.get('photo', '')
        if not photo or 'ui-avatars' in photo or photo.startswith('data:image/svg'):
            nm = rec.get('english_name') or rec.get('name')
            if nm:
                need.append((k, nm, rec))
    print(f'Actors missing photo: {len(need)}')
    stored_dir = '/root/moviebrowser-alpha/data/actor_photos'
    os.makedirs(stored_dir, exist_ok=True)
    done = 0
    for k, nm, rec in need:
        results = tmdb_search(nm)
        person = next((p for p in results if p.get('profile_path')), None)
        if not person:
            # try the other name form
            alt = rec.get('name') if rec.get('english_name') else rec.get('english_name')
            if alt and alt != nm:
                results = tmdb_search(alt)
                person = next((p for p in results if p.get('profile_path')), None)
        if not person:
            print(f'  NO MATCH: {nm}')
            time.sleep(0.3)
            continue
        img_url = f"https://image.tmdb.org/t/p/w500{person['profile_path']}"
        fname = f"{k.replace('/', '_').replace(' ', '_')}_{person['id']}.jpg"
        dest = os.path.join(stored_dir, fname)
        if download(img_url, dest):
            # Store as a server-served local file path
            rec['photo'] = f'/api/actors/photo-file/{fname}'
            done += 1
            print(f'  OK: {nm} -> {fname}')
        time.sleep(0.4)
    if done:
        json.dump(d, open(DB, 'w'), ensure_ascii=False, indent=1)
        print(f'\nSaved {done} new photos to DB.')
    else:
        print('\nNo photos stored.')

if __name__ == '__main__':
    main()
