import json
import time
import urllib.request

DB = "/root/moviebrowser-alpha/data/app_database.json"
ENV = "/root/.gemini_env"

# Load Gemini key
gemini_key = ""
for line in open(ENV):
    if line.startswith("GEMINI_API_KEY=") and not line.startswith("GEMINI_API_KEYS="):
        gemini_key = line.strip().split("=", 1)[1].strip().strip('"')
        break
if not gemini_key:
    for line in open(ENV):
        if line.startswith("GEMINI_API_KEYS="):
            keys = line.strip().split("=", 1)[1].strip().strip('"').split(",")
            if keys:
                gemini_key = keys[0].strip()
            break

MODEL = "gemini-3.6-flash"
URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={gemini_key}"

def gemini_text(prompt, retries=2):
    for attempt in range(retries):
        try:
            data = {"contents": [{"parts": [{"text": prompt}]}]}
            req = urllib.request.Request(URL, data=json.dumps(data).encode(),
                                         headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=30) as r:
                d = json.loads(r.read().decode())
                return d["candidates"][0]["content"]["parts"][0]["text"].strip()
        except urllib.error.HTTPError as e:
            if e.code == 429:
                print(f"    Rate limited (429), wait 60s...")
                time.sleep(60)
                continue
            else:
                print(f"    HTTP {e.code}: {e.read().decode()[:100]}")
                return None
        except Exception as e:
            print(f"    Err: {e}")
            return None
    return None

db = json.load(open(DB))
actors = db.get("actors", {})

# Only actors with NO bio and NO tmdb_id
todo = [(n, r) for n, r in actors.items() if not r.get("bio") and not r.get("tmdb_id")]
print(f"Actors to enrich with Gemini: {len(todo)}")
print("=" * 60)

filled = 0
for idx, (name, rec) in enumerate(todo):
    print(f"[{idx+1}/{len(todo)}] {name}")
    prompt = f"""یک بیوگرافی کوتاه و جذاب (۲۰۰-۳۰۰ کلمه) به زبان فارسی برای بازیگر «{name}» بنویس.
لطفاً شامل این موارد باشد:
- معرفی کوتاه و سبک بازیگری
- چند فیلم یا سریال مهم او
- افتخارات یا جوایز (اگر می‌دانی)
فقط متن بیوگرافی را بنویس، بدون عنوان یا مقدمه اضافه."""

    bio = gemini_text(prompt)
    if bio:
        rec["bio"] = bio
        filled += 1
        print(f"    bio: {len(bio)} chars")
        json.dump(db, open(DB, "w"), ensure_ascii=False, indent=2)
    else:
        print(f"    FAILED (rate limit or error)")

    time.sleep(3)

print("=" * 60)
print(f"SUMMARY: filled {filled}/{len(todo)} bios with Gemini")
