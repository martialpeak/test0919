import json

db = json.load(open("/root/moviebrowser-alpha/data/app_database.json"))
actors = db.get("actors", {})

total = len(actors)
fields = ["bio", "photo", "job", "birth_date", "birth_place", "nationality", "known_for", "awards"]

print("=" * 60)
print(f"Total actors: {total}")
print("=" * 60)

counts = {}
for f in fields:
    c = sum(1 for a in actors.values() if a.get(f))
    counts[f] = c
    pct = (c / total * 100) if total else 0
    bar = "#" * int(pct / 5)
    print(f"{f:12} {c:4}/{total:4}  {pct:5.1f}%  {bar}")

print("=" * 60)
# Show a few sample actors
print("Sample actors:")
for name in list(actors.keys())[:5]:
    a = actors[name]
    print(f"\n  {name}:")
    print(f"    birth_date: {a.get('birth_date', '-')}")
    print(f"    birth_place: {a.get('birth_place', '-')}")
    print(f"    nationality: {a.get('nationality', '-')}")
    print(f"    known_for: {len(a.get('known_for', []))} items")
    print(f"    bio: {len(a.get('bio', ''))} chars")
