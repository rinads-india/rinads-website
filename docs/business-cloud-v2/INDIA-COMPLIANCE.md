# RINADS India Compliance — evidence foundation

Status: foundation / pre-production.

This layer records GST-relevant master data and transaction evidence so Finance Core, R GLOW, Commerce and future provider adapters can converge on one India-specific compliance substrate.

It is **not** a GST return-filing engine yet and must not be marketed as one.

## Foundation graph

```text
Organization / Location
       ↓
GST Registration
       ↓
HSN / SAC classification policy
       ↓
Business transaction
       ↓
append-only tax evidence
       ↓
Finance Core journal reference
       ↓
reconciliation / filing adapters (future, validated)
```

## Delivered in this slice

- organization/location-bound GST registrations
- GSTIN format + state-code consistency checks
- tenant HSN/SAC classification configuration
- tax treatment and default rate evidence
- reverse-charge evidence flag
- append-only transaction-level GST evidence
- source-document and Finance Core references
- place-of-supply and intra/interstate evidence fields
- CGST / SGST / IGST / cess component evidence
- pending-vs-complete allocation state
- idempotency key per transaction evidence write
- permission-bound RLS via `compliance.india.read` / `compliance.india.manage` plus finance readers
- TypeScript helpers for GSTIN normalization, state-code extraction, supply classification and deterministic tax arithmetic

## Explicit non-goals

This foundation does not itself determine or certify:

- whether a supply is taxable, exempt, nil-rated or zero-rated;
- whether reverse charge legally applies;
- the legally correct HSN/SAC classification or GST rate;
- place-of-supply legal interpretation;
- GSTIN status on the GST portal;
- e-invoice applicability or IRN generation;
- e-way-bill applicability or submission;
- GSTR-1 / GSTR-3B filing;
- GSTR-2B reconciliation completeness;
- TDS/TCS applicability;
- statutory accounting or tax advice.

Those require validated policy, provider integrations and production acceptance gates.

## Compatibility with current R GLOW

R GLOW already stores organization/branch GSTIN and prints GST invoices. Its current SAC heading `9997` remains valid as a shape accepted by the shared foundation; this slice does not silently rewrite existing salon billing data.

A later migration/wiring slice should map R GLOW invoice evidence into the shared tables rather than introducing another salon-only GST engine.

## Next slice

1. GST registration onboarding UI and verification state separated from stored registration data;
2. product/service HSN/SAC bindings to shared catalogue/services;
3. idempotent posting adapters from Commerce/R GLOW invoices into tax evidence + Finance Core;
4. input-tax and output-tax control-account mappings;
5. credit/debit-note evidence;
6. reconciliation read models;
7. provider-neutral e-invoice and e-way-bill adapter contracts;
8. externally validated GSTR reporting/export; only then evaluate direct filing integrations.

## Product-language gate

Allowed before external validation: **GST-aware**, **GST invoice support**, **GST evidence**, **India Compliance foundation**.

Not allowed yet: **GST filing automated**, **GSTR compliant**, **e-invoice compliant**, **statutory accounting complete**, or equivalent claims.
