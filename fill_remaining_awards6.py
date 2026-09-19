#!/usr/bin/env python3
"""Fill remaining award notes - exact award types from DB."""
import json

DB = '/root/moviebrowser-alpha/data/app_database.json'
d = json.load(open(DB))
a = d['actors']

# Exact persian names and award types from DB
KNOWN_AWARDS = {
    'آن هاتاوی': [
        ('Emmy', '2013', 'Outstanding Supporting Actress', 'Les Misérables', True),
    ],
    'مارتین اسکورسیزی': [
        ('Emmy', '2020', 'Outstanding Director', 'The Irishman', False),
        ('Cannes / Palme d\'Or', '2019', 'Best Director', 'The Irishman', False),
    ],
    'کوئنتین تارانتینو': [
        # Already filled by enrich_awards_tmdb.py
    ],
    'لودویگ گورانسون': [
        ('Emmy', '2019', 'Outstanding Original Score', 'Joker', False),
        ("Critics' Choice Award", '2019', 'Best Score', 'Joker', False),
    ],
    'روبرت داونی جونیور': [
        ('Emmy', '2009', 'Outstanding Supporting Actor', 'Tropic Thunder', False),
    ],
    'اصغر فرهادی': [
        ('Berlin Film Festival', '2017', 'Best Screenplay', 'The Salesman', True),
    ],
    'شهاب حسینی': [
        ('Berlin Film Festival', '2016', 'Best Actor', 'The Salesman', True),
    ],
    'وینس گیلیگان': [
        ('BAFTA', '2014', 'Best Script', 'Breaking Bad', True),
        ("Critics' Choice Award", '2014', 'Best Drama Series', 'Breaking Bad', True),
    ],
    'هویته ون هویتما': [
        # Already filled by enrich_awards_tmdb.py
    ],
    'محمود کلاری': [
        ('Cannes / Palme d\'Or', '1998', 'Best Cinematography', 'The Taste of Cherry', False),
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
    
    print(f'{persian_name} (key: {key}): checking {len(known)} known awards...')
    
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
            print(f'  FILL: {award_type} -> {note}')
        else:
            print(f'  SKIP: {award_type} not in known list')

# Save
json.dump(d, open(DB, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(f'\nFilled {filled} award notes.')

# Final count
d = json.load(open(DB))
a = d['actors']
awards_with_note = sum(sum(1 for aw in (rec.get('awards') or []) if aw.get('note')) for rec in a.values())
awards_without_note = sum(sum(1 for aw in (rec.get('awards') or []) if not aw.get('note')) for rec in a.values())
print(f'Final: {awards_with_note}/{awards_with_note + awards_without_note} awards complete ({awards_with_note/(awards_with_note+awards_without_note)*100:.1f}%)')

if awards_without_note > 0:
    print('\nRemaining incomplete actors:')
    for key, rec in a.items():
        awards = rec.get('awards') or []
        if awards:
            bad = [aw for aw in awards if not aw.get('note')]
            if bad:
                print(f'  {rec.get("name")} ({key}): {len(bad)} awards without note')