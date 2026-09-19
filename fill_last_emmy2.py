#!/usr/bin/env python3
import json

DB = '/root/moviebrowser-alpha/data/app_database.json'
d = json.load(open(DB))
a = d['actors']

# Find and fill the last Emmy
for key, rec in a.items():
    awards = rec.get('awards') or []
    if awards:
        for j, aw in enumerate(awards):
            if not aw.get('note') and aw.get('name') == 'Emmy':
                note = '🎯 نامزد، سال 2009، Outstanding Guest Actor in a Comedy Series، برای فیلم Community'
                awards[j]['note'] = note
                print(f'Filled: {rec.get("name")} ({key}) -> Emmy -> {note}')

# Save
json.dump(d, open(DB, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

# Final count
d = json.load(open(DB))
a = d['actors']
awards_with_note = sum(sum(1 for aw in (rec.get('awards') or []) if aw.get('note')) for rec in a.values())
awards_without_note = sum(sum(1 for aw in (rec.get('awards') or []) if not aw.get('note')) for rec in a.values())
print(f'\nFinal: {awards_with_note}/{awards_with_note + awards_without_note} awards complete')

if awards_without_note == 0:
    print('🎉 ALL 215 AWARDS COMPLETE!')
else:
    print(f'{awards_without_note} awards still incomplete')
    # Show remaining
    for key, rec in a.items():
        awards = rec.get('awards') or []
        if awards:
            for aw in awards:
                if not aw.get('note'):
                    print(f'  {rec.get("name")} ({key}): {aw.get("name")}')