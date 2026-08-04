#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "→ Exporting Expo web bundle"
npx expo export -p web

if [ ! -f dist/index.html ]; then
  echo "ERROR: dist/index.html missing — expo export did not produce deployable output."
  exit 1
fi

echo "→ Deployable files in dist/:"
ls -la dist/ | head -20
