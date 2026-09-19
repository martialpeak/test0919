import json
import re

DB = "/root/moviebrowser-alpha/data/app_database.json"
db = json.load(open(DB))
a = db["actors"]

def has_persian(s):
    return bool(re.search(r'[\u0600-\u06FF]', s))

# Known mapping: english_key -> persian_name (the canonical persian entry to keep)
known_map = {
    "al pacino": "آل پاچینو",
    "anne hathaway": "آن هاتاوی",
    "aaron paul": "آرون پال",
    "awkwafina": "آکوافینا",
    "bryan cranston": "برایان کرانستون",
    "bob odenkirk": "باب اودنکرک",
    "bob gunton": "باب گانتون",
    "bahram afshari": "بهرام افشاری",
    "bridget fonda": "بریجت فوندا",
    "christopher nolan": "کریستوفر نولان",
    "christopher walken": "کریستوفر واکن",
    "cillian murphy": "کیلین مورفی",
    "colin farrell": "کالین فارل",
    "danny devito": "دنی دویتو",
    "deepika padukone": "دیپیکا پادوکونه",
    "denis villeneuve": "دنی ویلنوو",
    "diane keaton": "دایان کیتون",
    "emily blunt": "امیلی بلانت",
    "florence pugh": "فلورنس پیو",
    "giancarlo esposito": "جانکارلو اسپوزیتو",
    "hans zimmer": "هانس زیمر",
    "harvey keitel": "هروی کیتل",
    "hoyte van hoytema": "هویته ون هویتما",
    "jack black": "جک بلک",
    "jack nicholson": "جک نیکلسون",
    "joe mantegna": "جو مانtegna",
    "jonathan banks": "جاناتان بنکس",
    "kelsey mann": "کلسی مان",
    "kim basinger": "کیم بسینجر",
    "ludwig göransson": "لودویگ گورانسون",
    "mackenzie foy": "مکنزی فوی",
    "mahoud pakniyat": "محمود پاکنیت",
    "matt damon": "مت دیمون",
    "matt reeves": "مت ریوز",
    "maya hawke": "مایا هاوک",
    "michael giacchino": "مایکل جیاکینو",
    "michael keaton": "مایکل کین",
    "michelle pfeiffer": "میشل فایفر",
    "nayanthara": "نایانتارا",
    "robert downey jr.": "رابرت داونی جونیور",
    "robert pattinson": "رابرت پتینسون",
    "shah rukh khan": "شاهرخ خان",
    "shahab hosseini": "شهاب حسینی",
    "sonu bajwa": "سونو باجوا",
    "timothée chalamet": "تیموتی شالامی",
    "tom berenger": "تام برنجر",
    "tony hale": "تونی هیل",
    "vijay sethupathi": "ویجی ستوپاتی",
    "vince gilligan": "وینس گیلیگان",
    "viola davis": "وایولا دیویس",
    "yograj singh": "یوگراج سینگ",
    "zendaya": "زندایا",
    "zoë kravitz": "زوئی کراویتز",
    "amir hossein fathi": "امیرحسین فتحی",
    "bamdad afshar": "بامداد افشار",
    "ebrahim amerian": "سید ابراهیم عامریان",
    "iman safa": "ایمان صفا",
    "babak karimi": "بابک کریمی",
    "pejman jamshidi": "پژمان جمشیدی",
    "pardis ahmadieh": "پردیس احمدیه",
    "parinaz izadyar": "پریناز ایزدیار",
    "payman maadi": "پیمان معادی",
    "pantea bahram": "پانتهآ بهرام",
    "roya nonahali": "رویا نونهالی",
    "rezza kianian": "رضا کیانیان",
    "saarhe biat": "ساره بیات",
    "sahar dolatshahi": "سحر دولتشاهی",
    "taraneh alidoosti": "ترانه علیدوستی",
    "hadi hejazifar": "هادی حجازیفر",
    "hadi kazemi": "هادی کاظمی",
    "hamid farrokhnezhad": "حمید فرخنژاد",
    "ali nasirian": "علی نصیریان",
    "alireza kamali": "عللیرضا کمالی",
    "merila zarei": "مریلا زارعی",
    "mostafa zamani": "مصطفی زمانی",
    "mehdi soltani": "مهدی سلطانی",
    "nader soleimani": "نادر سلیمانی",
    "omid roohani": "امید روحانی",
    "masoud roohnikan": "مسعود روه‌نیکان",
    "mohsen chavoshi": "محسن چاوشی",
    "gelareh abbasi": "گلاره عباسی",
    "elnaz habibi": "الناز حبیبی",
    "soheil ghanadan": "سهیل قنادان",
    "sam nouri": "سام نوری",
    "saman moghaddam": "سامان مقدم",
    "siavash cheraghipour": "سیاوش چراغی‌پور",
    "seyed javad hashemi": "سید جواد هاشمی",
    "talia shire": "تالیا شایر",
    "qucincy tyler bernstine": "کوئینسی تایلر برنستاین",
    "anna gunn": "آنا گان",
    "michael gough": "مایکل گاف",
    "robert wuhl": "رابرت وول",
    "james whitmore": "جیمز وایتمور",
    "larry brandenburg": "لری براندنبورگ",
    "brian libby": "برایان لیبی",
    "mark rolston": "مارک رولستون",
    "neil giuntoli": "نیل جیونتولی",
    "gil bellows": "گیل بلوز",
    "lewis black": "لوئیس بلک",
    "phyllis smith": "فیلیس اسمیت",
    "amy poehler": "امی پولر",
    "amanda plummer": "آماندا پلمبر",
    "eli wallach": "الی والاچ",
    "bruno kirby": "برونو کیرby",
    "dheeraj kumar": "دهیراج کومار",
    "roshni sahota": "روشنی ساهوتا",
    "sandeep kapoor": "ساندیپ کاپور",
    "teji sandhu": "تجی سندو",
    "yograj singh": "یوگراج سینگ",
    "nitu pandher": "نیتو پاندهر",
    "prakash gadhu": "پراکاش گادو",
    "reet kaur": "ریت کائور",
    "asish duggal": "آشیش داگال",
    "ashok salwan": "اشوک سالوان",
    "dilpreet dhillon": "دیلپریت دیلون",
    "george hamilton": "جرج همیلتون",
    "adelmo vitale": "آدلمو ویتاله",
}

# Only merge pairs that BOTH exist in DB
merged = 0
for eng_key, per_name in known_map.items():
    if eng_key in a and per_name in a:
        eng_rec = a[eng_key]
        per_rec = a[per_name]
        # Keep the persian entry as canonical, merge english data into it
        # Prioritize non-empty fields from either
        for field in ["bio", "photo", "birth_date", "birth_place", "nationality",
                      "known_for", "awards", "job", "tmdb_id"]:
            if not per_rec.get(field) and eng_rec.get(field):
                per_rec[field] = eng_rec[field]
            elif per_rec.get(field) and eng_rec.get(field) and field in ("known_for", "awards"):
                # merge lists
                if isinstance(per_rec[field], list) and isinstance(eng_rec[field], list):
                    existing = {json.dumps(x, sort_keys=True) for x in per_rec[field]}
                    for x in eng_rec[field]:
                        if json.dumps(x, sort_keys=True) not in existing:
                            per_rec[field].append(x)
        # Add english name as alias
        if "aliases" not in per_rec:
            per_rec["aliases"] = []
        if eng_key not in per_rec["aliases"]:
            per_rec["aliases"].append(eng_key)
        # Remove the english entry
        del a[eng_key]
        merged += 1
        print(f"Merged: {eng_key} -> {per_name}")

# Save
json.dump(db, open(DB, "w"), ensure_ascii=False, indent=2)
print("=" * 60)
print(f"Merged {merged} duplicate pairs")
print(f"Remaining actors: {len(a)}")
