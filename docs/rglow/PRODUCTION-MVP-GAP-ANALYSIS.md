# R GLOW production MVP gap analysis

Date: 2026-10-08  
Target: the existing Next.js + Supabase + Vercel implementation  
Decision rule: a capability is not “live” until its production deployment and operator journey are evidenced.

## Sources reviewed

The analysis reconciles the current repository with the supplied R GLOW handoff:

- `Ringlow.dc_c251.html` — Salon OS prototype
- `R_GLOW_Digital_Store.dc_418f.html` — customer booking, shop, cart, and portal
- `R_GLOW_Staff_App.dc_09bf.html` — stylist, manager, and front-office phone views
- `Ringlow_Website.dc_f98a.html` — dedicated product marketing site
- `R_GLOW_Dev_Guide.dc_6c2e.html` and `R_GLOW_MVP_Architecture.dc_e4f4.html`
- `Salon_Setup_-_Client_Requirements_Form.dc_48a7.html`
- `R_GLOW_Message_Templates.dc_a521.html`
- `R_GLOW_-_Client_Presentation.dc_79ba.html`
- `R_GLOW_Investor_Deck.dc_cfc2.html`
- `R_GLOW_Brand_Guidelines.dc_be51.html`
- `R_GLOW_Social_Banners.dc_6fee.html`
- `README_fd73.md`

The prototype files are product-intent evidence, not proof that a capability is built or commercially approved.

## Architecture decision

Do not replace the current platform with the handoff’s greenfield React/Vite, FastAPI, Coolify, N8N, MongoDB, or AWS layout.

The canonical production architecture is:

- `apps/rinaglow` for the authenticated operator console;
- `apps/website` for public discovery and salon booking;
- `packages/salon` and `packages/salon-server` for domain and persistence behavior;
- Supabase Auth, Postgres, RLS, migrations, and Edge Functions;
- Vercel for web deployment;
- explicit, allowlisted workers for asynchronous delivery.

This architecture already contains stronger tenancy, idempotency, approval, outbox, and audit controls than the handoff examples. N8N remains reference material only.

## Product capability matrix

| Capability promised or prototyped | Current implementation | Verdict for production MVP |
|---|---|---|
| Multi-branch salon setup | Branch CRUD, working hours, branch-scoped staff and calendar | **Built**; live persona validation required |
| Services and staff | Service catalog, staff roster, specialties, hours | **Built** |
| Public online booking | Branch, multi-service, eligible staff, slots, conflict protection, idempotency | **Built**; deploy the 2026-10-08 safety migration and run live E2E |
| Front-desk booking | Phone/walk-in flow with availability and conflict checks | **Built**; authenticated smoke required |
| Calendar | Today/upcoming list, branch filter, status changes, reschedule | **Partial vs prototype**; no rich week/month grid |
| Client CRM | Profiles, history, spend, notes, loyalty, reviews | **Built**; skin/hair profile fields are not implemented |
| Marketing consent | Stored on customer; production-MVP branch adds explicit capture, provenance, and mandatory campaign exclusion | **Launch blocker until migration is deployed** |
| POS | Draft sale, service lines, tax calculation, payment recording, refunds, loyalty redemption | **Built for controlled pilot** |
| GST invoice PDF and WhatsApp/email receipt | Totals exist; compliant numbered PDF, archival, and delivery do not | **Deferred; do not sell as live** |
| Loyalty | Config, tiers, append-only ledger, redemption, reversal, optional expiry | **Built**; worker remains opt-in |
| Campaigns | Segment, preview, approve, schedule, outbox, retry, conversion attribution | **Built but KEEP OFF** until consent migration and Twilio sandbox evidence |
| Booking/review/recovery communications | Outbox, worker, Edge Function, callbacks, retries | **Code built; provider operations unproven** |
| Dashboard and growth intelligence | KPIs, attention items, campaign/review/loyalty summaries | **Built**; `/growth` is a repository feature, not prototype parity with the prototype’s “Grow” group |
| RINPO | Deterministic salon tools, live tenant context, approval-gated writes | **MVP slice built** |
| RINPO Phone, durable memory, and voice receptionist | Prototype/demo only | **Deferred** |
| Inventory and stock transfer | No R GLOW UI or salon inventory mapping | **Missing; post-pilot product slice** |
| Skin & Hair Scan | No image capture, consent, storage, model, or treatment workflow | **Missing; post-MVP regulated-data review required** |
| Salon onboarding wizard | Settings and readiness checks exist; no self-serve wizard/import | **Partial; pilot uses assisted onboarding** |
| Telecaller role UX | Role appears in handoff only | **Missing** |
| Staff phone app | Desktop actions exist; no stylist/manager/front-office role homes | **Missing; post-MVP** |
| Digital Store | Public booking only | **Shop, cart, orders, portal, OTP login, and courier tracking missing** |
| Add-ons marketplace | Prototype/sales intake only | **Missing; post-MVP** |
| Dedicated R GLOW marketing site | Generic RINADS salon solution exists | **Partial** |

## Prototype details omitted from the earlier gap matrix

The supplied prototypes also specify:

- Owner, Manager, Front office, Stylist, and Telecaller role experiences;
- a separate Bookings screen in addition to Calendar;
- week/month calendar chrome and “waiting / in chair / done” states;
- a client drawer with segment filters, skin/hair details, WhatsApp, and scan actions;
- universal versus per-store inventory and a three-step stock-transfer workflow;
- RINPO Phone with Chat, Apps, Actions, Alerts, and a voice-call simulation;
- customer portal bookings, orders, loyalty, profile, and RINPO history;
- WhatsApp OTP, order tracking, social links, gift cards, and RINADS Courier;
- stylist commission/rebooking metrics and manager cross-store ratings;
- setup fees, annual offers, free-trial language, FAQs, and demo CTAs.

These are requirements or commercial concepts, not current production capabilities.

## Handoff contradictions that must not reach production copy

| Conflict | Production position |
|---|---|
| “Ringlow” vs “R GLOW by Rinads” | Use **R GLOW**; remove “Ringlow” from customer-facing material |
| `rglow.rinads.com`, `app.*`, `store.*`, `staff.*` vs `glow.rinads.com` | `glow.rinads.com` is the current console host; do not advertise unconfigured hosts |
| FastAPI/N8N/MongoDB vs Next.js/Supabase | Current repository architecture is canonical |
| “No third-party AI / no external APIs” vs Twilio and optional model providers | Do not make the absolute claim; present RINPO as the product experience |
| 1,200+ salons / ₹38 Cr vs three-pilot roadmap | Do not publish unsubstantiated traction |
| Starter includes inventory vs inventory absent | Amend sales scope or build inventory before making the claim |
| Invoice PDF/WhatsApp promise vs POS-only implementation | Do not claim compliant invoice delivery until implemented and reviewed |
| Self-serve onboarding vs specialist-assisted setup | Pilot is assisted onboarding |

## Production MVP boundary

The defensible controlled-pilot MVP includes:

1. Authenticated R GLOW console and tenant/branch isolation.
2. Branches, services, staff, and working hours.
3. Public and front-desk booking.
4. Calendar, status transitions, rescheduling, and customer history.
5. Basic POS and payment-method recording; no claim of gateway processing.
6. Loyalty and reviews/recovery.
7. Transactional booking confirmations to an allowlisted sandbox audience.
8. RINPO’s deterministic, approval-gated salon tools.

The following do not block that pilot and must be labelled planned: inventory, invoice PDFs, Digital Store, Staff PWA, scan, voice, marketplace, customer OTP portal, franchise controls, and courier.

## Launch blockers

### Code and database

- [x] Campaign audiences require affirmative marketing consent and cannot override opt-out.
- [x] Public booking captures optional consent separately from transactional updates.
- [x] Public phone validation is aligned at TypeScript and database boundaries.
- [x] Anonymous booking has database-backed per-source and per-phone throttles.
- [ ] Apply `20261008100000_rglow_public_booking_safety.sql` to production.
- [ ] Verify all current migrations against the selected release SHA.
- [ ] Move operator booking and POS finalization/payment into atomic database workflows before expanding beyond a controlled pilot.

### Auth and tenancy

- [ ] Confirm Supabase redirect allowlist for apex, `www`, and `glow`.
- [ ] Test salon member, non-salon, no-membership, multi-org, and branch-restricted personas.
- [ ] Prove cross-host cookie behavior and sign-out.
- [ ] Run a two-tenant isolation smoke against production RLS.

### Communications

- [ ] Deploy and version `notify-whatsapp` and `notify-whatsapp-webhook`.
- [ ] Register a sandbox sender and approved transactional templates.
- [ ] Prove bad webhook signatures are rejected.
- [ ] Run one allowlisted worker tick and observe `pending → sent → delivered/read` or an honest failure.
- [ ] Keep promotional campaigns disabled until consent migration and audience tests pass.

### Operations and reliability

- [ ] Select and record the release SHA for both website and R GLOW.
- [ ] Confirm production deployment SHA and health endpoints.
- [ ] Add alerts for 5xx, booking failures, outbox age, dead letters, and worker inactivity.
- [ ] Document Supabase backup/restore ownership and complete a restore drill.
- [ ] Prepare one pilot tenant with reconciled branches, services, staff, customers, consent, and future appointments.
- [ ] Complete operator acceptance for booking, conflict rejection, reschedule/cancel, POS, loyalty, review, and recovery.

## Go-live evidence required

R GLOW may be labelled **live production MVP** only when all of the following are attached to the release record:

1. Git SHA and matching Vercel production deployments.
2. Production migration ledger including the booking-safety migration.
3. Authenticated persona and two-tenant RLS results.
4. A real public booking and front-desk booking with conflict rejection.
5. POS/payment-recording and loyalty evidence.
6. Transactional sandbox message plus callback evidence.
7. Monitoring/alert ownership and rollback instructions.
8. Pilot tenant reconciliation and named operator sign-off.

Until then, the accurate status is **production code candidate for controlled pilot**, not full prototype parity.
