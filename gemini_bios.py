import json
import time
import urllib.request
import os

DB = "/root/moviebrowser-alpha/data/app_database.json"
ENV = "/root/.gemini_env"

# Load Gemini key
gemini_key = ""
for line in open(ENV):
    if line.startswith("GEMINI_API_KEY=") and not line.startswith("GEMINI_API_KEYS="):
        gemini_key = line.strip().split("=", 1)[1].strip().strip('"')
        break
if not gemini_key:
    # try GEMINI_API_KEYS (comma separated)
    for line in open(ENV):
        if line.startswith("GEMINI_API_KEYS="):
            keys = line.strip().split("=", 1)[1].strip().strip('"').split(",")
            if keys:
                gemini_key = keys[0].strip()
            break

print(f"Gemini key loaded: {len(gemini_key)} chars")

MODEL = "gemini-3.6-flash"
URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={gemini_key}"

def gemini_text(prompt, max_retries=3):
    for attempt in range(max_retries):
        try:
            data = {"contents": [{"parts": [{"text": prompt}]}]}
            req = urllib.request.Request(
                URL,
                data=json.dumps(data).encode(),
                headers={"Content-Type": "application/json"},
            )
            with urllib.request.urlopen(req, timeout=30) as r:
                d = json.loads(r.read().decode())
                return d["candidates"][0]["content"]["parts"][0]["text"].strip()
        except urllib.error.HTTPError as e:
            if e.code == 429:  # rate limit
                wait = 15 * (attempt + 1)
                print(f"    Rate limited, waiting {wait}s...")
                time.sleep(wait)
                continue
            else:
                print(f"    HTTP Error {e.code}: {e.read().decode()[:150]}")
                return None
        except Exception as e:
            print(f"    Error: {e}")
            return None
    return None

db = json.load(open(DB))
actors = db.get("actors", {})

# Actors without bio
todo = [(n, r) for n, r in actors.items() if not r.get("bio")]
print(f"Actors without bio: {len(todo)}")
print("=" * 60)

filled = 0
for idx, (name, rec) in enumerate(todo):
    print(f"[{idx+1}/{len(todo)}] {name}")

    # Build a prompt with available context
    ctx = []
    if rec.get("birth_date"):
        ctx.append(f"تاریخ تولد: {rec['birth_date']}")
    if rec.get("birth_place"):
        ctx.append(f"زادگاه: {rec['birth_place']}")
    if rec.get("nationality"):
        ctx.append(f"ملیت: {rec['nationality']}")
    if rec.get("known_for"):
        kf = ", ".join([k.get("title", "") for k in rec["known_for"][:3]])
        ctx.append(f"آثار شاخص: {kf}")

    ctx_str = "\n".join(ctx) if ctx else ""
    prompt = f"""یک بیوگرافی کوتاه و جذاب (۲۰۰-۳۰۰ کلمه) به زبان فارسی برای بازیگر «{name}» بنویس.
{ctx_str}
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
    else:
        print(f"    FAILED")

    # Save every 10 actors
    if (idx + 1) % 10 == 0:
        json.dump(db, open(DB, "w"), ensure_ascii=False, indent=2)
        print(f"  [SAVE {idx+1}]")

    time.sleep(2)  # gentle pacing

# Final save
json.dump(db, open(DB, "w"), ensure_ascii=False, indent=2)
print("=" * 60)
print(f"SUMMARY: filled {filled}/{len(todo)} bios with Gemini")
