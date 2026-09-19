#!/usr/bin/env python3
# Upload and check the problematic lines
import subprocess
import base64

code = '''
with open("/root/moviebrowser-alpha/enrich_awards_tmdb.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

print("Lines 155-170:")
for i in range(154, min(170, len(lines))):
    print(f"{i+1}: {repr(lines[i])}")
'''

b64 = base64.b64encode(code.encode()).decode()
cmd = f'ssh root@2.27.29.113 "echo {b64} | base64 -d | python3"'
result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
print(result.stdout)
if result.stderr:
    print("STDERR:", result.stderr)