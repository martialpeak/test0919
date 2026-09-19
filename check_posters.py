import urllib.request, json

d = json.load(urllib.request.urlopen("http://localhost:3000/api/movies"))
print("Total movies:", len(d))
print("=" * 70)
for m in d[:8]:
    title = m.get("title", "?")
    poster = m.get("poster_url", "")
    print(f"{title[:28]:28} | {poster[:90]}")
print("=" * 70)
tmdb = sum(1 for m in d if "image.tmdb.org" in (m.get("poster_url") or ""))
proxied = sum(1 for m in d if "/api/img-proxy" in (m.get("poster_url") or ""))
local = sum(1 for m in d if m.get("poster_url","").startswith("/"))
print(f"TMDB direct (filtered): {tmdb}")
print(f"Proxied via /api/img-proxy: {proxied}")
print(f"Local/other: {local}")
