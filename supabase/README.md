# Supabase boundary

**Phase 1:** CORE identity migration is in `migrations/`.  
**Not connected** until Founder configures a project and applies migrations.

## Apply migrations (staging)

```bash
# From repo root — requires Supabase CLI login + linked project
pnpm dlx supabase link --project-ref <project-ref>
pnpm dlx supabase db push
```

Or use the Supabase SQL editor to run `migrations/20260814223650_core_identity.sql` in a controlled review.

## Enable website Supabase Auth

1. Apply migration
2. Set in Vercel / `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_AUTH_PROVIDER=supabase`
3. Confirm demo mode banner is gone and email sign-in works

## Rules

- Schema lives here — not in `packages/*`
- RLS is mandatory
- Never put service-role keys in the browser
- Founder / Super Admin assignment requires service role (not public signup)
