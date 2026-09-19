#!/usr/bin/env python3
"""Use Gemini (model rotation to dodge rate limits) to add persian names for actors
that still lack one. Tries multiple models, sleeps on 429, retries.
"""
import json, os, re, urllib.request, time

DB = '/root/moviebrowser-alpha/data/app_database.json'
ENV = {}
try:
    for line in open('/root/.gemini_env'):
        line = line.strip()
        if '=' in line and not line.startswith('#'):
            k, v = line.split('=', 1)
            ENV[k.strip()] = v.strip().strip('"').strip("'")
except Exception:
    pass

API_KEY = ENV.get('GEMINI_API_KEY') or ENV.get('GEMINI_API_KEYS', '').split(',')[0]
MODELS = ['gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.5-flash-lite']

def has_persian(s):
    return any('\u0600' <= c <= '\u06FF' for c in (s or ''))

def ask_gemini(en_name, model):
    url = f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={API_KEY}'
    prompt = (
        f'Transliterate the following actor/person name into proper Persian script '
        f'(Persian phonetic transcription, not translation). Only output the Persian name, nothing else.\n'
        f'Name: {en_name}'
    )
    body = {'contents': [{'parts': [{'text': prompt}]}]}
    data = json.dumps(body).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=20) as r:
        resp = json.load(r)
    text = resp['candidates'][0]['content']['parts'][0]['text'].strip()
    text = re.sub(r'[^\u0600-\u06FF\s]', '', text).strip()
    return text or None

d = json.load(open(DB))
actors = d['actors']
targets = [k for k, r in actors.items() if not has_persian(r.get('name', ''))]
print(f'Actors needing persian name: {len(targets)}')

filled = 0
for k in targets:
    en = actors[k].get('english_name') or actors[k].get('name')
    done = False
    for mi, model in enumerate(MODELS):
        for attempt in range(2):
            try:
                print(f'  {en} -> trying {model} ...')
                fa = ask_gemini(en, model)
                if fa:
                    actors[k]['name'] = fa
                    filled += 1
                    print(f'    -> {fa}')
                    done = True
                    break
            except urllib.error.HTTPError as e:
                if e.code == 429:
                    print(f'    rate-limited on {model}, waiting 15s...')
                    time.sleep(15)
                else:
                    print(f'    err {e.code}')
                    break
            except Exception as e:
                print(f'    err {e}')
                break
        if done:
            break
        time.sleep(3)
    if not done:
        print(f'  FAILED for {en}')

if filled:
    json.dump(d, open(DB, 'w'), ensure_ascii=False, indent=1)
    print(f'\nSaved {filled} new persian names.')
else:
    print('\nNo persian names added.')
