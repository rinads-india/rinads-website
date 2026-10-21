# RINADS Finance Core

Status: foundation / pre-production.

Finance Core adds double-entry accounting authority underneath the existing Company OS operating finance surfaces. It does **not** make a statutory GST, tax-filing or CA-compliance claim by itself.

## Canonical graph

```text
Business event / operating document
        ↓
posting adapter (next slice)
        ↓
finance_entries
        ↓
finance_entry_lines
        ↓
finance_accounts
        ↓
trial balance / P&L / balance sheet projections
```

`cos_invoices`, `cos_payments`, `cos_expenses`, salon POS sales, commerce orders and payment-provider records remain their existing domain records. Finance Core consumes those facts through idempotent posting adapters; they are not duplicated as new vertical-specific accounting engines.

## Foundation delivered

- chart of accounts
- journals
- fiscal periods with open / locked / closed states
- double-entry journal headers and lines
- organization-bound composite foreign keys
- `finance.read`, `finance.write`, `finance.post`, `finance.period.manage`
- permission-bound RLS
- immutable posted entries and lines
- atomic `finance_post_entry()` balance validation
- audit-log write on posting
- canonical `finance.entry.posted` business event
- TypeScript minor-unit validation and trial-balance helpers in `@rinads/company-os`

## Separation of duties

`finance.write` prepares draft journals and master data.

`finance.post` can post a balanced draft through the controlled posting function but does not grant generic draft editing.

`finance.period.manage` manages accounting periods.

`org.manage` remains the administrative override. Service-role posting is allowed for governed server-side automation and is audited as `system`.

## Next slice

1. standard India chart-of-accounts template;
2. idempotent posting adapters for Company OS invoices/payments/expenses and commerce/POS events;
3. reversal workflow (new reversing entry, never mutation of posted lines);
4. AR/AP subledger mapping;
5. bank/cash accounts and reconciliation;
6. trial-balance, P&L, balance-sheet and cash-flow read models;
7. fiscal-period close workflow and approval gates;
8. India Compliance evidence model for GST registrations, HSN/SAC, tax components and place of supply.

## Release rule

No production UI should label this as "GST filing", "GSTR ready", "statutory accounting complete" or similar until the separate India Compliance slice has external-rule validation and production acceptance tests.
