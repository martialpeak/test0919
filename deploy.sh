#!/bin/bash
# Auto-deploy: pull latest, rebuild, restart.
# SAFETY RULES (learned the hard way on 2026-09-15):
#   - data/ is NEVER touched (it is untracked; git never overwrites it)
#   - NO destructive cleanup: if an untracked file blocks the pull, the deploy
#     is SKIPPED, not force-deleted. An old version of this script ran
#     `find . -maxdepth 1 ... -exec rm -f` and wiped root files + reverted data.
set -e
cd /root/moviebrowser-alpha

git fetch origin main
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
  echo "[$(date)] No new commits. Nothing to do."
  exit 0
fi

echo "[$(date)] New commit detected ($LOCAL -> $REMOTE). Deploying..."

if ! git pull --ff-only origin main; then
  echo "[$(date)] git pull FAILED (untracked-file conflict?) — deploy SKIPPED, nothing deleted."
  exit 1
fi

npm run build
systemctl restart moviebrowser-alpha
echo "[$(date)] Deploy complete: $(curl -s http://localhost:3000/api/version)"
