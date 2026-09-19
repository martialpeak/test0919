#!/usr/bin/env python3
import json
d = json.load(open('/root/moviebrowser-alpha/data/app_database.json'))
a = d['actors']
checks = ['yograj singh','prakash gadhu','ashok salwan','nitu pandher','reet kaur','sandeep kapoor']
for k in checks:
    for key, rec in a.items():
        if key.lower() == k.lower():
            has_fa = any('\u0600' <= c <= '\u06FF' for c in (rec.get('name') or ''))
            print(f'{k} -> name: {rec.get("name")!r} | has_fa: {has_fa}')
            break