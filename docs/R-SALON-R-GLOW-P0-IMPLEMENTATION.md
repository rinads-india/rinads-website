# R SALON / R GLOW — P0 Implementation Slice

Issue: #133

## Implemented in this slice

- Branch-local timezone-safe Calendar date keys, headings and displayed times.
- Calendar day grouping no longer uses UTC `toISOString().slice(0, 10)`.
- Upcoming Calendar queries are bounded to 90 days instead of open-ended.
- Tests pin the Asia/Kolkata midnight-boundary behavior and the bounded Upcoming contract.

## Explicitly still open

- Appointment notes are still loaded with one query per appointment. This must be replaced with a tenant-scoped batch read or lazy expansion after repository/API review.
- Authenticated owner/manager/staff UAT has not been performed by this code-only slice.
- Cross-tenant production-equivalent RLS validation remains required.
- Booking → service → checkout → review/rebooking E2E remains required.
- Communications provider/consent/suppression E2E remains required.

## Release status

Preview candidate only. Do not promote to production until CI and the release gates in #133 pass.
