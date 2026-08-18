#!/usr/bin/env bash
# Link rinads-platform and push all repo migrations.
# Requires: SUPABASE_ACCESS_TOKEN (Dashboard → Account → Access Tokens)
# Optional: SUPABASE_DB_PASSWORD (Project Settings → Database → password) for non-interactive link

set -euo pipefail

PROJECT_REF="${SUPABASE_PROJECT_REF:-zznigagovilnffyzcrlj}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

cd "$ROOT"

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "Error: SUPABASE_ACCESS_TOKEN is not set."
  echo "Create one at https://supabase.com/dashboard/account/tokens"
  exit 1
fi

export SUPABASE_ACCESS_TOKEN

echo "Linking project ref ${PROJECT_REF}..."
if [[ -n "${SUPABASE_DB_PASSWORD:-}" ]]; then
  pnpm dlx supabase link --project-ref "$PROJECT_REF" --password "$SUPABASE_DB_PASSWORD"
else
  pnpm dlx supabase link --project-ref "$PROJECT_REF"
fi

echo "Pushing migrations..."
pnpm dlx supabase db push

echo "Done. Verify tables in Supabase Table Editor (profiles, organizations, site_pages, site_seo, ...)."
