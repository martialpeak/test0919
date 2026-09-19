#!/usr/bin/env python3
"""Fill PERSIAN names for actors whose name is Latin-only (the 1418 romanized native-script actors).

v2: per-key cooldown memory + RPM/RPD detection.
- On 429, read the error body: 'PerDay' quota = RPD (key dead ~30min), else RPM (60s).
- pick_key() only returns keys NOT in cooldown; if all are cooling, sleeps until the earliest.
- Repeated RPM hits on a key escalate its cooldown (60s * 2^n, cap 10min) so a busy key is left alone.
Resumable via data/persian_names_progress.json (done/failed lists) + has_persian check on DB.

Usage: nohup python3 /tmp/fill_persian_names.py >> /root/moviebrowser-alpha/data/persian_names.log 2>&1 &
"""
import json, os, re, sys, time, urllib.request, urllib.error

DB = '/root/moviebrowser-alpha/data/app_database.json'
PRIO = '/root/moviebrowser-alpha/data/persian_names_priority.json'
PROGRESS = '/root/moviebrowser-alpha/data/persian_names_progress.json'

BETWEEN_CALLS = 2.0
SAVE_EVERY = 10

ENV = {}
for line in open('/root/.gemini_env'):
    line = line.strip()
    if '=' in line and not line.startswith('#'):
        k, v = line.split('=', 1)
        ENV[k.strip()] = v.strip().strip('"').strip("'")

KEYS = [k.strip() for k in (ENV.get('GEMINI_API_KEYS') or '').split(',') if k.strip()]
if ENV.get('GEMINI_API_KEY') and ENV['GEMINI_API_KEY'] not in KEYS:
    KEYS.insert(0, ENV['GEMINI_API_KEY'])

MODELS = ['gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite']

KEY_COOLDOWN = {}  # key index -> unix ts until which the key is skipped
KEY_FAILS = {}     # consecutive 429s per key (reset on success)

def has_persian(s):
    return any('\u0600' <= c <= '\u06FF' for c in (s or ''))

def pick_key():
    """Return an available key index; if all are cooling, sleep until the earliest cooldown."""
    while True:
        now = time.time()
        for i in range(len(KEYS)):
            if KEY_COOLDOWN.get(i, 0) <= now:
                return i
        wait = min(KEY_COOLDOWN.values()) - now
        wait = max(5, min(wait, 600))
        print(f'  [all {len(KEYS)} keys cooling — wait {int(wait)}s]', flush=True)
        time.sleep(wait)

def note_429(ki, e):
    """Set a smart cooldown for this key based on the 429 body: PerDay quota = long, minute rate = 60s."""
    body = ''
    try:
        body = e.read().decode('utf-8', 'ignore')
    except Exception:
        pass
    if 'PerDay' in body or 'RequestsPerDay' in body:
        cd = 1800                      # RPD exhausted: retry in 30 min (real reset is midnight PT)
    else:
        n = KEY_FAILS.get(ki, 0) + 1   # RPM: escalate on repeats, 60s → 2m → 4m → cap 10m
        cd = min(60 * (2 ** (n - 1)), 600)
    KEY_COOLDOWN[ki] = time.time() + cd
    KEY_FAILS[ki] = KEY_FAILS.get(ki, 0) + 1
    print(f'  429 key#{ki} → cooldown {cd}s', flush=True)

def ask_gemini(en_name, model, key):
    url = f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}'
    prompt = (
        'Transliterate the following actor/person name into proper Persian script '
        '(Persian phonetic transcription, not translation). Only output the Persian name, nothing else.\n'
        f'Name: {en_name}'
    )
    body = {'contents': [{'parts': [{'text': prompt}]}]}
    req = urllib.request.Request(url, data=json.dumps(body).encode('utf-8'),
                                 headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=25) as r:
        resp = json.load(r)
    text = resp['candidates'][0]['content']['parts'][0]['text'].strip()
    text = re.sub(r'[^\u0600-\u06FF\s\u200c]', '', text).strip()
    return text or None

def resolve(en):
    """Try all models; each attempt picks any key not in cooldown. Returns Persian name or None."""
    for model in MODELS:
        for _ in range(len(KEYS) + 1):   # one retry per key at most
            ki = pick_key()
            try:
                got = ask_gemini(en, model, KEYS[ki])
                KEY_FAILS[ki] = 0
                if got and has_persian(got):
                    return got
                break                    # replied but unusable → next model
            except urllib.error.HTTPError as e:
                if e.code == 429:
                    note_429(ki, e)
                    continue             # same model, another key
                elif e.code in (400, 403):
                    break                # model unavailable on this key → next model
                else:
                    time.sleep(5)
            except Exception as ex:
                print(f'  err {type(ex).__name__}', flush=True)
                time.sleep(5)
        time.sleep(1)
    return None

def load_progress():
    try:
        return json.load(open(PROGRESS))
    except Exception:
        return {'done': [], 'failed': []}

def main():
    prio = json.load(open(PRIO))
    db = json.load(open(DB))
    prog = load_progress()
    done = set(prog.get('done', []))
    failed = set(prog.get('failed', []))
    actors = db['actors']
    since_save = 0
    ok_count = 0
    fail_count = 0

    targets = [p for p in prio
               if p['key'] in actors
               and p['key'] not in done
               and p['key'] not in failed
               and not has_persian(actors[p['key']].get('name', ''))]
    print(f'[start v2] targets: {len(targets)} | done: {len(done)} | failed: {len(failed)} | keys: {len(KEYS)}', flush=True)

    for t in targets:
        k, en = t['key'], t['english']
        got = resolve(en)
        if got:
            actors[k]['name'] = got
            done.add(k)
            ok_count += 1
            since_save += 1
            print(f'  OK {en} -> {got} ({ok_count})', flush=True)
        else:
            failed.add(k)
            fail_count += 1
            print(f'  FAIL {en} ({fail_count})', flush=True)
        if since_save >= SAVE_EVERY:
            json.dump(db, open(DB, 'w', encoding='utf-8'), ensure_ascii=False)
            json.dump({'done': sorted(done), 'failed': sorted(failed)}, open(PROGRESS, 'w'))
            since_save = 0
            print(f'  [checkpoint] done={len(done)} failed={len(failed)}', flush=True)
        time.sleep(BETWEEN_CALLS)

    json.dump(db, open(DB, 'w', encoding='utf-8'), ensure_ascii=False)
    json.dump({'done': sorted(done), 'failed': sorted(failed)}, open(PROGRESS, 'w'))
    print(f'[end] ok={ok_count} fail={fail_count} total_done={len(done)} total_failed={len(failed)}', flush=True)

if __name__ == '__main__':
    main()
