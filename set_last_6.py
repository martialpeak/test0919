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
}
d = json.load(open(DB))
a = d['actors']
for k, fa in FA.items():
    for key, rec in a.items():
        if key.lower() == k.lower():
            rec['name'] = fa
            print(f'  {rec.get("english_name")} -> {fa}')
            break
json.dump(d, open(DB, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('Done.')