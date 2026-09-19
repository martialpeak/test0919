#!/usr/bin/env python3
# Fix enrich_awards_tmdb.py KNOWN_WINNERS bug on server
import subprocess

# Kill all previous processes
subprocess.run(['ssh', 'root@2.27.29.113', 'pkill -9 -f enrich_awards'], capture_output=True)

# Upload fix script
import base64
fix_code = '''import sys
db_path = "/root/moviebrowser-alpha/enrich_awards_tmdb.py"
with open(db_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    if "KNOWN_WINNERS.get(key.lower(), [])" in line:
        new_lines.append("        info = KNOWN_WINNERS.get(key.lower())\\n")
        new_lines.append("        if info:\\n")
        new_lines.append("            is_winner, year, category, movie = info\\n")
        new_lines.append("        else:\\n")
        new_lines.append("            is_winner, year, category, movie = False, '', '', ''\\n")
    else:
        new_lines.append(line)

with open(db_path, "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print("FIXED!")
'''

b64 = base64.b64encode(fix_code.encode()).decode()
r = subprocess.run(['ssh', 'root@2.27.29.113', f'echo {b64} | base64 -d | python3'], capture_output=True, text=True)
print(r.stdout)
if r.stderr:
    print("STDERR:", r.stderr)