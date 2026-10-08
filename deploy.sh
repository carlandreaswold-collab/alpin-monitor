#!/bin/bash
set -e
cd "$(dirname "$0")"

echo "→ Bygger frontend..."
cd frontend && npm run build && cd ..

echo "→ Restarter backend..."
~/.npm-global/bin/pm2 restart alpin-monitor

echo "✓ Ferdig — http://localhost:3001"
