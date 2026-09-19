#!/usr/bin/env python3
import json
d = json.load(open('/root/moviebrowser-alpha/data/app_database.json'))
a = d['actors']
no_fa = [k for k,r in a.items() if not any('\u0600'<=c<='\u06FF' for c in (r.get('name') or ''))]
no_en = [k for k,r in a.items() if not r.get('english_name')]
print('total:', len(a))
print('missing persian:', len(no_fa))
print('missing english_name:', len(no_en))
if not no_fa and not no_en:
    print('=== ALL 221 actors fully complete! ===')
else:
    print('remaining:', [r.get('english_name') for k in no_fa])