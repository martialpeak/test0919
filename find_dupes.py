import json
import re

d = json.load(open("/root/moviebrowser-alpha/data/app_database.json"))
a = d["actors"]

def has_persian(s):
    return bool(re.search(r'[\u0600-\u06FF]', s))

# Build map: english key -> persian name, persian key -> english name
# Heuristic: same person if one is persian, other is english transliteration
# We'll match by checking if english version is a common transliteration

# First, find duplicates: for each persian name, is there an english version?
persian_names = [n for n in a if has_persian(n)]
english_names = [n for n in a if not has_persian(n)]

# Manual mapping based on known duplicates from the list
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
}

print(f"Known duplicate pairs: {len(known_map)}")
print("=" * 60)

# Find which pairs BOTH exist in DB
to_merge = []
for eng, per in known_map.items():
    if eng in a and per in a:
        to_merge.append((eng, per))

print(f"Pairs that BOTH exist (will merge): {len(to_merge)}")
for eng, per in to_merge[:10]:
    print(f"  {eng} <-> {per}")

# Also find english entries that have NO persian counterpart but ARE duplicates
# (e.g., "mackenzie foy" vs "مککنزی فوی" - different spelling)
print("=" * 60)
print("Also check fuzzy duplicates (same person, diff spelling)...")
