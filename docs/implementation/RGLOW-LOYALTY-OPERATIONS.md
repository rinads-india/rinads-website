# R GLOW loyalty operations

## Configuration
Admins/managers configure earning and redemption under `/loyalty`. The default awards 1 point per whole INR 100 and values 10 points as INR 1. Existing points are not recalculated when rules change.

## Daily operation
- A customer's first eligible paid sale creates their account and posts one idempotent `earn` entry.
- At an awaiting-payment checkout, staff can redeem available whole points. Redemption atomically locks the account, rejects overspending, records a redemption, appends a debit, and reduces the sale total.
- Processing a refund automatically appends an idempotent, proportional `refund_reversal`.
- Admin adjustments require a non-zero whole-point amount and an audit reason. RINPO redemption and adjustment requests require approval.

## Reconciliation and incidents
Use `/loyalty` for outstanding points and currency liability, and the client profile for history. Never edit or delete ledger rows; post a compensating adjustment or redemption reversal. Retry requests with the same idempotency key. Investigate `business_events` entries beginning `salon.loyalty.` alongside the ledger and RINPO audit log.
