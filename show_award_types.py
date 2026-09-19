#!/usr/bin/env python3
import json

DB = '/root/moviebrowser-alpha/data/app_database.json'
d = json.load(open(DB))
a = d['actors']

# Show all award names for actors with incomplete awards
print("Actors with incomplete awards and their award types:")
for key, rec in a.items():
    awards = rec.get('awards') or []
    if awards:
        bad = [aw for aw in awards if not aw.get('note')]
        if bad:
            print(f"\n{rec.get('name')} ({key}):")
            for aw in awards:
                note_status = "COMPLETE" if aw.get('note') else "INCOMPLETE"
                print(f"  [{note_status}] {aw.get('name')}")