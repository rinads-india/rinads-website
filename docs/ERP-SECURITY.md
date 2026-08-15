# ERP Security

## Authorization

Operational permission keys seeded in migration `20260815100002_commerce_rls_operations_rls.sql`.

Client UI role labels are not authorization. Production uses Supabase RLS + server checks.

## Financial safety

- Refunds require approval workflow
- Stock adjustments require reason + audit
- RINPO writes require explicit confirmation
- Price changes recorded in `price_history`

## Tenant isolation

All operational tables include `organization_id`. RLS policies use `private.is_org_member()`.

## File attachments

Expense/product attachments use metadata + controlled access — no permanent public URLs (foundation documented).

See [COMMERCE-SECURITY.md](./COMMERCE-SECURITY.md)
