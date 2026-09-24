# R Glow prototype ↔ RINADS monorepo gap matrix

Date: 2026-09-24  
Source: R Glow Cursor Handoff zip (Ringlow / Store / Staff / Website / Brand Guidelines)  
Implementation: this monorepo (`apps/rinaglow`, `packages/salon*`, `apps/website`)

## Non-goals (handoff vs reality)

| Handoff assumption | This repo |
|--------------------|-----------|
| Scaffold new Turborepo + FastAPI + Celery + Redis API | Already Next.js apps + Supabase + `scripts/cron` workers |
| N8N automation workflows | Archive/reference only — Edge Functions + workers cover automation |
| Ambady / generic `apps/storefront` as salon Digital Store | Wrong vertical — do not restyle Ambady as R Glow |

Ops cutover (Twilio, `glow.rinads.com`, worker flags): see [`docs/deployment/RGLOW_PRODUCTION_CUTOVER.md`](../deployment/RGLOW_PRODUCTION_CUTOVER.md).

---

## Salon OS (`Ringlow.dc.html`) → `apps/rinaglow`

| Prototype screen | Route / surface | Status |
|------------------|-----------------|--------|
| Dashboard | `/dashboard` | Matched (+ Today front-office banner) |
| Bookings | (via `/calendar`) | Partial — no separate `/bookings` nav |
| Calendar | `/calendar` | Matched (+ Today check-in cue) |
| Clients / CRM | `/clients`, `/clients/[id]` | Matched |
| Loyalty | `/loyalty` | Matched |
| Billing | `/pos` | Partial — POS/refunds, not “billing” chrome |
| Services | `/services` | Matched |
| Staff & Roles | `/staff` | Partial — **admin roster**, not phone role UX |
| WhatsApp Campaigns | `/campaigns` | Partial — campaigns exist; not WhatsApp-branded |
| Growth | `/growth` | Matched |
| Login | `/login` | Matched (+ logo) |
| RINPO Studio | `RinpoCommandBar` | Partial — command bar + face asset |
| Skin & Hair Scan | — | Missing |
| Inventory | — | Missing |
| RINADS Add-ons marketplace | — | Missing |
| Onboarding wizard | — | Missing / ops-adjacent |

Extra in code (not in proto nav): `/communications`, `/settings`, `/feedback/[token]`.

---

## Digital Store (`R GLOW Digital Store.dc.html`)

Customer-facing Home / Book / Shop / portal / cart / RINPO.

| Slice | Status |
|-------|--------|
| Public booking | Partial — `apps/website/.../solutions/salon/book` |
| Shop + cart + client portal | **Missing** (net-new customer surface — follow-up PR) |
| `apps/storefront` | **Wrong product** (Ambady nursery) — do not reuse as R Glow store |

---

## Staff App (`R GLOW Staff App.dc.html`)

Phone dashboards for stylist / manager / front office.

| Prototype | Today | Status |
|-----------|-------|--------|
| Stylist / manager / FO phones | — | **Missing** as dedicated app |
| Check-in / quick bill | `/calendar` actions + `/pos` | Partial (desktop) |
| `/staff` in rinaglow | Admin HR CRUD | **Not** the Staff App |

Follow-up: role homes (e.g. `/today`) — separate PR.

---

## Website (`Ringlow Website.dc.html`) → `apps/website`

| Prototype | Status |
|-----------|--------|
| Dedicated R Glow marketing site | Partial — `/solutions/salon` + platform marketing |
| R Glow logo / RINPO art | Added under `public/assets/` (`rglow-logo`, `rinpo-face`, `rinpo-full3`) |
| Booking chrome | Updated to R GLOW naming + logo |
| Claim-safe pricing / metrics | Kept — no invented rates |

---

## Brand assets (this pass)

| File | Locations |
|------|-----------|
| `rglow-logo.png` | `apps/rinaglow/public/assets/`, `apps/website/public/assets/` |
| `rinpo-face.png` | same |
| `rinpo-full3.png` | same |

Console: Figtree via `next/font`, brand CSS vars (`--pur`, `--surf`, …), logo on nav/login, RINPO face on command bar.

---

## Follow-up PRs

1. Digital Store shell (website or new app — not Ambady storefront)
2. Staff role phone dashboards
3. Ops secrets / production cutover when provided
