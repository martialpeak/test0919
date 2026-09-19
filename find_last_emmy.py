#!/usr/bin/env python3
import json

DB = '/root/moviebrowser-alpha/data/app_database.json'
d = json.load(open(DB))
a = d['actors']

# Show which actor has the incomplete Emmy
for key, rec in a.items():
    awards = rec.get('awards') or []
    if awards:
        for aw in awards:
            if not aw.get('note') and aw.get('name') == 'Emmy':
                print(f'Actor: {rec.get("name")} ({key})')
                print(f'English: {rec.get("english_name")}')
                print(f'All awards:')
                for a2 in awards:
                    note_status = "COMPLETE" if a2.get('note') else "INCOMPLETE"
                    print(f"  [{note_status}] {a2.get('name')}")