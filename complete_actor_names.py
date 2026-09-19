#!/usr/bin/env python3
"""Ensure every actor has BOTH a persian name (name) and an english_name.
- If english_name missing -> backfill from reverse actorNameMap or latin name.
- If persian name (name) missing/non-persian -> backfill from actorNameMap (en->fa) if known.
"""
import json, re

DB = '/root/moviebrowser-alpha/data/app_database.json'
MAP_TS = '/root/moviebrowser-alpha/src/db/actorNameMap.ts'

src = open(MAP_TS, encoding='utf-8').read()
m = re.search(r'ACTOR_NAME_MAP: Record.*?= \{(.*?)\n\};', src, re.S)
body = m.group(1)
pairs = re.findall(r"'([^']+)': '([^']+)'", body)
# en -> fa (case-insensitive lookup helper)
en_to_fa_ci = {}
for k, v in pairs:
    if k != v:
        en_to_fa_ci[k.lower()] = v
fa_to_en = {v: k for k, v in pairs if k != v}

def has_persian(s):
    return any('\u0600' <= c <= '\u06FF' for c in (s or ''))

d = json.load(open(DB))
actors = d['actors']
en_filled = 0
fa_filled = 0

for k, rec in actors.items():
    nm = rec.get('name', '') or ''
    en = rec.get('english_name', '') or ''

    # 1. english_name backfill
    if not en:
        if has_persian(nm) and nm in fa_to_en:
            en = fa_to_en[nm]
        elif nm and not has_persian(nm):
            en = nm
        if en:
            rec['english_name'] = en
            en_filled += 1

    # 2. persian name backfill
    if not has_persian(nm):
        # try en->fa map on the english_name first, else on the name (case-insensitive)
        cand = en_to_fa_ci.get((en or '').lower()) or en_to_fa_ci.get((nm or '').lower())
        if cand:
            rec['name'] = cand
            fa_filled += 1

json.dump(d, open(DB, 'w'), ensure_ascii=False, indent=1)
print(f'english_name backfilled: {en_filled}')
print(f'persian name backfilled: {fa_filled}')

# Report remaining gaps
no_en = [k for k, r in actors.items() if not r.get('english_name')]
no_fa = [k for k, r in actors.items() if not has_persian(r.get('name', ''))]
print(f'remaining missing english_name: {len(no_en)}')
print(f'remaining missing persian name: {len(no_fa)}')
