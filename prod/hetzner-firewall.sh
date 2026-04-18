#!/usr/bin/env bash
# Print the Hetzner Cloud firewall rules needed to lock ports 80/443 to
# Cloudflare only. Run locally, copy the output into the Hetzner Cloud Console
# (Firewalls → collegia → Inbound Rules → Add Rule).
#
# SSH (22) and ICMP are left as-is; this script only outputs the HTTP/HTTPS
# rules that need to change. Keep your existing 22 + ICMP rules.

set -euo pipefail

echo "=== Cloudflare IPv4 ranges ==="
curl -fsSL https://www.cloudflare.com/ips-v4 | tr '\n' ',' | sed 's/,$//'
echo
echo
echo "=== Cloudflare IPv6 ranges ==="
curl -fsSL https://www.cloudflare.com/ips-v6 | tr '\n' ',' | sed 's/,$//'
echo
echo
echo "Paste the IPv4 block into 'Source IPs (IPv4)' and the IPv6 block into"
echo "'Source IPs (IPv6)' for TWO inbound rules: TCP/80 and TCP/443."
echo "Keep the existing 22 + ICMP rules untouched."
