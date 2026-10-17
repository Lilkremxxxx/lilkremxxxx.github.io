#!/usr/bin/env bash
# Daily backup of the blog database and uploaded files (images + CV versions).
# Runs from systemd/blog-backup.timer; safe to run by hand: bash scripts/backup.sh
# Restore the database:  pg_restore --clean --if-exists --no-owner -d "$DATABASE_URL" db-<stamp>.dump
# Restore uploads:       tar -xzf uploads-<stamp>.tar.gz -C <repo dir>
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="${BLOG_BACKUP_DIR:-$HOME/backups/nhatbang-web}"
KEEP_DAYS="${BLOG_BACKUP_KEEP_DAYS:-14}"

set -a
# shellcheck disable=SC1091
. "$REPO_DIR/.env"
set +a

stamp="$(date +%Y%m%d-%H%M)"
umask 077
mkdir -p "$BACKUP_DIR"

# Write to a temp name first so a failed run never leaves a truncated backup that looks valid.
pg_dump --format=custom --no-owner --no-privileges --file="$BACKUP_DIR/db-$stamp.dump.part" "$DATABASE_URL"
mv "$BACKUP_DIR/db-$stamp.dump.part" "$BACKUP_DIR/db-$stamp.dump"

uploads="${UPLOAD_DIR:-$REPO_DIR/uploads}"
if [ -d "$uploads" ]; then
  tar -C "$(dirname "$uploads")" -czf "$BACKUP_DIR/uploads-$stamp.tar.gz.part" "$(basename "$uploads")"
  mv "$BACKUP_DIR/uploads-$stamp.tar.gz.part" "$BACKUP_DIR/uploads-$stamp.tar.gz"
fi

find "$BACKUP_DIR" -maxdepth 1 -type f \( -name 'db-*.dump' -o -name 'uploads-*.tar.gz' \) -mtime +"$KEEP_DAYS" -delete
find "$BACKUP_DIR" -maxdepth 1 -type f -name '*.part' -delete

echo "Backup OK: $BACKUP_DIR (db-$stamp.dump$([ -d "$uploads" ] && echo ", uploads-$stamp.tar.gz"))"
