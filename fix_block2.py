#!/usr/bin/env python3
# Fix the KNOWN_WINNERS block - all code must be INSIDE the for loop
db_path = "/root/moviebrowser-alpha/enrich_awards_tmdb.py"
with open(db_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

# Find lines 154-169 and replace them with correct code
# The block should look like:
# # Try known winners anyway
# for j, aw in enumerate(awards):
#     if not aw.get("note"):
#         total_awards += 1
#         info = KNOWN_WINNERS.get(key.lower())
#         if info:
#             is_winner, year, category, movie = info
#         else:
#             is_winner, year, category, movie = False, '', '', ''
#         if year:
#             note = enrich_note(aw.get("name", ""), movie, category, year, is_winner)
#             awards[j]["note"] = note
#             filled_awards += 1
#             print(f"    Award {j+1}: {aw.get('name')} -> {note[:60]}")
# time.sleep(0.5)
# continue

# Lines are 0-indexed, so line 154 is index 153
start_idx = None
end_idx = None

for i, line in enumerate(lines):
    if "# Try known winners anyway" in line:
        start_idx = i
    if start_idx is not None and "        time.sleep(0.5)" in line and "    time.sleep(0.5)" not in line:
        end_idx = i
        break

if start_idx and end_idx:
    print(f"Replacing lines {start_idx+1} to {end_idx+1}")
    
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
    
    lines[start_idx:end_idx+1] = new_block
    
    with open(db_path, "w", encoding="utf-8") as f:
        f.writelines(lines)
    print("Fixed! New line count:", len(lines))
else:
    print(f"Block not found: start={start_idx}, end={end_idx}")
    for i, line in enumerate(lines[150:175], start=151):
        print(f"{i}: {repr(line)}")