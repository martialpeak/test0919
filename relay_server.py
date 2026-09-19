#!/usr/bin/env python3
"""
TCP Relay Server for Cloudflare Worker
Listens on port 19999, reads target from first line, relays traffic.

Deploy on VPS:
  python3 relay_server.py --port 19999

Worker connects to this, sends "HOST:PORT\n" as first message,
then relays raw TCP data bidirectionally.
"""

import asyncio
import struct
import sys

LOG = True


async def relay(reader, writer, label=""):
    try:
        while True:
            data = await reader.read(65536)
            if not data:
                break
            writer.write(data)
            await writer.drain()
    except asyncio.CancelledError:
        pass
    except Exception as e:
        if LOG:
            print(f"[{label}] relay error: {e}")
    finally:
        try:
            writer.close()
        except Exception:
            pass


async def handle_client(client_reader, client_writer):
    peer = client_writer.get_extra_info('peername')
    label = f"{peer[0]}:{peer[1]}" if peer else "?"

    try:
        # Read first line: "HOST:PORT"
        line = await asyncio.wait_for(client_reader.readline(), timeout=10)
        target = line.decode('utf-8', errors='replace').strip()

        if not target:
            log(f"[{label}] No target, closing")
            client_writer.close()
            return

        # Parse target
        colon_idx = target.rfind(':')
        if colon_idx == -1:
            log(f"[{label}] Invalid target: {target}")
            client_writer.close()
            return

        host = target[:colon_idx]
        port = int(target[colon_idx + 1:])

        log(f"[{label}] Relay to {host}:{port}")

        # Connect to target
        try:
            target_reader, target_writer = await asyncio.wait_for(
                asyncio.open_connection(host, port),
                timeout=10
            )
        except Exception as e:
            log(f"[{label}] Connect failed: {e}")
            client_writer.close()
            return

        log(f"[{label}] Connected to {host}:{port}, relaying...")

        # Bidirectional relay
        t1 = asyncio.create_task(relay(client_reader, target_writer, f"{label}->target"))
        t2 = asyncio.create_task(relay(target_reader, client_writer, f"{label}->client"))

        await asyncio.gather(t1, t2, return_exceptions=True)

        log(f"[{label}] Relay closed")

    except asyncio.TimeoutError:
        log(f"[{label}] Timeout")
    except Exception as e:
        log(f"[{label}] Error: {e}")
    finally:
        try:
            client_writer.close()
        except Exception:
            pass


def log(msg):
    if LOG:
        print(msg, flush=True)


async def main(host='0.0.0.0', port=19999):
    server = await asyncio.start_server(handle_client, host, port)
    log(f"Relay server listening on {host}:{port}")

    async with server:
        await server.serve_forever()


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='TCP Relay for CF Worker')
    parser.add_argument('--host', default='0.0.0.0')
    parser.add_argument('--port', type=int, default=19999)
    args = parser.parse_args()

    try:
        asyncio.run(main(args.host, args.port))
    except KeyboardInterrupt:
        log("Relay server stopped.")
