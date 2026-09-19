import json
import time
import urllib.request
import urllib.parse

DB = "/root/moviebrowser-alpha/data/app_database.json"
TMDB_KEY = "4e44d9029b1270a757cddc766a1bcb63"
TMDB = "https://api.themoviedb.org/3"
IMG = "https://image.tmdb.org/t/p/w500"

def fetch(url, timeout=20):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "MovieBrowser/1.0"})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read().decode())
    except Exception as e:
        return None

def wiki_extract(name):
    """Try to get a short bio + awards from Wikipedia (EN)."""
    try:
        q = urllib.parse.quote(name)
        url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{q}"
        req = urllib.request.Request(url, headers={"User-Agent": "MovieBrowser/1.0"})
        with urllib.request.urlopen(req, timeout=15) as r:
            d = json.loads(r.read().decode())
            return d.get("extract", "")
    except Exception:
        return ""

db = json.load(open(DB))
actors = db.get("actors", {})
total = len(actors)

# Find actors needing work
todo = []
for name, rec in actors.items():
    needs = []
    if not rec.get("bio"):
        needs.append("bio")
    if not rec.get("known_for"):
        needs.append("known_for")
    np = rec.get("nationality", "")
    if np and "," in np:  # full place, not country
        needs.append("nationality_fix")
    if needs:
        todo.append((name, rec, needs))

print(f"Total actors: {total}")
print(f"Actors needing work: {len(todo)}")
print("=" * 60)

filled_bio = 0
filled_known = 0
fixed_nat = 0
failed = 0

for idx, (name, rec, needs) in enumerate(todo):
    pid = rec.get("tmdb_id")
    print(f"[{idx+1}/{len(todo)}] {name}  needs={needs}")

    if not pid:
        # No TMDB id - try Wikipedia for bio only
        if "bio" in needs:
            ex = wiki_extract(name)
            if ex:
                rec["bio"] = ex
                filled_bio += 1
                print(f"    bio (wiki): {len(ex)} chars")
        failed += 1
        time.sleep(1)
        continue

    # Fetch TMDB person details (en-US) for bio + place_of_birth
    details = fetch(f"{TMDB}/person/{pid}?api_key={TMDB_KEY}&language=en-US")
    time.sleep(0.3)

    if details:
        # bio
        if "bio" in needs:
            bio = details.get("biography", "")
            if bio:
                rec["bio"] = bio
                filled_bio += 1
                print(f"    bio: {len(bio)} chars")
            else:
                # fallback to wikipedia
                ex = wiki_extract(name)
                if ex:
                    rec["bio"] = ex
                    filled_bio += 1
                    print(f"    bio (wiki fallback): {len(ex)} chars")

        # nationality fix
        if "nationality_fix" in needs:
            pop = details.get("place_of_birth", "")
            if pop and "," in pop:
                country = pop.split(",")[-1].strip()
                rec["nationality"] = country
                fixed_nat += 1
                print(f"    nationality -> {country}")

    # known_for from combined_credits
    if "known_for" in needs:
        cred = fetch(f"{TMDB}/person/{pid}/combined_credits?api_key={TMDB_KEY}&language=en-US")
        time.sleep(0.3)
        if cred:
            cast = cred.get("cast", [])
            # sort by popularity desc, take top 5
            cast.sort(key=lambda c: c.get("popularity", 0) or 0, reverse=True)
            kf = []
            for w in cast[:5]:
                item = {
                    "title": w.get("title") or w.get("name", "Unknown"),
                    "year": (w.get("release_date") or w.get("first_air_date", ""))[:4],
                    "character": w.get("character", ""),
                }
                if w.get("poster_path"):
                    item["poster"] = IMG + w["poster_path"]
                kf.append(item)
            if kf:
                rec["known_for"] = kf
                filled_known += 1
                print(f"    known_for: {len(kf)} items")

    # Save every 25 actors
    if (idx + 1) % 25 == 0:
        json.dump(db, open(DB, "w"), ensure_ascii=False, indent=2)
        print(f"  [SAVE {idx+1}]")

    time.sleep(0.5)

# Final save
json.dump(db, open(DB, "w"), ensure_ascii=False, indent=2)
print("=" * 60)
print(f"SUMMARY")
print(f"  bio filled:     {filled_bio}")
print(f"  known_for:      {filled_known}")
print(f"  nationality fix: {fixed_nat}")
print(f"  failed (no id): {failed}")
print("=" * 60)
