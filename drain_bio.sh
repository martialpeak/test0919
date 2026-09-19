#!/bin/bash
# Drain the missing-bio queue in batches until empty. Safe: server has a running-guard.
cd /root/moviebrowser-alpha
cp data/app_database.json "data/app_database.json.bak-biofill-$(date +%H%M)"
echo "DB backed up"
for i in $(seq 1 8); do
  resp=$(curl -s --max-time 20 -X POST http://localhost:3000/api/actors/bio-backfill-missing -H 'Content-Type: application/json' -d '{"limit":15}')
  q=$(echo "$resp" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("queued",0))' 2>/dev/null || echo 0)
  echo "[$(date +%H:%M:%S)] batch $i fired, queued=$q"
  if [ "$q" = "0" ]; then echo "QUEUE EMPTY"; break; fi
  sleep 55
done
echo "=== final state ==="
python3 -c "
import json
d=json.load(open('data/app_database.json'))
a=d['actors']
ms=[k for k,v in a.items() if not (v.get('biography') or v.get('bio'))]
print('missing_bio final:', len(ms))
for k in ms: print('  -', repr(k))
"
