# Company OS — isolated preview environment

Status: **PREVIEW BRANCH CREATED; AUTHENTICATED UAT NOT YET COMPLETE.** Supabase GitHub integration created an isolated preview branch for PR #135. The integration reports Database, Services and APIs healthy. Its migration task reports warnings for three historical out-of-order migrations (`20261009020000_production_security_privilege_drift.sql`, `20261011100000_rinpo_event_immutability.sql`, `20261011110000_runtime_dlq_replay.sql`); this is a warning that must be reviewed, not a production approval. The generic Supabase seeding task is green, but the guarded Company OS synthetic seed is intentionally outside `supabase/config.toml` and has **not** been claimed as executed. Vercel preview builds and GitHub CI are green on the current branch. Production remains untouched.

| Field | Value |
|---|---|
| Purpose | Authenticated, data-backed preview/UAT of the Company OS and Founder Control Tower with **synthetic data only** |
| Name | Supabase GitHub preview branch for `claude/rinads-company-os-mvp-ipygn8` |
| Source | `rinads-platform` (`zznigagovilnffyzcrlj`, ap-south-1) via Supabase GitHub integration; no production data is intentionally seeded into the branch |
| Preview ref | `zwnrekiovzutyudjxgzw` |
| Created / integration report | 2026-10-18 UTC; Database ✅, Services ✅, APIs ✅ |
| Migration baseline | current PR branch migration chain including Company OS foundation and additive Company OS migrations |
| Company OS migrations | `20261016130000` … `20261016130600` (7 files, additive) |
| Current warning | Supabase reports three historical migrations applied out of order; review before any production consideration |
| Demo seed | `supabase/preview/company-os-demo.sql`; guarded and **not auto-run** |
| Vercel | branch previews READY; still require authenticated data-backed UAT |
| Never | point the preview at the main production database; never promote demo seed/personas to production |

## Why a branch/project and not "just seed it"

The seed (`supabase/preview/company-os-demo.sql`) **refuses to run** unless `rinads.allow_demo_seed = 'yes'` is set in the session and the database contains no organisation other than the demo tenants (the migration-seeded `staging-demo` fixture is tolerated). It also lives outside `supabase/migrations/` and is not referenced by `supabase/config.toml`, so no branch/CI process runs it implicitly.

## Remaining preview-only steps

1. Review the Supabase branch migration log and confirm the seven Company OS migrations are present despite the historical out-of-order warning.
2. Run Supabase security and performance advisors on preview ref `zwnrekiovzutyudjxgzw`; resolve any release-blocking RLS/function privilege findings.
3. Create the persona logins with `pnpm exec tsx scripts/preview/write-demo-seed.ts --personas <out.sql> <credentials.json>` using paths **outside** the repo. Passwords are generated at run time and must never be committed. Run the generated persona SQL only against the preview branch with `set rinads.allow_demo_seed='yes'` in the same SQL session.
4. Run `supabase/preview/company-os-demo.sql` against the preview branch with the same guard setting. Do not convert this seed into a normal production migration.
5. Set Vercel **Preview-only** variables scoped to branch `claude/rinads-company-os-mvp-ipygn8`: Supabase preview URL + publishable/anon key and Supabase auth provider. Do not modify Production variables. Leave real WhatsApp/SMS/email, payment and carrier integrations unset unless separately approved for sandbox use.
6. Run authenticated founder / manager / staff / client / other-tenant E2E and record evidence. Verify cross-tenant isolation, approval gates, RINPO grounded answers and public-site regression.
7. Keep PR #135 draft until preview security/UAT evidence is complete and the founder explicitly approves any next release step.

## Access note

The Supabase GitHub integration can provision and update this preview branch, but the currently connected Supabase MCP identity used by some automation sessions may not have direct permission to project ref `zwnrekiovzutyudjxgzw`. If direct SQL/advisor execution is needed, authorize the Supabase connection/account that owns `rinads-platform` rather than using the legacy `rinads-one-dev` project. Do not work around this by applying the current RINADS migration chain to the legacy project.

## Reset / deletion

- Reset data only: delete the two demo organisations (`DELETE FROM organizations WHERE id IN (...)` cascades) and re-run the seed — it is deterministic and relative to `now()`.
- Reset everything: delete/reset the Supabase preview branch through the `rinads-platform` owner account and remove the Vercel Preview variables.
- The seed is safe to re-run (`ON CONFLICT DO NOTHING`) after its guards pass.

## What the demo organisation contains (all fictional)

"RINADS Technologies — Preview Demo" (platform operator, `environment=demo` policy), 14 departments, 10 workers (nine personas + one contractor), five client companies with contacts, eight leads, seven opportunities, proposals/contracts with legitimate ledger history, five projects, nine milestones, 27 tasks, six deliverables, six invoices (two overdue 40d / 72d, one partial), three payments, expenses, a campaign with nine channel items, studio jobs with provenance-complete assets (human, AI, hybrid), a Meta ad set with a fatiguing hook, 36 AI runs across four providers (3 failed, 1 policy-blocked), logistics (delivered / delayed / exception), communications (including a failed reminder), Academy progress, and **seven pending approvals** (five prepared by named AI roles) that the founder can really approve — the production-deployment request is non-executable by design. A second unrelated tenant holds a secret company and invoice used to prove isolation.

Every number on screen is computed from these rows (`packages/company-os-server/tests/demo-seed.test.ts` asserts the founder tower, the twelve founder questions, approval execution, isolation and role restrictions against the real migration chain).

## Personas (credentials generated at run time, never in Git)

| Key | Role | Purpose |
|---|---|---|
| founder | founder | full tower, approvals |
| asha, rohan | manager | department heads (delivery; growth & brand) |
| divya, kabir, meera, nikhil, sana, tarun | staff | studio, video, copy, engineering, ads, accounts |
| client | client | must see no Company OS data |
| otheradmin | admin of an unrelated tenant | cross-tenant isolation |

Emails use the reserved `rinads-preview.test` domain; no real person or address is involved.
