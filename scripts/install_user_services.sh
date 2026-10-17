#!/usr/bin/env bash
# Installs the blog API as a systemd user service (runs server/index.js from this repo with .env).
# The public hostname blog-api.verbaa.pp.ua is served by the separate unit blog-api-verbaa-cloudflared.
set -euo pipefail

UNIT_SOURCE_DIR="$(cd "$(dirname "$0")/../systemd" && pwd)"
UNIT_TARGET_DIR="${HOME}/.config/systemd/user"

mkdir -p "${UNIT_TARGET_DIR}"
cp "${UNIT_SOURCE_DIR}/blog.target" "${UNIT_TARGET_DIR}/blog.target"
cp "${UNIT_SOURCE_DIR}/blog-backend.service" "${UNIT_TARGET_DIR}/blog-backend.service"

export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}"
systemctl --user daemon-reload
systemctl --user enable --now blog.target
systemctl --user enable blog-backend.service
systemctl --user restart blog-backend.service
