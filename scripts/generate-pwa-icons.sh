#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ICON="$ROOT/assets/images/icon.png"
OUT="$ROOT/public"

mkdir -p "$OUT"

if ! command -v sips >/dev/null 2>&1; then
  echo "sips not found; skipping PWA icon generation (use committed public/*.png)."
  exit 0
fi

sips -z 192 192 "$ICON" --out "$OUT/pwa-192.png" >/dev/null
sips -z 512 512 "$ICON" --out "$OUT/pwa-512.png" >/dev/null
sips -z 180 180 "$ICON" --out "$OUT/apple-touch-icon.png" >/dev/null
cp "$ROOT/assets/images/favicon.png" "$OUT/favicon.png"

echo "Generated PWA icons in public/"
