#!/bin/bash
# Daglig sikkerhetskopi av alpin.db via SQLites backup-API. Beholder siste 14 dager.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="${BACKUP_DIR:-$HOME/backups/alpin-monitor}"
KEEP_DAYS=14
mkdir -p "$DEST"
FILE="$DEST/alpin-$(date +%Y%m%d-%H%M%S).db"

cd "$ROOT/backend"
node -e "
const D = require('better-sqlite3');
const src = new D('data/alpin.db', { readonly: true });
src.backup(process.argv[1]).then(() => {
  src.close();
  const b = new D(process.argv[1]);
  b.pragma('journal_mode = DELETE'); // én selvstendig fil, ingen -wal/-shm
  const ok = b.pragma('integrity_check', { simple: true });
  b.close();
  if (ok !== 'ok') { console.error('integrity_check feilet: ' + ok); process.exit(1); }
}).catch(e => { console.error(e.message); process.exit(1); });
" "$FILE" || { rm -f "$FILE"; echo "$(date -Is) backup FEILET"; exit 1; }

find "$DEST" -name 'alpin-*.db' -mtime +$KEEP_DAYS -delete
echo "$(date -Is) ok $(basename "$FILE") $(du -h "$FILE" | cut -f1)"
