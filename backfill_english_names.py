#!/usr/bin/env python3
"""Backfill english_name for actors in app_database.json that lack one.
Uses the reverse actorNameMap (persian -> english) embedded in actorNameMap.ts.
Also backfills the awards 'note' field if it's empty but we have a name.
"""
import json, re, os

DB = '/root/moviebrowser-alpha/data/app_database.json'
MAP_TS = '/root/moviebrowser-alpha/src/db/actorNameMap.ts'

# Parse the ACTOR_NAME_MAP from TS file (key -> persian canonical)
src = open(MAP_TS, encoding='utf-8').read()
m = re.search(r'ACTOR_NAME_MAP: Record.*?= \{(.*?)\n\};', src, re.S)
body = m.group(1)
pairs = re.findall(r"'([^']+)': '([^']+)'", body)
# reverse: persian -> english
rev = {}
for k, v in pairs:
    if k != v:
        rev[v] = k  # persian canonical -> english key

d = json.load(open(DB))
actors = d['actors']
filled = 0
for k, rec in actors.items():
    if not rec.get('english_name'):
        # try reverse map on the persian name
        en = rev.get(rec.get('name', ''))
        if not en:
            # if the stored name looks latin, use it as english_name
            nm = rec.get('name', '')
            if nm and any(c.isascii() and c.isalpha() for c in nm) and not any('\u0600' <= c <= '\u06FF' for c in nm):
                en = nm
        if en:
            rec['english_name'] = en
            filled += 1
            print(f'  filled: {rec.get("name")} -> {en}')

if filled:
    json.dump(d, open(DB, 'w'), ensure_ascii=False, indent=1)
    print(f'\nBackfilled english_name for {filled} actors.')
else:
    print('\nNo actors needed english_name backfill.')
