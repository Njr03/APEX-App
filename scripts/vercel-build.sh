#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ensure_dependency() {
  local name="$1"
  if node -e "require.resolve('${name}/package.json')" >/dev/null 2>&1; then
    return 0
  fi

  echo "→ Missing ${name}; reinstalling dependencies"
  pnpm install --frozen-lockfile
  node -e "require.resolve('${name}/package.json')"
}

ensure_dependency "expo-screen-orientation"

echo "→ Exporting Expo web bundle"
npx expo export -p web

if [ ! -f dist/index.html ]; then
  echo "ERROR: dist/index.html missing — expo export did not produce deployable output."
  exit 1
fi

echo "→ Deployable files in dist/:"
ls -la dist/ | head -20
