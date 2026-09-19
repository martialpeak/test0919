#!/bin/bash
# Daily backup of live data files (recreated 2026-09-15 — the old copy was deleted
# by deploy.sh's destructive find-line; see commit 275f439).
# Keeps the last 14 days. data/backups/ is inside data/ (untracked from git now).
set -e
cd /root/moviebrowser-alpha
DIR="data/backups/$(date +%F)"
mkdir -p "$DIR"
for f in app_database.json movies.json actor_photo_map.json; do
  [ -f "data/$f" ] && cp -f "data/$f" "$DIR/"
done
# Retention: keep only the 14 newest day-folders
ls -1dt data/backups/*/ 2>/dev/null | tail -n +15 | xargs -r rm -rf
echo "[$(date)] backup complete -> $DIR ($(ls "$DIR" | wc -l) files)"
