# RINADS refactor — first implementation slice

Date: 24 October 2026 (IST). Baseline: `7fe6f4d` on `main`.
Scope: public experience and RINPO Phone. No production database changes,
provider enablement, price changes or infrastructure migration.

## Current baseline versus the October 23 audit

The historical PLATFORM-READINESS audit is not a current deployment report.
Current main includes the payment webhook RLS migration
`20261024003000_payment_webhook_events_rls.sql`, trial grants
`20261024061000_trial_grants.sql`, trial write guards
`20261024063000_trial_write_guard.sql`, fail-closed plan module checks and
BusinessCustomersLive / BusinessTasksLive components. Do not reimplement these.
Their presence in git does not prove migration application or production acceptance.

## This slice

- Canonical Available/Pilot/Preview/Roadmap badges now retain their meaning.
  The legacy vertical available -> pilot conversion remains at VerticalCard.
- The old platform availability helper no longer calls previews live. Provider
  and route entries without production evidence remain PREVIEW.
- The homepage Business Pulse is explicitly a demo and uses legible text colours
  on its fixed dark surface. Sample figures remain labelled.
- Empty proof messaging becomes links to demonstrations, industry editions,
  availability and a business walkthrough, with no invented testimonials.
- RINPO greetings do not imply guest authentication or loaded business records.
  Role-based guidance no longer contains fabricated activity counts.
- Phone preview modes carry an explicit notice for both guests and signed-in
  users. Existing signed-in destinations are preserved.
- Phone keyboard focus stays inside the dialog, Escape dismisses it, focus returns
  to the launcher, and a nested login dialog takes focus precedence.
- Phone height respects short viewports; navigation and close targets are at least
  44px. Decorative motion honours reduced-motion preference.

## Deliberate boundaries

The four public presentation states and six internal release states are not
silently merged by this patch. Full registry consolidation needs a separately
reviewed mapping, evidence model and consumer migration. Availability is display
metadata; server permissions and entitlements remain authoritative.

The founder's latest brand direction uses RINASPACE for the network/spatial
family. RI SPACE remains the workspace name. Reconcile the existing master-spec
network glossary through an ADR before changing broad labels; do not rename
internal IDs, existing routes or tenant records as a cosmetic operation.

## Remaining implementation order

| Priority | Deliverable | Acceptance evidence |
| --- | --- | --- |
| P0 | Reconcile deployed schema, auth project and migration ledger | Read-only environment map; real two-tenant denial tests |
| P0 | Verify existing trial/provisioning/customer/task code | Verified email -> trial -> org -> ready workspace -> saved customer/task -> return visit |
| P0 | Verify expiry, permissions, invitation and recovery | Expired trial denies writes; another tenant stays inaccessible; failed jobs recover safely |
| P1 | Billing conversion on same organisation | Signed webhook replay tests, payment failure/refund paths, controlled checkout evidence |
| P1 | Canonical capability evidence and UI registry | Every public label traceable to release evidence; unknown health remains unknown |
| P1 | Frontend system refactor | Shared spacing/contrast/motion, accessibility and mobile browser evidence |
| P2 | R GLOW and one commerce/logistics pilot | Pack-specific acceptance and one supported delivery region |
| P2 | English/Malayalam voice pilot | Requested call, bounded task, consent controls, human handoff, per-minute cost |
| Later | Marketplace, Tutor/work evidence, spatial RINASPACE | Approved work -> payout; shared identity/data; accessible non-spatial alternative |
| Later | Native apps and selective Coolify migration | Device-specific demand, billing review, restore test, measured operating savings |

## Cost and return discipline

This slice introduces no new paid provider, dependency, infrastructure or API
usage. Delivery still consumes engineering/review time and existing CI/preview
capacity. Track activation, completed workflows, support contacts, conversion and
provider cost per paying organisation before and after rollout; no numeric ROI is
claimed without those baselines. Keep usage credits separate from payout money.

## Validation

- Website tests: 462 pass, zero failures.
- Website TypeScript: pass.
- Website ESLint: zero errors; three pre-existing warnings in unrelated files.
- Browser regression scenarios added for trust labels and RINPO Phone at 375px
  and 1280px, including reduced motion, preview notices and focus restoration.
- Local Chromium installation failed (download was not a valid archive); browser
  scenarios remain unexecuted locally and are a review gate.
- Optimized production build: see PR validation result; no production deployment
  is implied by local compilation.

Before merge: green repository CI, executed browser scenarios, preview review and
founder review under CLAUDE.md. Existing hosting remains Vercel + managed Supabase.
