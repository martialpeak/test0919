#!/usr/bin/env python3
# Fix the KNOWN_WINNERS block - manually replace lines 154-169
db_path = "/root/moviebrowser-alpha/enrich_awards_tmdb.py"
with open(db_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

# Replace lines 154-169 (0-indexed: 153-168)
# These are the broken lines that need to be fixed
new_block = [
    "        # Try known winners anyway\n",
    "        for j, aw in enumerate(awards):\n",
    "            if not aw.get(\"note\"):\n",
    "                total_awards += 1\n",
    "                info = KNOWN_WINNERS.get(key.lower())\n",
    "                if info:\n",
    "                    is_winner, year, category, movie = info\n",
    "                else:\n",
    "                    is_winner, year, category, movie = False, '', '', ''\n",
    "                if year:\n",
    "                    note = enrich_note(aw.get(\"name\", \"\"), movie, category, year, is_winner)\n",
    "                    awards[j][\"note\"] = note\n",
    "                    filled_awards += 1\n",
    "                    print(f\"    Award {j+1}: {aw.get('name')} -> {note[:60]}\")\n",
    "        time.sleep(0.5)\n",
    "        continue\n",
]

# Replace lines 153-168 (0-indexed)
lines[153:169] = new_block

with open(db_path, "w", encoding="utf-8") as f:
    f.writelines(lines)

print("Fixed! Lines replaced: 154-169")
print(f"Total lines: {len(lines)}")

# Verify
print("\nVerification (lines 150-175):")
for i in range(149, min(175, len(lines))):
    print(f"{i+1}: {lines[i]}", end='')