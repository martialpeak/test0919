#!/usr/bin/env python3
# Upload and run fix script on server
import subprocess
import base64

# Create the fix script content
fix_content = '''
with open("/root/moviebrowser-alpha/enrich_awards_tmdb.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if "KNOWN_WINNERS.get(key.lower(), [])" in line:
        new_lines.append("        info = KNOWN_WINNERS.get(key.lower())\\n")
        new_lines.append("        if info:\\n")
        new_lines.append("            is_winner, year, category, movie = info\\n")
        new_lines.append("        else:\\n")
        new_lines.append("            is_winner, year, category, movie = False, '', '', ''\\n")
    else:
        new_lines.append(line)

with open("/root/moviebrowser-alpha/enrich_awards_tmdb.py", "w", encoding="utf-8") as f:
    f.writelines(new_lines)
print("FIXED!")
'''

# Encode and send via ssh
b64 = base64.b64encode(fix_content.encode()).decode()
cmd = f'ssh root@2.27.29.113 "echo {b64} | base64 -d > /tmp/fix_awards.py && python3 /tmp/fix_awards.py"'
r = subprocess.run(cmd, shell=True, capture_output=True, text=True)
print(r.stdout)
if r.stderr:
    print("STDERR:", r.stderr)

# Now verify and re-run
print("\n--- Verifying fix ---")
verify_cmd = 'ssh root@2.27.29.113 "grep -A3 KNOWN_WINNERS.get /root/moviebrowser-alpha/enrich_awards_tmdb.py"'
r2 = subprocess.run(verify_cmd, shell=True, capture_output=True, text=True)
print(r2.stdout)