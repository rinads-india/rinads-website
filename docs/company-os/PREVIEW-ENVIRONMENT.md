# Company OS — isolated preview environment

Status: **NOT YET CREATED.** Three attempts to create a Supabase branch through the connector (`create_branch`, 60 s timeout each) produced no branch (verified with `list_branches` afterwards). Supabase branch creation is a billable action that needs a human cost confirmation, which the automation cannot give. Nothing in this document has been applied to any database. The fields below are filled in when the environment exists.

| Field | Value |
|---|---|
| Purpose | Authenticated, data-backed preview/UAT of the Company OS and Founder Control Tower with **synthetic data only** |
| Name | `rinads-company-os-preview` |
| Source | Supabase branch of `rinads-platform` (`zznigagovilnffyzcrlj`, ap-south-1), **no production data** (`with_data=false`) — or a Supabase GitHub-integration preview branch for the work branch |
| Ref / region / created | _pending creation_ |
| Migration baseline | main's migration chain up to `20261016120000_company_os_foundation` |
| Migrations to add | `20261016130000` … `20261016130600` (7 files, additive) — nothing from PR #115 / #119 / #120 / #104 |
| Never | point the preview at `zznigagovilnffyzcrlj`'s main database, `dihqoebtctiwjlpzabeh`, or any production project |

## Why a branch/project and not "just seed it"

The seed (`supabase/preview/company-os-demo.sql`) **refuses to run** unless `rinads.allow_demo_seed = 'yes'` is set in the session and the database contains no organisation other than the demo tenants (the migration-seeded `staging-demo` fixture is tolerated). It also lives outside `supabase/migrations/` and is not referenced by `supabase/config.toml`, so no branch/CI process runs it implicitly.

## Applying (human-approved, preview database only)

1. Create the branch (founder confirms the cost) and note ref, URL and anon key.
2. Apply the seven `2026101613*` migrations in order (`apply_migration`, or `supabase db push` against the branch ref). Verify with `list_migrations`, then `get_advisors` (security + performance).
3. Create the persona logins: `pnpm exec tsx scripts/preview/write-demo-seed.ts --personas <out.sql> <credentials.json>` (both paths **outside** the repo; passwords are random, written now, never committed). Run `out.sql` with `set rinads.allow_demo_seed='yes'` first. Deliver `credentials.json` to the founder out of band, then delete it.
4. Run `supabase/preview/company-os-demo.sql` (regenerate with `pnpm exec tsx scripts/preview/write-demo-seed.ts`) with the same setting.
5. Set Vercel **Preview-only** variables scoped to branch `claude/rinads-company-os-mvp-ipygn8` (never Production): Supabase URL + anon key of the branch, auth provider = supabase. Leave every integration (WhatsApp/SMS/email, payments, carriers, GitHub/Vercel tokens) unset → those sections render *not connected*.

## Reset / deletion

- Reset data only: delete the two demo organisations (`DELETE FROM organizations WHERE id IN (...)` cascades) and re-run the seed — it is deterministic and relative to `now()`.
- Reset everything: delete the Supabase branch (`delete_branch`) or run `reset_branch`; remove the Vercel Preview variables.
- The seed is safe to re-run (`ON CONFLICT DO NOTHING`).

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
