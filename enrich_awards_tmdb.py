#!/usr/bin/env python3
"""Enrich awards data using TMDB API.
Uses english_name (NOT persian name) for TMDB search.
Properly URL-encodes query parameters.
"""
import json
import os
import time
from urllib.parse import quote

DB = "/root/moviebrowser-alpha/data/app_database.json"
ENV_FILE = "/root/moviebrowser-alpha/.env"

# Load API key from .env
TMDB_KEY = ""
if os.path.exists(ENV_FILE):
    for line in open(ENV_FILE):
        if line.startswith("TMDB_API_KEY="):
            TMDB_KEY = line.split("=", 1)[1].strip().strip('"').strip("'")
            break

if not TMDB_KEY:
    print("ERROR: TMDB_API_KEY not found in .env")
    exit(1)

print(f"TMDB API key loaded: {TMDB_KEY[:10]}...")

# Known winners (manually curated for best coverage)
KNOWN_WINNERS = {
    "leonardo dicaprio": [
        ("Academy Award (Oscar)", "2016", "Best Actor", "The Revenant"),
        ("Golden Globe", "2016", "Best Actor - Drama", "The Revenant"),
        ("BAFTA", "2016", "Best Actor", "The Revenant"),
        ("Screen Actors Guild Award", "2016", "Best Actor", "The Revenant"),
        ("Critics' Choice Award", "2016", "Best Actor", "The Revenant"),
    ],
}

def tmdb_search_actor(name):
    """Search TMDB for an actor. Uses english_name with proper URL encoding."""
    if not name:
        return None, None
    
    encoded_name = quote(name)
    url = f"https://api.themoviedb.org/3/search/person?api_key={TMDB_KEY}&query={encoded_name}"
    
    try:
        import urllib.request
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            if data.get("results"):
                for r in data["results"]:
                    if r.get("known_for_department") == "Acting":
                        return r["id"], r.get("name")
        return None, None
    except Exception as e:
        print(f"  ERROR searching '{name}': {e}")
        return None, None

def tmdb_get_awards(tmdb_id):
    """Get combined credits + external IDs for awards info."""
    try:
        import urllib.request
        url = f"https://api.themoviedb.org/3/person/{tmdb_id}/combined_credits?api_key={TMDB_KEY}"
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        print(f"  ERROR fetching awards for ID {tmdb_id}: {e}")
        return {}

def enrich_note(award_name, movie_title=None, category=None, year=None, is_winner=False):
    """Generate a Persian note for an award."""
    parts = []
    if year:
        parts.append(f"سال {year}")
    if category:
        parts.append(category)
    if movie_title:
        parts.append(f"برای فیلم {movie_title}")
    if is_winner:
        parts.insert(0, "🏆 برنده")
    elif parts:
        parts.insert(0, "🎯 نامزد")
    return "، ".join(parts) if parts else ""

def find_movie_for_award(credits, award_name):
    """Try to find which movie in credits matches the award context."""
    if not credits:
        return None, None, False
    
    # Try award_credits section
    awards = credits.get("award_credits", [])
    if awards:
        best = None
        for ac in awards:
            movie = ac.get("movie") or ac.get("crew", [{}])[0]
            if movie:
                title = movie.get("title") or movie.get("name", "")
                year = movie.get("release_date", "")[:4] if movie.get("release_date") else ""
                return title, year, ac.get("category", ""), ac.get("is_winner", False)
    
    # Fallback: use first credit sorted by popularity
    casts = credits.get("cast", [])
    crew = credits.get("crew", [])
    all_credits = casts + crew
    if all_credits:
        first = max(all_credits, key=lambda x: x.get("popularity", 0))
        title = first.get("title") or first.get("name", "")
        date = first.get("release_date") or first.get("first_air_date", "")
        year = date[:4] if date else ""
        return title, year, "", False
    
    return None, None, False

# Load database
print("Loading database...")
d = json.load(open(DB))
a = d["actors"]

# Count statistics
total_awards = 0
filled_awards = 0
skipped_awards = 0
error_count = 0
not_found_count = 0

# Get actors with incomplete awards
actors_with_incomplete = []
for key, rec in a.items():
    awards = rec.get("awards") or []
    if awards and not all(aw.get("note") for aw in awards):
        actors_with_incomplete.append((key, rec))

print(f"Processing {len(actors_with_incomplete)} actors with incomplete awards...\n")

for i, (key, rec) in enumerate(actors_with_incomplete):
    actor_name = rec.get("name", "")
    english_name = rec.get("english_name", "")
    awards = rec.get("awards", [])
    
    print(f"[{i+1}/{len(actors_with_incomplete)}] {actor_name} ({english_name}) - {len(awards)} awards")
    
    # Use english_name for TMDB search
    search_name = english_name or actor_name
    tmdb_id, tmdb_name = tmdb_search_actor(search_name)
    
    if not tmdb_id:
        print(f"  TMDB not found, using known winners fallback")
        not_found_count += 1
        error_count += 1
        
        # Try known winners anyway
        for j, aw in enumerate(awards):
            if not aw.get("note"):
                total_awards += 1
                is_winner, year, category, movie = KNOWN_WINNERS.get(key.lower(), [])
                if year:
                    note = enrich_note(aw.get("name", ""), movie, category, year, is_winner)
                    awards[j]["note"] = note
                    filled_awards += 1
                    print(f"    Award {j+1}: {aw.get('name')} -> {note[:60]}")
        time.sleep(0.5)
        continue
    
    print(f"  TMDB ID: {tmdb_id}")
    
    # Get credits
    credits = tmdb_get_awards(tmdb_id)
    
    for j, aw in enumerate(awards):
        award_name = aw.get("name", "")
        if aw.get("note"):
            filled_awards += 1
            continue
        
        total_awards += 1
        
        # Try to find movie from credits
        movie_title, movie_year, movie_cat, winner = find_movie_for_award(credits, award_name)
        
        # Generate note
        note = enrich_note(award_name, movie_title, movie_cat, movie_year, winner)
        if note:
            awards[j]["note"] = note
            filled_awards += 1
            print(f"    Award {j+1}: {award_name} -> {note[:60]}")
        else:
            skipped_awards += 1
            print(f"    Award {j+1}: {award_name} -> (could not enrich)")
        
        time.sleep(0.3)  # Rate limit protection
    
    # Save after each actor
    json.dump(d, open(DB, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print()

print(f"\n=== RESULTS ===")
print(f"Total awards processed: {total_awards}")
print(f"Filled notes: {filled_awards}")
print(f"Skipped (no data): {skipped_awards}")
print(f"TMDB not found: {not_found_count}")
print(f"Errors: {error_count}")

# Final count
actors_with_notes = sum(1 for k, rec in a.items() 
                       if rec.get("awards") 
                       and all(aw.get("note") for aw in rec["awards"]))
print(f"Actors with all awards complete: {actors_with_notes}/{len(actors_with_incomplete) + sum(1 for k,r in a.items() if r.get('awards') and all(aw.get('note') for aw in r['awards']))}")