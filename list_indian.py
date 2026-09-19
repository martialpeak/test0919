import json

d = json.load(open("/root/moviebrowser-alpha/data/app_database.json"))
a = d["actors"]

indian_kw = ["singh","duggal","sandhu","dhillon","kapoor","bajwa","pandher",
             "gadhu","sahota","kaur","yograj","teji","sandeep","nitu","dheeraj",
             "roshni","reet","prakash","ashok","asish","sonu"]

no_bio = []
for n, r in a.items():
    if r.get("bio"):
        continue
    nl = n.lower()
    if any(k in nl for k in indian_kw):
        no_bio.append(n)

print("Indian actors WITHOUT bio:", len(no_bio))
for n in sorted(no_bio):
    print("  -", n)
