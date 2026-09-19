#!/usr/bin/env python3
with open("/root/moviebrowser-alpha/enrich_awards_tmdb.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

with open("/root/moviebrowser-alpha/enrich_awards_tmdb.py", "w", encoding="utf-8") as f:
    for line in lines:
        if "KNOWN_WINNERS.get(key.lower(), [])" in line:
            f.write("        info = KNOWN_WINNERS.get(key.lower())\n")
            f.write("        if info:\n")
            f.write("            is_winner, year, category, movie = info\n")
            f.write("        else:\n")
            f.write("            is_winner, year, category, movie = False, '', '', ''\n")
        else:
            f.write(line)

print("FIXED!")