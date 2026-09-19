#!/usr/bin/env python3
import json

DB = '/root/moviebrowser-alpha/data/app_database.json'
d = json.load(open(DB))
a = d['actors']

# Show persian names for actors with incomplete awards
print("Actors with incomplete awards:")
for key, rec in a.items():
    awards = rec.get('awards') or []
    if awards:
        bad = [aw for aw in awards if not aw.get('note')]
        if bad:
            print(f"  KEY: {key} | NAME: {rec.get('name')} | ENGLISH: {rec.get('english_name')} | BAD: {len(bad)}")