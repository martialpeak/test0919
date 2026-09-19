#!/usr/bin/env python3
"""GitHub webhook listener for MovieBrowser Alpha (fixed: non-blocking)."""
import http.server
import socketserver
import subprocess
import json
import os
import hmac
import hashlib
from datetime import datetime

LOG_FILE = "/root/moviebrowser-alpha/webhook.log"
DEPLOY_SCRIPT = "/root/moviebrowser-alpha/deploy.sh"
PORT = 9100


class Handler(http.server.BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass

    def _write(self, code, msg):
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(msg.encode("utf-8"))

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)
        ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        with open(LOG_FILE, "a") as f:
            f.write(f"[{ts}] POST {self.path} ({length}b)\n")

        if self.path != "/webhook":
            self._write(404, '{"ok":false}')
            return

        secret = os.environ.get("GITHUB_WEBHOOK_SECRET", "")
        if secret:
            sig = self.headers.get("X-Hub-Signature-256", "")
            mac = hmac.new(secret.encode(), body, hashlib.sha256)
            expected = "sha256=" + mac.hexdigest()
            if not hmac.compare_digest(sig, expected):
                self._write(403, '{"ok":false,"error":"bad signature"}')
                return

        event = self.headers.get("X-GitHub-Event", "")
        try:
            payload = json.loads(body.decode("utf-8", "replace"))
        except Exception:
            payload = {}

        with open(LOG_FILE, "a") as f:
            f.write(f"[{ts}] Event: {event}, ref: {payload.get('ref')}\n")

        if event == "push" and payload.get("ref") == "refs/heads/main":
            with open(LOG_FILE, "a") as f:
                f.write(f"[{ts}] Triggering deploy\n")
            # Fire-and-forget: don't wait for deploy to finish
            subprocess.Popen(
                ["/bin/bash", DEPLOY_SCRIPT],
                stdout=open("/dev/null", "w"),
                stderr=open("/dev/null", "w"),
                close_fds=True,
            )
            self._write(200, '{"ok":true,"action":"deploy_triggered"}')
        else:
            self._write(200, '{"ok":true,"ignored":true}')


if __name__ == "__main__":
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Webhook listener on port {PORT}", flush=True)
        httpd.serve_forever()
