import json
import urllib.request
import urllib.parse

TMDB_KEY = "4e44d9029b1270a757cddc766a1bcb63"
DB = "/root/moviebrowser-alpha/data/movies.json"

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "MovieBrowser/1.0"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode())

db = json.load(open(DB))
changed = 0
for m in db:
    pu = m.get("poster_url") or ""
    if "/api/movies/" not in pu:
        continue
    imdb = m.get("imdb_id", "")
    title = m.get("title", "")
    poster = None
    # Try TMDB by IMDB id
    if imdb:
        try:
            tv = "tv" if m.get("type") == "series" else "movie"
            data = fetch(f"https://api.themoviedb.org/3/find/{imdb}?api_key={TMDB_KEY}&external_source=imdb_id")
            results = (data.get("movie_results") or []) + (data.get("tv_results") or [])
            if results and results[0].get("poster_path"):
                poster = "https://image.tmdb.org/t/p/w780" + results[0]["poster_path"]
        except Exception as e:
            print(f"  IMDB lookup failed for {title}: {e}")
    # Fallback: search by title
    if not poster and title:
        try:
            q = urllib.parse.quote(title)
            data = fetch(f"https://api.themoviedb.org/3/search/movie?api_key={TMDB_KEY}&query={q}&language=fa-IR")
            if data.get("results"):
                p = data["results"][0].get("poster_path")
                if p:
                    poster = "https://image.tmdb.org/t/p/w780" + p
        except Exception as e:
            print(f"  Title search failed for {title}: {e}")
    if poster:
        m["poster_url"] = poster
        print(f"  FIXED {title}: {poster[:80]}")
        changed += 1
    else:
        print(f"  NO poster found for {title}")

if changed:
    json.dump(db, open(DB, "w"), ensure_ascii=False, indent=2)
    print(f"\nSaved {changed} fixed posters.")
else:
    print("\nNothing changed.")
