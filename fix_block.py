#!/usr/bin/env python3
# Read the file and fix the KNOWN_WINNERS block properly
db_path = "/root/moviebrowser-alpha/enrich_awards_tmdb.py"
with open(db_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

# Find the problematic block and fix indentation
# The block should be:
#     for j, aw in enumerate(awards):
#         if not aw.get("note"):
#             total_awards += 1
#             info = KNOWN_WINNERS.get(key.lower())
#             if info:
#                 is_winner, year, category, movie = info
#             else:
#                 is_winner, year, category, movie = False, '', '', ''
#             if year:
#                 note = enrich_note(...)
#                 awards[j]["note"] = note
#                 filled_awards += 1
#                 print(...)
#     time.sleep(0.5)
#     continue

new_lines = []
skip_until_time_sleep = False

for i, line in enumerate(lines):
    # Skip the old broken block
    if skip_until_time_sleep:
        if "time.sleep(0.5)" in line and "    time.sleep(0.5)" == line.strip() or "        time.sleep(0.5)" in line:
            skip_until_time_sleep = False
            new_lines.append(line)
        continue
    
    # Detect the start of the broken block
    if "KNOWN_WINNERS.get(key.lower())" in line and "    info = KNOWN_WINNERS.get" not in line:
        # This line should be inside the for loop, not outside
        # Replace with properly indented block
        indent = "            "  # 12 spaces - inside for j, aw in enumerate
        
        new_lines.append(f"{indent}info = KNOWN_WINNERS.get(key.lower())\n")
        new_lines.append(f"{indent}if info:\n")
        new_lines.append(f"{indent}    is_winner, year, category, movie = info\n")
        new_lines.append(f"{indent}else:\n")
        new_lines.append(f"{indent}    is_winner, year, category, movie = False, '', '', ''\n")
        new_lines.append(f"{indent}if year:\n")
        new_lines.append(f"{indent}    note = enrich_note(aw.get(\"name\", \"\"), movie, category, year, is_winner)\n")
        new_lines.append(f"{indent}    awards[j][\"note\"] = note\n")
        new_lines.append(f"{indent}    filled_awards += 1\n")
        new_lines.append(f"{indent}    print(f\"    Award {{j+1}}: {{aw.get('name')}} -> {{note[:60]}}\")\n")
        
        # Skip until we hit time.sleep(0.5)
        skip_until_time_sleep = True
        continue
    
    new_lines.append(line)

with open(db_path, "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print("Fixed!")
print(f"Lines: {len(lines)} -> {len(new_lines)}")