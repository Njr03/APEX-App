#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

node "$ROOT/scripts/generate-pwa-splash.mjs"

echo "Generated PWA assets in public/"
