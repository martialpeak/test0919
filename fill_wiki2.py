import json
import time
import urllib.request
import urllib.parse

DB = "/root/moviebrowser-alpha/data/app_database.json"
TMDB_KEY = "4e44d9029b1270a757cddc766a1bcb63"

db = json.load(open(DB))
a = db["actors"]

def get_tmdb_bio(pid):
    try:
        url = f"https://api.themoviedb.org/3/person/{pid}?api_key={TMDB_KEY}&language=en-US"
        req = urllib.request.Request(url, headers={"User-Agent": "MB/1.0"})
        with urllib.request.urlopen(req, timeout=20) as r:
            d = json.loads(r.read().decode())
            return d.get("biography", "")
    except Exception as e:
        return ""

def get_wiki_bio(name):
    try:
        q = urllib.parse.quote(name)
        url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{q}"
        req = urllib.request.Request(url, headers={"User-Agent": "MovieBrowser/1.0"})
        with urllib.request.urlopen(req, timeout=20) as r:
            d = json.loads(r.read().decode())
            ext = d.get("extract", "")
            if len(ext) > 40:
                return ext
    except Exception as e:
        pass
    return ""

no_bio = [(n, r) for n, r in a.items() if not r.get("bio")]
print(f"Filling bio for {len(no_bio)} actors")
print("=" * 60)

filled = 0
for name, rec in no_bio:
    pid = rec.get("tmdb_id")
    bio = ""
    src = "?"

    if pid:
        bio = get_tmdb_bio(pid)
        if bio:
            src = "TMDB"

    if not bio:
        bio = get_wiki_bio(name)
        if bio:
            src = "Wiki"

    if bio:
        rec["bio"] = bio
        filled += 1
        print(f"  {name}: {len(bio)} chars ({src})")
    else:
        print(f"  {name}: FAILED")

    json.dump(db, open(DB, "w"), ensure_ascii=False, indent=2)
    time.sleep(1)

print("=" * 60)
print(f"Filled {filled}/{len(no_bio)} bios")
