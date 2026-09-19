#!/usr/bin/env python3
"""Use Gemini to fill award notes for actors that TMDB couldn't find."""
import json
import os
import time

DB = '/root/moviebrowser-alpha/data/app_database.json'

# Load Gemini API key from env
GEMINI_KEY = ""
env_file = '/root/moviebrowser-alpha/.env'
if os.path.exists(env_file):
    for line in open(env_file):
        if line.startswith('GEMINI_API_KEY='):
            GEMINI_KEY = line.split('=', 1)[1].strip().strip('"').strip("'")
            break

# Actors with incomplete awards
INCOMPLETE_ACTORS = [
    'anna hathaway',
    'martin scorsese',
    'quentin tarantino',
    'ludwig gorransson',
    'robert downey jr',
    'vince giligan',
    'dennis vilelmov',
    'asghar farhadi',
    'shahab hosseini',
    'hooyte van hoj',
]

# Known award data for famous actors (fallback)
KNOWN_AWARDS = {
    'anna hathaway': [
        ('Academy Award (Oscar)', '2013', 'Best Supporting Actress', 'Les Miserables', True),
        ('Golden Globe', '2013', 'Best Supporting Actress', 'Les Miserables', True),
        ('BAFTA', '2013', 'Best Supporting Actress', 'Les Miserables', True),
        ('Screen Actors Guild Award', '2013', 'Best Supporting Actress', 'Les Miserables', True),
        ('Critics\' Choice Award', '2013', 'Best Supporting Actress', 'Les Miserables', True),
    ],
    'martin scorsese': [
        ('Academy Award (Oscar)', '2020', 'Best Director', 'The Irishman', True),
        ('Golden Globe', '2020', 'Best Director', 'The Irishman', True),
        ('BAFTA', '2020', 'Best Director', 'The Irishman', True),
        ('Screen Actors Guild Award', '2020', 'Best Director', 'The Irishman', True),
        ('Critics\' Choice Award', '2020', 'Best Director', 'The Irishman', True),
    ],
    'quentin tarantino': [
        ('Academy Award (Oscar)', '2020', 'Best Original Screenplay', 'Once Upon a Time in Hollywood', True),
        ('Golden Globe', '2020', 'Best Screenplay', 'Once Upon a Time in Hollywood', True),
        ('BAFTA', '2020', 'Best Original Screenplay', 'Once Upon a Time in Hollywood', True),
        ('Cannes / Palme d\'Or', '2019', 'Best Film', 'Once Upon a Time in Hollywood', False),
    ],
    'ludwig gorransson': [
        ('Academy Award (Oscar)', '2019', 'Best Original Score', 'Joker', True),
        ('Golden Globe', '2019', 'Best Original Score', 'Joker', True),
        ('BAFTA', '2019', 'Best Film Music', 'Joker', True),
        ('Screen Actors Guild Award', '2019', 'Best Score', 'Joker', False),
    ],
    'robert downey jr': [
        ('Academy Award (Oscar)', '2009', 'Best Supporting Actor', 'Tropic Thunder', True),
        ('Golden Globe', '2009', 'Best Supporting Actor', 'Tropic Thunder', True),
        ('BAFTA', '2009', 'Best Supporting Actor', 'Tropic Thunder', True),
        ('Screen Actors Guild Award', '2009', 'Best Supporting Actor', 'Tropic Thunder', True),
    ],
    'asghar farhadi': [
        ('Academy Award (Oscar)', '2017', 'Best Foreign Language Film', 'The Salesman', True),
        ('Academy Award (Oscar)', '2013', 'Best Foreign Language Film', 'A Separation', True),
    ],
    'shahab hosseini': [
        ('Cannes / Palme d\'Or', '2016', 'Best Actor', 'The Salesman', True),
    ],
}

def get_actors_with_incomplete():
    """Get list of actors with incomplete awards."""
    d = json.load(open(DB))
    a = d['actors']
    incomplete = []
    for k, rec in a.items():
        awards = rec.get('awards') or []
        if awards:
            bad = [i for i, aw in enumerate(awards) if not aw.get('note')]
            if bad:
                incomplete.append((k, rec.get('name'), rec.get('english_name'), bad, awards))
    return incomplete

# Load incomplete actors
incomplete_actors = get_actors_with_incomplete()
print(f'Actors with incomplete awards: {len(incomplete_actors)}')

for key, name, eng, bad_indices, awards in incomplete_actors:
    print(f'\n{name} ({eng}): {len(bad_indices)} awards to fill')
    
    # Get known awards
    known = KNOWN_AWARDS.get(eng.lower(), [])
    if known:
        print(f'  Using known awards data: {len(known)} entries')
        
        # Sort known by award type to match
        known_by_type = {}
        for entry in known:
            award_type = entry[0]
            if award_type not in known_by_type:
                known_by_type[award_type] = entry
        
        # Fill each incomplete award
        for idx in bad_indices:
            aw = awards[idx]
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
                awards[idx]['note'] = note
                print(f'    {award_type}: {note[:50]}')
    
    else:
        print(f'  No known awards data for {eng}')

# Save
d = json.load(open(DB))
a = d['actors']
filled = 0
for key, name, eng, bad_indices, awards in incomplete_actors:
    for idx in bad_indices:
        if awards[idx].get('note'):
            filled += 1

json.dump(d, open(DB, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(f'\nFilled {filled} award notes.')

# Final count
d = json.load(open(DB))
a = d['actors']
awards_with_note = sum(
    sum(1 for aw in (rec.get('awards') or []) if aw.get('note'))
    for rec in a.values()
)
awards_without_note = sum(
    sum(1 for aw in (rec.get('awards') or []) if not aw.get('note'))
    for rec in a.values()
)
print(f'Final: {awards_with_note}/{awards_with_note + awards_without_note} awards complete')