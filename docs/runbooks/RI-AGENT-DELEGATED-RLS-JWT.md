# RI Agent Delegated RLS JWT — Activation Runbook

Status: **source implementation only / production disabled by default**

This runbook is the gated follow-up to the `rinads_dlg_v1` delegation foundation.
Its purpose is to let a verified RI ID delegation use the existing Supabase
`authenticated` Row Level Security path without exposing a service-role business
data client to ChatGPT, Codex, Claude, Gemini, Grok, or any other external agent.

## Security model

1. External client presents `rinads_dlg_v1` to the RINADS MCP gateway.
2. RINADS verifies signature, expiry, ledger record, revocation, client provenance,
   active organization membership, current RBAC and delegated READ scopes.
3. For an allowed READ only, RINADS mints a server-internal ES256 JWT with:
   - `sub` = the already-authorized RI ID / Supabase user UUID
   - `role` = `authenticated`
   - `aud` = `authenticated`
   - `iss` = `<NEXT_PUBLIC_SUPABASE_URL>/auth/v1`
   - a very short expiry (60 seconds by default, never beyond the outer delegation)
   - delegation provenance fields for observability only
4. The internal JWT is passed to `@supabase/supabase-js` as the access token while
   the normal public/anon key remains the API key.
5. Existing RLS and explicit `organization_id` query filters remain authoritative.
6. The internal JWT is never returned to the external AI client and is not stored.

The JWT intentionally contains **no organization claim used as an authorization
boundary**. Tenant scope remains server-resolved from the delegation ledger and
current memberships, then explicitly applied to the capability query.

## Required server-only configuration

Do not prefix either variable with `NEXT_PUBLIC_` and never commit real values.

```text
RINADS_AGENT_RLS_JWT_PRIVATE_JWK=<JSON EC P-256 private JWK>
RINADS_AGENT_RLS_JWT_KID=<the exact kid imported/trusted by Supabase>
```

Generate an ES256 key using the current Supabase CLI command documented by
Supabase:

```bash
supabase gen signing-key --algorithm ES256
```

The private key must live only in the production secret manager / Vercel server
environment. Do not place it in source control, client bundles, screenshots,
issues, logs, analytics, browser storage, or external-agent configuration.

## Supabase trust setup — separate founder-approved gate

Do **not** perform this automatically from an application deploy.

1. In a non-production Supabase project first, import the generated private key
   as a JWT signing key and retain the exact `kid`.
2. Confirm the imported key is in a state that Supabase accepts for custom JWT
   verification according to the current signing-key documentation.
3. Configure the two server-only RINADS environment variables in staging.
4. Run a real Data API read with the delegated path and verify `auth.uid()` equals
   the RI ID actor UUID.
5. Prove cross-organization isolation with two organizations and a user whose
   memberships make the test meaningful.
6. Revoke the outer delegation and verify the MCP request is rejected before any
   business data is released.
7. Verify the capability entitlement flag and current permission checks still
   fail closed.
8. Run Supabase security advisors and the full RINADS CI suite.
9. Only after the staging evidence is reviewed should the same key-import and
   environment process be considered for production.

## Data API access check

Supabase changed Data API defaults in 2026: new tables are not automatically
exposed. RLS does not itself grant Data API access. Before activation, confirm the
existing tables used by delegated reads (`feature_flag_overrides`, `products`,
`product_variants`, `orders`, `order_lines`, `order_events`, `audit_logs`) have the
same Data API grants required by ordinary authenticated RINADS users.

Never fix a grant problem by introducing a service-role business-data query.

## Rotation / incident response

- Prefer ES256 / P-256; do not add an HS256 fallback.
- Keep the internal RLS JWT lifetime short. It is request-local and should never
  become a reusable external credential.
- Rotate imported signing keys at least annually and rehearse rotation before an
  incident.
- Supabase products use signing-key revocation directly, while public JWKS caches
  can persist for a short period in external verifiers. RINADS should not depend
  on a long-lived local JWKS cache for this flow.
- If the RINADS private key is suspected compromised, remove it from the runtime,
  revoke the corresponding Supabase signing key, disable delegated reads, and
  rotate before restoring service.

## Explicit non-goals for this slice

- no external WRITE/ACTION scopes
- no `service_role` JWTs
- no service-role business-data client
- no caller-supplied organization selection
- no refresh token for the internal delegated JWT
- no public `mcp.rinads.com` activation in this source PR
- no production key import, rotation, migration, or deployment

## References

- Supabase JWT Signing Keys: https://supabase.com/docs/guides/auth/signing-keys
- Supabase JWTs / custom JWT usage: https://supabase.com/docs/guides/auth/jwts
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
