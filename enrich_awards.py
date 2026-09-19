import json
import time
import urllib.request
import urllib.parse
import re

DB = "/root/moviebrowser-alpha/data/app_database.json"

def wiki_summary(name):
    try:
        q = urllib.parse.quote(name)
        url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{q}"
        req = urllib.request.Request(url, headers={"User-Agent": "MovieBrowser/1.0"})
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read().decode())
    except Exception:
        return None

def wiki_full(name):
    """Fetch full plaintext of the wiki page to scan for awards section."""
    try:
        q = urllib.parse.quote(name)
        url = f"https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&format=json&titles={q}"
        req = urllib.request.Request(url, headers={"User-Agent": "MovieBrowser/1.0"})
        with urllib.request.urlopen(req, timeout=15) as r:
            d = json.loads(r.read().decode())
            pages = d.get("query", {}).get("pages", {})
            for p in pages.values():
                return p.get("extract", "")
    except Exception:
        return ""

db = json.load(open(DB))
actors = db.get("actors", {})

# Actors missing bio OR awards
todo = []
for name, rec in actors.items():
    if not rec.get("bio") or not rec.get("awards"):
        todo.append((name, rec))

print(f"Actors needing bio/awards work: {len(todo)}")
print("=" * 60)

bio_filled = 0
awards_filled = 0

for idx, (name, rec) in enumerate(todo):
    print(f"[{idx+1}/{len(todo)}] {name}")
    summary = wiki_summary(name)
    time.sleep(0.5)

    # Bio (only if missing)
    if not rec.get("bio") and summary:
        ex = summary.get("extract", "")
        if ex and len(ex) > 50:
            rec["bio"] = ex
            bio_filled += 1
            print(f"    bio (wiki): {len(ex)} chars")

    # Awards scan from full page
    if not rec.get("awards"):
        full = wiki_full(name)
        time.sleep(0.5)
        awards = []
        # Look for award-like phrases
        patterns = [
            r"Academy Award[s]?",
            r"Golden Globe[s]?",
            r"BAFTA",
            r"Emmy",
            r"Tony Award[s]?",
            r"SAG Award[s]?",
            r"Cannes",
            r"Palme d'Or",
            r"Berlin(?:al)?e?",
            r"Venice Film Festival",
        ]
        found = set()
        for p in patterns:
            if re.search(p, full, re.IGNORECASE):
                found.add(p)
        if found:
            label_map = {
                r"Academy Award[s]?": "Academy Award (Oscar)",
                r"Golden Globe[s]?": "Golden Globe",
                r"BAFTA": "BAFTA",
                r"Emmy": "Emmy",
                r"Tony Award[s]?": "Tony Award",
                r"SAG Award[s]?": "Screen Actors Guild Award",
                r"Cannes": "Cannes Film Festival",
                r"Palme d'Or": "Palme d'Or",
                r"Berlin(?:al)?e?": "Berlin Film Festival",
                r"Venice Film Festival": "Venice Film Festival",
            }
            for p in found:
                awards.append({"name": label_map.get(p, p), "note": ""})
            rec["awards"] = awards
            awards_filled += 1
            print(f"    awards: {len(awards)} found")

    if (idx + 1) % 30 == 0:
        json.dump(db, open(DB, "w"), ensure_ascii=False, indent=2)
        print(f"  [SAVE {idx+1}]")

    time.sleep(0.3)

json.dump(db, open(DB, "w"), ensure_ascii=False, indent=2)
print("=" * 60)
print(f"SUMMARY")
print(f"  bio filled:  {bio_filled}")
print(f"  awards found: {awards_filled}")
print("=" * 60)
