import json
import time
import urllib.request
import urllib.parse

DB = "/root/moviebrowser-alpha/data/app_database.json"
TMDB_KEY = "4e44d9029b1270a757cddc766a1bcb63"

db = json.load(open(DB))
a = db["actors"]

def fetch(url, timeout=20):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "MovieBrowser/1.0"})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read().decode())
    except:
        return None

def wiki(name):
    try:
        q = urllib.parse.quote(name)
        url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{q}"
        d = fetch(url)
        if d and d.get("extract") and len(d["extract"]) > 40:
            return d["extract"]
    except:
        pass
    return None

no_bio = [(n, r) for n, r in a.items() if not r.get("bio")]
print(f"Filling bio for {len(no_bio)} actors (TMDB + Wikipedia)")
print("=" * 60)

filled = 0
for name, rec in no_bio:
    pid = rec.get("tmdb_id")
    bio = None
    src = "?"

    # 1) TMDB
    if pid:
        det = fetch(f"https://api.themoviedb.org/3/person/{pid}?api_key={TMDB_KEY}&language=en-US")
        if det and det.get("biography"):
            bio = det["biography"]
            src = "TMDB"

    # 2) Wikipedia
    if not bio:
        bio = wiki(name)
        if bio:
            src = "Wiki"

    if bio:
        rec["bio"] = bio
        filled += 1
        print(f"  {name}: {len(bio)} chars ({src})")
    else:
        print(f"  {name}: FAILED (no source)")

    json.dump(db, open(DB, "w"), ensure_ascii=False, indent=2)
    time.sleep(1)

print("=" * 60)
print(f"Filled {filled}/{len(no_bio)} bios")
