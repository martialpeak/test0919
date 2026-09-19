#!/usr/bin/env python3
import json
DB = '/root/moviebrowser-alpha/data/app_database.json'
FA = {
    'yograj singh': 'یوگراج سینگ',
    'asish duggal': 'آشیش دوگال',
    'teji sandhu': 'تجی ساندو',
    'dilpreet dhillon': 'دلپریت دیلون',
    'sandeep kapoor': 'سندیپ کاپور',
    'nitu pandher': 'نیتو پاندهر',
    'prakash gadhu': 'پراكاش گادو',
    'roshni sahota': 'روشني ساهوتا',
    'reet kaur': 'ريت كور',
    'dheeraj kumar': 'دیراج کومار',
    'sonu bajwa': 'سونو باجوا',
    'ashok salwan': 'آشوک سالوان',
}
d = json.load(open(DB))
a = d['actors']
filled = 0
skipped = 0
for k, fa in FA.items():
    found = False
    for key, rec in a.items():
        if key.lower() == k.lower():
            if not any('\u0600' <= c <= '\u06FF' for c in (rec.get('name') or '')):
                rec['name'] = fa
                filled += 1
                print(f'  SET: {rec.get("english_name")} -> {fa}')
            else:
                skipped += 1
                print(f'  SKIP: {rec.get("english_name")} (already {rec.get("name")})')
            found = True
            break
    if not found:
        print(f'  NOT FOUND: {k}')
        skipped += 1

json.dump(d, open(DB, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(f'\nTotal: {filled} filled, {skipped} skipped')