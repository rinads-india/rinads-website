## Summary

Starts implementation of #133 without rebuilding R GLOW.

### Fixed
- Calendar grouping now follows each appointment branch timezone instead of UTC day boundaries.
- Calendar headings, times and date-time labels explicitly use branch timezone.
- Upcoming appointment reads are bounded to 90 days instead of open-ended.
- Added timezone regression tests around the Asia/Kolkata midnight boundary.
- Added a production contract test for the Upcoming horizon and timezone-safe rendering.

### Audit
`docs/R-SALON-R-GLOW-P0-AUDIT.md` records the confirmed P0 findings and release sequence.

### Intentionally not hidden
Appointment notes still have an N+1 read pattern. This PR does not invent a repository method to mask it; the next slice should add a tenant-scoped batch notes read or lazy-load notes.

## Required validation
- lint
- typecheck
- tests
- build
- preview inspection
- authenticated owner/manager/staff UAT
- production-equivalent RLS / tenant-isolation test

## Release policy
Preview only. No production promotion from this PR without the #133 gates and founder approval.
