#!/usr/bin/env bash
# Install / refresh the PedagogIA fail2ban jail on the VPS.
#
# Idempotent: safe to re-run after config changes. Copies the filter + jail
# files from this repo to /etc/fail2ban/, ensures the Caddy log dir exists
# and is readable, then restarts fail2ban and prints the jail status.
#
# Run as root on the server:
#   sudo ./install-fail2ban.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FILTER_SRC="$SCRIPT_DIR/fail2ban/filter.d/pedagogia-auth.conf"
JAIL_SRC="$SCRIPT_DIR/fail2ban/jail.d/pedagogia-auth.conf"

if [[ $EUID -ne 0 ]]; then
  echo "Must run as root (needs to write /etc/fail2ban and restart the service)." >&2
  exit 1
fi

if ! command -v fail2ban-client >/dev/null 2>&1; then
  echo "Installing fail2ban..."
  apt-get update -y
  apt-get install -y fail2ban
fi

mkdir -p /var/log/pedagogia-caddy
# Caddy runs as root inside its container so the bind mount is writable by
# default; nothing to chown here. fail2ban runs as root too, so it can read.

install -m 0644 "$FILTER_SRC" /etc/fail2ban/filter.d/pedagogia-auth.conf
install -m 0644 "$JAIL_SRC"   /etc/fail2ban/jail.d/pedagogia-auth.conf

systemctl enable fail2ban
systemctl restart fail2ban

sleep 1
fail2ban-client status pedagogia-auth
