# R GLOW Front Desk v3

Front Desk v3 is the operational orchestration surface for a salon day. It reuses existing R GLOW domain primitives rather than creating a parallel workflow engine.

## Flow

Arrival → confirm/check in → start service → complete → start checkout → finalize invoice → loyalty/payment → post-visit review automation.

## Invariants

- Appointment transitions continue through `SalonRepository.updateAppointmentStatus` and the shared appointment state machine.
- Sale totals and payments continue through the existing POS repository/actions.
- Tenancy and RLS remain unchanged.
- Review follow-up uses the existing salon automation service/rules.
- No database migration is required for this slice.
- Calendar and POS remain the deep-management surfaces; Front Desk only orchestrates them for daily execution.
