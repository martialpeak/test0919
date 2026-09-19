#!/usr/bin/env python3
"""Directly set persian names in app_database.json for the 12 missing actors.
No rate limits, no retries — just sets known translations.
"""
import json

DB = '/root/moviebrowser-alpha/data/app_database.json'
FA_NAMES = {
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
for k, fa in FA_NAMES.items():
    for key, rec in a.items():
        if key.lower() == k.lower():
            rec['name'] = fa
            filled += 1
            print(f'  {rec.get("english_name")} -> {fa}')
            break
    else:
        print(f'  NOT FOUND: {k}')

json.dump(d, open(DB, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(f'\nSaved {filled} persian names.')