# R SALON / R GLOW — P0 Production Audit

Tracks implementation issue #133. This is an audit of the current `main` implementation before expanding the product surface.

## Product boundary

- R SALON is the Beauty & Wellness vertical.
- R GLOW is the Salon Business Operating System.
- Existing shared RINADS auth, tenancy, RLS, audit, event and RINPO governance remain authoritative.
- No parallel ERP or edition-specific codebases.

## Current implementation confirmed on `main`

`apps/rinaglow` is a dedicated Next.js application with console routes for Calendar, Campaigns, Clients, Communications, Dashboard, Growth, Loyalty and POS, plus shared salon-server repositories/services. The Calendar already supports branch filtering, Today/Upcoming views, appointment status actions, rescheduling, notes, customer/staff mapping and a `Use in RINPO` context link.

## P0 findings

### P0-1 — Calendar timezone presentation is not branch-safe — CONFIRMED

The Calendar filters Today using `isSameZonedCalendarDate(..., branch.timezone)`, which is correct in principle, but presentation and grouping use the server/runtime timezone:

- `formatDateTime()` calls `toLocaleString()` without `timeZone`.
- `formatDayHeading()` calls `toLocaleDateString()` without `timeZone`.
- `formatTime()` calls `toLocaleTimeString()` without `timeZone`.
- `dayKey()` uses UTC via `toISOString().slice(0, 10)`.
- `groupByDay()` therefore groups by UTC date rather than branch-local calendar date.

Impact: appointments near midnight can appear under the wrong date/day heading or with a misleading time. All-branches mode is particularly sensitive because each appointment can belong to a different timezone.

Required fix: make formatting and grouping accept the appointment branch timezone; derive a stable zoned calendar key using `Intl.DateTimeFormat`; use the branch timezone for every displayed appointment date/time.

### P0-2 — Upcoming appointment query is unbounded — CONFIRMED

For `view=upcoming`, Calendar passes `from: today.now` and `to: undefined` to `listAppointments`. This can grow indefinitely with tenant history/future bookings and makes the route increasingly expensive.

Required fix: define a bounded Upcoming horizon (initial target: 90 days) and/or repository pagination. The UI must state the horizon when relevant.

### P0-3 — Appointment notes N+1 query pattern — CONFIRMED

Calendar loads notes with one `repo.listNotes("appointment", id)` request per appointment inside `Promise.all`. This is an N+1 data-access pattern and amplifies the unbounded Upcoming problem.

Required fix: add/use a tenant-scoped batch note read keyed by appointment IDs, or defer notes until a card is expanded. Preserve RLS/tenant scope.

### P0-4 — Broad Today range is a candidate-selection workaround — REVIEW REQUIRED

`broadTodayRangeIso()` queries a 52-hour UTC window and then filters appointments per branch timezone. This is safe only if the broad range covers every supported branch offset. It should remain a candidate-selection mechanism, not become the source of displayed calendar dates.

Required fix: document supported timezone envelope or calculate branch-specific UTC day bounds when a branch is selected. For all-branches mode, retain a safely bounded candidate window and branch-local filtering.

## P0 implementation order

1. Add branch-timezone-aware date/time helpers and tests, including Asia/Kolkata midnight boundaries.
2. Refactor Calendar grouping/formatting to use each appointment's branch timezone.
3. Bound Upcoming to 90 days pending pagination UX.
4. Replace/defer appointment-note N+1 loading.
5. Run lint, typecheck, unit tests and build for R GLOW.
6. Validate authenticated owner/manager/staff personas.
7. Validate cross-tenant isolation and booking → appointment → service → checkout E2E in production-equivalent environment.
8. Validate communications consent/suppression/provider delivery.
9. Only after these gates, begin the Owner Command Center and RINPO read-intelligence slice.

## Release rule

P0 fixes are preview-only until CI and production-equivalent UAT pass. No direct production promotion is authorized by this audit.
