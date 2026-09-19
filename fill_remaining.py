import json
import time
import urllib.request
import urllib.parse

DB = "/root/moviebrowser-alpha/data/app_database.json"
TMDB_KEY = "4e44d9029b1270a757cddc766a1bcb63"
ENV = "/root/.gemini_env"

db = json.load(open(DB))
a = db["actors"]

# Load Gemini key
gemini_key = ""
for line in open(ENV):
    if line.startswith("GEMINI_API_KEY=") and not line.startswith("GEMINI_API_KEYS="):
        gemini_key = line.strip().split("=", 1)[1].strip().strip('"')
        break

def fetch(url, timeout=20):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "MB/1.0"})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read().decode())
    except:
        return None

def gemini(prompt):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key={gemini_key}"
    try:
        data = {"contents": [{"parts": [{"text": prompt}]}]}
        req = urllib.request.Request(url, data=json.dumps(data).encode(),
                                     headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=30) as r:
            d = json.loads(r.read().decode())
            return d["candidates"][0]["content"]["parts"][0]["text"].strip()
    except:
        return None

no_bio = [(n, r) for n, r in a.items() if not r.get("bio")]
print(f"Filling bio for {len(no_bio)} actors")
print("=" * 60)

filled = 0
for name, rec in no_bio:
    pid = rec.get("tmdb_id")
    print(f"{name} (tmdb: {pid})")
    bio = None

    # Try TMDB first
    if pid:
        det = fetch(f"https://api.themoviedb.org/3/person/{pid}?api_key={TMDB_KEY}&language=en-US")
        if det and det.get("biography"):
            bio = det["biography"]

    # Fallback to Gemini (for persian or empty TMDB)
    if not bio:
        prompt = f"یک بیوگرافی کوتاه (۲۰۰-۳۰۰ کلمه) به فارسی برای بازیگر «{name}» بنویس. شامل: معرفی، چند فیلم مهم، جوایز (اگر دارد)."
        bio = gemini(prompt)
        time.sleep(2)

    if bio:
        rec["bio"] = bio
        filled += 1
        print(f"  -> bio: {len(bio)} chars")
    else:
        print(f"  -> FAILED")

    json.dump(db, open(DB, "w"), ensure_ascii=False, indent=2)

print("=" * 60)
print(f"Filled {filled}/{len(no_bio)} bios")
