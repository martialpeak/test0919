import json
import sys

db = json.load(open("/root/moviebrowser-alpha/data/app_database.json"))
actors = db.get("actors", {})

print("=" * 60)
print(f"Total actors: {len(actors)}")
print("=" * 60)

if not actors:
    print("No actors found in database!")
    sys.exit(0)

# Show fields from first actor
first = list(actors.values())[0]
print(f"\nAvailable fields: {list(first.keys())}")

# Count how many actors have each field filled
fields_to_check = [
    "biography",
    "birth_date",
    "birth_place", 
    "nationality",
    "awards",
    "known_for",
    "photo",
    "job"
]

print("\n" + "-" * 60)
print("Field Completion Statistics:")
print("-" * 60)

for field in fields_to_check:
    filled = 0
    empty = 0
    for name, rec in actors.items():
        value = rec.get(field)
        if value:
            if isinstance(value, str) and len(value.strip()) > 0:
                filled += 1
            elif isinstance(value, (list, dict)) and len(value) > 0:
                filled += 1
            else:
                empty += 1
        else:
            empty += 1
    
    total = filled + empty
    pct = (filled / total * 100) if total > 0 else 0
    print(f"  {field:15s}: {filled:4d}/{total:4d} ({pct:5.1f}%) — {empty} empty")

# Analyze biography quality
print("\n" + "-" * 60)
print("Biography Quality Analysis:")
print("-" * 60)

empty_bios = 0
stub_bios = 0  # Short/placeholder
good_bios = 0

for name, rec in actors.items():
    bio = rec.get("biography", "") or ""
    if len(bio.strip()) == 0:
        empty_bios += 1
    elif len(bio) < 50:  # Very short/placeholder
        stub_bios += 1
    else:
        good_bios += 1

print(f"  Empty bios:     {empty_bios:4d} ({empty_bios/len(actors)*100:.1f}%)")
print(f"  Stub (<50 ch):  {stub_bios:4d} ({stub_bios/len(actors)*100:.1f}%)")
print(f"  Good (>=50 ch): {good_bios:4d} ({good_bios/len(actors)*100:.1f}%)")

# Show some sample stub bios
print("\n" + "-" * 60)
print("Sample Stub/Short Bios (first 5):")
print("-" * 60)

count = 0
for name, rec in actors.items():
    bio = rec.get("biography", "") or ""
    if 0 < len(bio) < 100 and count < 5:
        print(f"\n  {name}:")
        print(f"    Length: {len(bio)} chars")
        print(f"    Content: {bio[:150]}...")
        count += 1

# Count actors missing 3+ important fields
print("\n" + "-" * 60)
print("Actors Missing 3+ Fields:")
print("-" * 60)

important_fields = ["birth_date", "birth_place", "nationality", "awards", "known_for"]
incomplete_actors = []

for name, rec in actors.items():
    missing = []
    for field in important_fields:
        value = rec.get(field)
        if not value:
            missing.append(field)
        elif isinstance(value, str) and len(value.strip()) == 0:
            missing.append(field)
        elif isinstance(value, (list, dict)) and len(value) == 0:
            missing.append(field)
    
    bio = rec.get("biography", "") or ""
    if len(bio) < 100:
        missing.append("bio")
    
    if len(missing) >= 3:
        incomplete_actors.append({"name": name, "missing": missing, "count": len(missing)})

# Sort by most missing
incomplete_actors.sort(key=lambda x: x["count"], reverse=True)

print(f"  Total actors missing 3+ fields: {len(incomplete_actors)}")
print(f"  Total actors fully complete: {len(actors) - len(incomplete_actors)}")

print("\n  Top 10 most incomplete:")
for i, actor in enumerate(incomplete_actors[:10]):
    print(f"    {i+1}. {actor['name'][:40]:40s} — missing {actor['count']} fields: {', '.join(actor['missing'])}")

# Summary
print("\n" + "=" * 60)
print("SUMMARY:")
print("=" * 60)
print(f"  Total actors in database:    {len(actors)}")
print(f"  With good bio (>=100ch):     {sum(1 for n,r in actors.items() if len((r.get('biography') or '')[:100]) >= 100)}")
print(f"  Fully complete (all fields): {len(actors) - len(incomplete_actors)}")
print(f"  Need enrichment:             {len(incomplete_actors)}")
print("=" * 60)