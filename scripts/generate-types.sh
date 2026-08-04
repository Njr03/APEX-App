#!/usr/bin/env bash
# Regenerate TypeScript types from a linked Supabase project.
# Requires: supabase CLI logged in and project linked.
#
# Usage:
#   pnpm db:types
#   SUPABASE_PROJECT_ID=your-ref pnpm db:types

set -euo pipefail

PROJECT_ID="${SUPABASE_PROJECT_ID:-}"

if [[ -z "$PROJECT_ID" ]]; then
  echo "Set SUPABASE_PROJECT_ID or link a project with: supabase link"
  exit 1
fi

supabase gen types typescript \
  --project-id "$PROJECT_ID" \
  > lib/supabase/database.types.ts

echo "Wrote lib/supabase/database.types.ts"
