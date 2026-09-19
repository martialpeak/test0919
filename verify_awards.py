#!/usr/bin/env python3
import json
d = json.load(open('/root/moviebrowser-alpha/data/app_database.json'))
a = d['actors']

total = len(a)
with_awards = 0
awards_with_note = 0
awards_without_note = 0

for k, rec in a.items():
    awards = rec.get('awards') or []
    if awards:
        with_awards += 1
        for aw in awards:
            if aw.get('note'):
                awards_with_note += 1
            else:
                awards_without_note += 1

print(f'Total actors: {total}')
print(f'Actors with awards: {with_awards}')
print(f'Awards with note: {awards_with_note}')
print(f'Awards without note: {awards_without_note}')
print(f'Coverage: {awards_with_note}/{awards_with_note + awards_without_note}')

# List actors with awards but no note
print(f'\n=== ACTORS WITH INCOMPLETE AWARDS ===')
incomplete = []
for k, rec in a.items():
    awards = rec.get('awards') or []
    if awards:
        bad = [aw for aw in awards if not aw.get('note')]
        if bad:
            incomplete.append((k, rec.get('name'), len(bad)))

incomplete.sort(key=lambda x: -x[2])
print(f'Total actors with incomplete awards: {len(incomplete)}')
for k, name, count in incomplete[:10]:
    print(f'  {name}: {count} awards without note')