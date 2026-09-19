import os

db_path = "/root/moviebrowser-alpha/enrich_awards_tmdb.py"
with open(db_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    if "KNOWN_WINNERS.get(key.lower(), [])" in line:
        new_lines.append("        info = KNOWN_WINNERS.get(key.lower())\n")
        new_lines.append("        if info:\n")
        new_lines.append("            is_winner, year, category, movie = info\n")
        new_lines.append("        else:\n")
        new_lines.append("            is_winner, year, category, movie = False, '', '', ''\n")
    else:
        new_lines.append(line)

with open(db_path, "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print("FIXED!")