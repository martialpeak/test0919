import json

d = json.load(open("/root/moviebrowser-alpha/data/app_database.json"))
a = d["actors"]

# All actors without bio
no_bio = [(n, r) for n, r in a.items() if not r.get("bio")]
print(f"TOTAL actors without bio: {len(no_bio)}")
print("=" * 60)

# Heuristic: Indian = latin script, no persian chars, no tmdb_id
import re
def has_persian(s):
    return bool(re.search(r'[\u0600-\u06FF]', s))

indian = []
other = []
for n, r in no_bio:
    if not has_persian(n) and not r.get("tmdb_id"):
        indian.append(n)
    else:
        other.append(n)

print(f"Likely INDIAN (latin, no tmdb_id): {len(indian)}")
for n in sorted(indian):
    print("  -", n)

print()
print(f"Others without bio: {len(other)}")
for n in sorted(other):
    print("  -", n)
