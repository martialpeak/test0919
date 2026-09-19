#!/usr/bin/env python3
import json

DB = "/root/moviebrowser-alpha/data/app_database.json"
d = json.load(open(DB))
a = d["actors"]

# Show all award name variations (first 20)
print("=== Award name samples ===")
count = 0
for k, rec in a.items():
    awards = rec.get("awards") or []
    for aw in awards:
        if count < 30:
            print(f"{rec.get('name')}: {aw}")
            count += 1

# Get unique award names
print("\n=== Unique award names ===")
award_names = set()
for k, rec in a.items():
    for aw in rec.get("awards") or []:
        aname = aw.get("name", "")
        if aname:
            award_names.add(aname)

for name in sorted(award_names)[:25]:
    print(f"  {name}")
print(f"Total unique award names: {len(award_names)}")