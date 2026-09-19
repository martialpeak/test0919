import json
import re

DB = "/root/moviebrowser-alpha/data/app_database.json"

db = json.load(open(DB))
actors = db.get("actors", {})

# Award patterns to scan in bio text
patterns = [
    (r"Academy Award[s]?", "Academy Award (Oscar)"),
    (r"Golden Globe[s]?", "Golden Globe"),
    (r"BAFTA", "BAFTA"),
    (r"Primetime Emmy|A Emmy|Emmy Award", "Emmy"),
    (r"Tony Award[s]?", "Tony Award"),
    (r"Screen Actors Guild|SAG Award", "Screen Actors Guild Award"),
    (r"Cannes Film Festival|Palme d'Or", "Cannes / Palme d'Or"),
    (r"Berlin Film Festival|Silver Bear|Golden Bear", "Berlin Film Festival"),
    (r"Venice Film Festival|Volpi", "Venice Film Festival"),
    (r"Critics' Choice", "Critics' Choice Award"),
    (r"Independent Spirit", "Independent Spirit Award"),
    (r"Goya Award", "Goya Award"),
    (r"César Award", "César Award"),
]

total = len(actors)
filled = 0
for name, rec in actors.items():
    if rec.get("awards"):
        continue
    bio = rec.get("bio", "")
    if not bio:
        continue
    found = []
    for pat, label in patterns:
        if re.search(pat, bio, re.IGNORECASE):
            found.append({"name": label, "note": ""})
    if found:
        rec["awards"] = found
        filled += 1
        print(f"{name}: {len(found)} awards -> {[f['name'] for f in found]}")

json.dump(db, open(DB, "w"), ensure_ascii=False, indent=2)
print("=" * 60)
print(f"Filled awards for {filled}/{total} actors (scanned from existing bios)")
