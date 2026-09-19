#!/usr/bin/env python3
import json

DB = '/root/moviebrowser-alpha/data/app_database.json'
d = json.load(open(DB))
a = d['actors']

total = len(a)
with_awards = 0
awards_no_note = 0
awards_with_note = 0

for k, rec in a.items():
    awards = rec.get('awards') or []
    if awards:
        with_awards += 1
        for aw in awards:
            if aw.get('note'):
                awards_with_note += 1
            else:
                awards_no_note += 1

print(f"Total actors: {total}")
print(f"Actors with awards: {with_awards}")
print(f"Award entries WITH note: {awards_with_note}")
print(f"Award entries WITHOUT note: {awards_no_note}")
print(f"Award coverage: {awards_with_note}/{awards_with_note+awards_no_note}")

# Show sample of awards with and without note
print("\n=== SAMPLE WITH note ===")
count = 0
for k, rec in a.items():
    awards = rec.get('awards') or []
    for aw in awards:
        if aw.get('note') and count < 3:
            print(f"  {rec.get('name')}: {aw}")
            count += 1

print("\n=== SAMPLE WITHOUT note ===")
count = 0
for k, rec in a.items():
    awards = rec.get('awards') or []
    for aw in awards:
        if not aw.get('note') and count < 5:
            print(f"  {rec.get('name')}: {aw}")
            count += 1

# List actors with awards but no note
print(f"\n=== ACTORS WITH AWARDS BUT NO NOTE ({awards_no_note} entries in {with_awards} actors) ===")
actors_with_bad_awards = []
for k, rec in a.items():
    awards = rec.get('awards') or []
    bad = [aw for aw in awards if not aw.get('note')]
    if bad:
        actors_with_bad_awards.append((k, rec.get('name'), rec.get('english_name'), len(bad)))

actors_with_bad_awards.sort(key=lambda x: -x[3])
print(f"Total actors with incomplete awards: {len(actors_with_bad_awards)}")
for k, name, eng, count in actors_with_bad_awards[:10]:
    print(f"  {name} ({eng}): {count} awards without note")