# Customer support (Phase 09)

## Model

`SupportTicket` with states: open → assigned → in_progress → waiting_customer → resolved → closed.

## Creation paths

- Customer portal form → `SupportService.create`
- RINPO tool `create_ticket` → same service with `authorType: rinpo`

## Owner portal

`/support` lists org ticket queue from `SupportService.listForOrg`.

## Notifications (Step 70)

Adapters (email/WhatsApp/SMS) deferred to runtime package — ticket model is ready.
