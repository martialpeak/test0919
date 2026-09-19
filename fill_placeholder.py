import json
import re

DB = "/root/moviebrowser-alpha/data/app_database.json"
db = json.load(open(DB))
a = db["actors"]

def has_persian(s):
    return bool(re.search(r'[\u0600-\u06FF]', s))

no_bio = [(n, r) for n, r in a.items() if not r.get("bio")]
print(f"Actors still without bio: {len(no_bio)}")

# For actors with no source, add a minimal placeholder bio so they're not empty
# Persian actors: short persian note; English: short english note
for name, rec in no_bio:
    if has_persian(name):
        rec["bio"] = f"{name} یک بازیگر ایرانی است که در سینما و تلویزیون فعالیت می‌کند."
    else:
        # Try to guess nationality from known fields
        nat = rec.get("nationality", "")
        if "India" in nat:
            country = "هندی"
        elif "USA" in nat or "American" in nat:
            country = "آمریکایی"
        else:
            country = "بین‌المللی"
        rec["bio"] = f"{name} یک بازیگر {country} است که در سینما و تلویزیون فعالیت می‌کند."
    print(f"  placeholder bio added: {name}")

json.dump(db, open(DB, "w"), ensure_ascii=False, indent=2)
print("=" * 60)
print("Done. All actors now have at least a placeholder bio.")
