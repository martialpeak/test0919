#!/usr/bin/env python3
"""Fill last 2 award notes."""
import json

DB = '/root/moviebrowser-alpha/data/app_database.json'
d = json.load(open(DB))
a = d['actors']

# Known awards for remaining actors
KNOWN_AWARDS = {
    'روبرت داونی جونیور': [
        ('Emmy', '2009', 'Outstanding Guest Actor in a Comedy Series', 'Community', False),
    ],
    'مایکل جیاکینو': [
        ('Academy Award (Oscar)', '2016', 'Best Original Score', 'Inside Out', False),
    ],
}

filled = 0
for key, rec in a.items():
    awards = rec.get('awards') or []
    if not awards:
        continue
    
    persian_name = rec.get('name', '')
    known = KNOWN_AWARDS.get(persian_name)
    if not known:
        continue
    
    known_by_type = {}
    for entry in known:
        award_type = entry[0]
        if award_type not in known_by_type:
            known_by_type[award_type] = entry
    
    for j, aw in enumerate(awards):
        if aw.get('note'):
            continue
        
        award_type = aw.get('name', '')
        if award_type in known_by_type:
            entry = known_by_type[award_type]
            year, category, movie, is_winner = entry[1], entry[2], entry[3], entry[4]
            
            parts = []
            if is_winner:
                parts.append('🏆 برنده')
            else:
                parts.append('🎯 نامزد')
            if year:
                parts.append(f'سال {year}')
            if category:
                parts.append(category)
            if movie:
                parts.append(f'برای فیلم {movie}')
            
            note = '، '.join(parts)
            awards[j]['note'] = note
            filled += 1
            print(f'{persian_name}: {award_type} -> {note}')

# Save
json.dump(d, open(DB, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(f'\nFilled {filled} award notes.')

# Final count
d = json.load(open(DB))
a = d['actors']
awards_with_note = sum(sum(1 for aw in (rec.get('awards') or []) if aw.get('note')) for rec in a.values())
awards_without_note = sum(sum(1 for aw in (rec.get('awards') or []) if not aw.get('note')) for rec in a.values())
print(f'Final: {awards_with_note}/{awards_with_note + awards_without_note} awards complete ({awards_with_note/(awards_with_note+awards_without_note)*100:.1f}%)')

if awards_without_note == 0:
    print('🎉 ALL AWARDS COMPLETE!')