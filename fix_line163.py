#!/usr/bin/env python3
# Fix line 163 indentation on server
db_path = "/root/moviebrowser-alpha/enrich_awards_tmdb.py"
with open(db_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

# Line 163 (0-indexed: 162) has wrong indent
if "                if year:" in lines[162]:
    lines[162] = "        if year:\n"
    print("Fixed line 163")
else:
    print(f"Line 163 is: {repr(lines[162])}")

with open(db_path, "w", encoding="utf-8") as f:
    f.writelines(lines)
print("Done")