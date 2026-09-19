#!/usr/bin/env python3
# Fix deploy.sh to keep python helper scripts
deploy_path = "/root/moviebrowser-alpha/deploy.sh"
with open(deploy_path, "r") as f:
    content = f.read()

# Add python scripts to git clean whitelist
old = 'git clean -fd -e "data/" -e ".env" -e "node_modules/" -e "deploy.sh" -e "webhook_listener.py" -e "webhook.log"'
new = 'git clean -fd -e "data/" -e ".env" -e "node_modules/" -e "deploy.sh" -e "webhook_listener.py" -e "webhook.log" -e "*.py"'

if old in content:
    content = content.replace(old, new)
    with open(deploy_path, "w") as f:
        f.write(content)
    print("FIXED: deploy.sh now keeps *.py files")
else:
    print("Pattern not found, showing relevant line:")
    for line in content.split("\n"):
        if "git clean" in line:
            print(f"  Found: {line}")