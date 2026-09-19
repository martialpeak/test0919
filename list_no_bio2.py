import json
import re

d = json.load(open("/root/moviebrowser-alpha/data/app_database.json"))
a = d["actors"]

def has_persian(s):
    return bool(re.search(r'[\u0600-\u06FF]', s))

no_bio = [(n, r) for n, r in a.items() if not r.get("bio")]
print(f"Actors WITHOUT bio (after merge): {len(no_bio)}")
print("=" * 60)
for n, r in sorted(no_bio):
    per = "FA" if has_persian(n) else "EN"
    print(f"  [{per}] {n}  (tmdb_id: {r.get('tmdb_id','-')})")
