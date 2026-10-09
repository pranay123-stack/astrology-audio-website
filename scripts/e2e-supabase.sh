#!/usr/bin/env bash
# Full Supabase-mode verification against the LOCAL Supabase stack (never a hosted project):
# reset DB -> seed sample content -> create test admin -> build -> browser tests -> RLS tests.
set -euo pipefail
cd "$(dirname "$0")/.."

eval "$(npx --yes supabase@2.120.0 status -o env | grep -E '^(API_URL|ANON_KEY|SERVICE_ROLE_KEY)=')"
case "$API_URL" in
  http://127.0.0.1:*|http://localhost:*) ;;
  *) echo "Refusing to run: Supabase API is not local ($API_URL)"; exit 1 ;;
esac
export NEXT_PUBLIC_DATA_BACKEND=supabase NEXT_PUBLIC_SUPABASE_URL="$API_URL" NEXT_PUBLIC_SUPABASE_ANON_KEY="$ANON_KEY" SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY"

npx --yes supabase@2.120.0 db reset
npx tsx scripts/seed.ts --demo
npx tsx scripts/create-admin.ts --email e2e-admin@example.com --password 'e2e-Password-123'
npx next build
npx playwright test --config playwright.supabase.config.ts
npx vitest run --config vitest.supabase.config.mts
echo "Supabase-mode verification passed. Rebuild with your normal .env.local before running locally again."
