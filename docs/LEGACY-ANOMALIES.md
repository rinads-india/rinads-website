# Legacy Anomalies Report

**Status:** BLOCKED — no `apg.*` / `hap.*` source files in repository.

## Expected anomalies when legacy import runs

| Anomaly | Detection | Action |
|---------|-----------|--------|
| Duplicate product IDs | Import batch validator | Report, do not silent merge |
| Duplicate SKUs | Unique constraint + report | Manual review |
| Product-level stock | Variant mapping required | Map to variant ledger |
| Unstructured variants | Schema validation | Normalize or reject row |
| Embedded product snapshots | Order line audit | Keep snapshots, link variant_id |
| Fake/test customers | Domain blocklist patterns | Flag in import review |
| Fake/test orders | Status + email patterns | Quarantine in staging |
| Legacy payment fields | COMMERCE-SECURITY forbidden list | Strip before persist |
| Duplicate WhatsApp logs | Hash dedup | Report count |
| Inconsistent timestamps | Chronology validator | Report, preserve raw |

## Adapter stubs

Import pipeline remains **BLOCKED** until Ambady legacy JSON branch is available.
