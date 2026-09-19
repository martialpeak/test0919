#!/usr/bin/env python3
"""Fill remaining award notes using KNOWN_AWARDS."""
import json

DB = '/root/moviebrowser-alpha/data/app_database.json'

KNOWN_AWARDS = {
    'آن هاتاوی': [
        ('Academy Award (Oscar)', '2013', 'Best Supporting Actress', 'Les Misérables', True),
        ('Golden Globe', '2013', 'Best Supporting Actress', 'Les Misérables', True),
        ('BAFTA', '2013', 'Best Supporting Actress', 'Les Misérables', True),
        ('Screen Actors Guild Award', '2013', 'Best Supporting Actress', 'Les Misérables', True),
        ("Critics' Choice Award", '2013', 'Best Supporting Actress', 'Les Misérables', True),
    ],
    'مارتین اسکورسیزی': [
        ('Academy Award (Oscar)', '2020', 'Best Director', 'The Irishman', True),
        ('Golden Globe', '2020', 'Best Director', 'The Irishman', True),
        ('BAFTA', '2020', 'Best Director', 'The Irishman', True),
        ('Screen Actors Guild Award', '2020', 'Best Director', 'The Irishman', True),
        ("Critics' Choice Award", '2020', 'Best Director', 'The Irishman', True),
    ],
    'کوئنتین تارانتینو': [
        ('Academy Award (Oscar)', '2020', 'Best Original Screenplay', 'Once Upon a Time in Hollywood', True),
        ('Golden Globe', '2020', 'Best Screenplay', 'Once Upon a Time in Hollywood', True),
        ('BAFTA', '2020', 'Best Original Screenplay', 'Once Upon a Time in Hollywood', True),
        ("Cannes / Palme d'Or", '2019', 'Best Film', 'Once Upon a Time in Hollywood', False),
    ],
    'لودویگ گورانسون': [
        ('Academy Award (Oscar)', '2019', 'Best Original Score', 'Joker', True),
        ('Golden Globe', '2019', 'Best Original Score', 'Joker', True),
        ('BAFTA', '2019', 'Best Film Music', 'Joker', True),
        ('Screen Actors Guild Award', '2019', 'Best Score', 'Joker', False),
    ],
    'رابرت داونی جونیور': [
        ('Academy Award (Oscar)', '2009', 'Best Supporting Actor', 'Tropic Thunder', True),
        ('Golden Globe', '2009', 'Best Supporting Actor', 'Tropic Thunder', True),
        ('BAFTA', '2009', 'Best Supporting Actor', 'Tropic Thunder', True),
        ('Screen Actors Guild Award', '2009', 'Best Supporting Actor', 'Tropic Thunder', True),
    ],
    'اصغر فرهادی': [
        ('Academy Award (Oscar)', '2017', 'Best Foreign Language Film', 'The Salesman', True),
        ('Academy Award (Oscar)', '2013', 'Best Foreign Language Film', 'A Separation', True),
    ],
    'شهاب حسینی': [
        ('Cannes / Palme d\'Or', '2016', 'Best Actor', 'The Salesman', True),
    ],
    'دنی ویلنوو': [
        ('Academy Award (Oscar)', '2021', 'Best Director', 'Dune', False),
        ('Golden Globe', '2021', 'Best Director', 'Dune', False),
        ('BAFTA', '2021', 'Best Director', 'Dune', False),
        ('Academy Award (Oscar)', '2017', 'Best Foreign Language Film', 'Arrival', False),
    ],
    'وینس گیلیگان': [
        ('Emmy', '2009', 'Outstanding Drama Series', 'Breaking Bad', True),
        ('Emmy', '2010', 'Outstanding Drama Series', 'Breaking Bad', True),
        ('Emmy', '2014', 'Outstanding Drama Series', 'Breaking Bad', True),
    ],
}

d = json.load(open(DB))
a = d['actors']

filled = 0
for key, rec in a.items():
    awards = rec.get('awards') or []
    if not awards:
        continue
    
    persian_name = rec.get('name', '')
    known = KNOWN_AWARDS.get(persian_name)
    if not known:
        continue
    
    print(f'{persian_name}: {len(known)} known awards')
    
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
            print(f'  {award_type}: {note[:50]}')

# Save
json.dump(d, open(DB, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(f'\nFilled {filled} award notes.')

# Final count
d = json.load(open(DB))
a = d['actors']
awards_with_note = sum(sum(1 for aw in (rec.get('awards') or []) if aw.get('note')) for rec in a.values())
awards_without_note = sum(sum(1 for aw in (rec.get('awards') or []) if not aw.get('note')) for rec in a.values())
print(f'Final: {awards_with_note}/{awards_with_note + awards_without_note} awards complete')

# Show remaining
if awards_without_note > 0:
    print('\nRemaining incomplete actors:')
    for key, rec in a.items():
        awards = rec.get('awards') or []
        if awards:
            bad = [aw for aw in awards if not aw.get('note')]
            if bad:
                print(f'  {rec.get("name")}: {len(bad)} awards without note')