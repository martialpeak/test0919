import json
import time
import urllib.request

DB = "/root/moviebrowser-alpha/data/app_database.json"
ENV = "/root/.gemini_env"

# Load all Gemini keys
keys = []
for line in open(ENV):
    s = line.strip()
    if s.startswith("GEMINI_API_KEY=") and not s.startswith("GEMINI_API_KEYS="):
        k = s.split("=", 1)[1].strip().strip('"')
        if k:
            keys.append(k)
    elif s.startswith("GEMINI_API_KEYS="):
        for k in s.split("=", 1)[1].strip().strip('"').split(","):
            k = k.strip()
            if k:
                keys.append(k)
print(f"Loaded {len(keys)} Gemini key(s)")

# Multiple models to rotate through (from server.ts config)
MODELS = [
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-3.6-flash",
    "gemini-3.7-flash",
]
print(f"Models to try: {MODELS}")

def gemini_text(prompt, max_attempts=15):
    """Try each model + key combo until one works (cascade fallback)."""
    attempts = 0
    while attempts < max_attempts:
        key = keys[attempts % len(keys)]
        model = MODELS[attempts % len(MODELS)]
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
        try:
            data = {"contents": [{"parts": [{"text": prompt}]}]}
            req = urllib.request.Request(url, data=json.dumps(data).encode(),
                                         headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=30) as r:
                d = json.loads(r.read().decode())
                return d["candidates"][0]["content"]["parts"][0]["text"].strip()
        except urllib.error.HTTPError as e:
            if e.code == 429:
                attempts += 1
                time.sleep(3)
                continue
            else:
                attempts += 1
                time.sleep(2)
                continue
        except Exception:
            attempts += 1
            time.sleep(2)
            continue
    return None

db = json.load(open(DB))
actors = db.get("actors", {})
todo = [(n, r) for n, r in actors.items() if not r.get("bio") and not r.get("tmdb_id")]
print(f"Actors to enrich with Gemini (multi-model cascade): {len(todo)}")
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
        print(f"    FAILED (all models/keys rate-limited)")
    time.sleep(2)

print("=" * 60)
print(f"SUMMARY: filled {filled}/{len(todo)} bios")
