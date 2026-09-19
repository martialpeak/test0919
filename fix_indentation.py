#!/usr/bin/env python3
# Fix the KNOWN_WINNERS bug AND the indentation issue
import re

db_path = "/root/moviebrowser-alpha/enrich_awards_tmdb.py"
with open(db_path, "r", encoding="utf-8") as f:
    content = f.read()

# Find and replace the problematic section
# Replace the KNOWN_WINNERS fallback code
old_pattern = r'        info = KNOWN_WINNERS\.get\(key\.lower\(\)\)\n        if info:\n            is_winner, year, category, movie = info\n        else:\n            is_winner, year, category, movie = False, \'\', \'\', \'\'\n                if year:'

new_pattern = '''        info = KNOWN_WINNERS.get(key.lower())
        if info:
            is_winner, year, category, movie = info
        else:
            is_winner, year, category, movie = False, '', '', ''
        
        if year:'''

if old_pattern in content:
    content = content.replace(old_pattern, new_pattern)
    print("Found and fixed pattern!")
else:
    print("Pattern not found. Let me show the actual content:")
    lines = content.split("\n")
    for i, line in enumerate(lines[150:170], start=151):
        print(f"{i}: {repr(line)}")

with open(db_path, "w", encoding="utf-8") as f:
    f.write(content)
print("File updated!")