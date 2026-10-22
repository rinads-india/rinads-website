# Shiprocket — Vendor / Logistics Provider Record

Status: onboarding + API integration foundation

## Provider identity

- Legal/provider name: **SHIPROCKET LIMITED**
- Registered/onboarding address shown on supplied Vendor Registration Form: **Plot 416, Phase-III, Udyog Vihar, Gurugram, Haryana - 122002**
- RINADS capability: `logistics.shipping`
- RINADS provider key: `shiprocket`
- Provider role: logistics aggregator / national e-commerce shipping fallback and routing candidate
- Credential binding ID: `shiprocket_primary`
- Production state: **not live** until the RINADS logistics production gate passes

## Vendor Registration Form fields

The supplied Shiprocket Vendor Registration Form requests the following business/vendor information. Values must be sourced from verified RINADS legal/KYC records; do not infer or copy unverified values into the form.

### Business identity

- Vendor Name *
- Brief Description of Service
- Brand Name, if any
- Contact Person *
- Address *
- Street
- City
- State *
- Country *
- Postal Code *
- Telephone
- Mobile *

### Tax / statutory

- PAN (scanned image required) *
- Whether Aadhaar is linked with PAN (Yes/No) *
- GST No. (scanned image required) *
- Whether E-Invoicing provisions apply (Yes/No) *
- Accounts E-mail *
- Entity Registration No. / CIN *
- Type of Entity *
- Whether Income Tax Returns were filed for the previous two years
- MSME registration status; certificate required when registered

### Bank details

- Account Holder Name *
- Name of Bank
- Branch of Bank
- Street
- City of Bank
- Account No. *
- IFSC Code (11 digits) *
- SWIFT Code (10 digits, where applicable)

### Signatures

- Vendor authorised signatory
- Shiprocket Limited authorised signatory (optional on the supplied form)

## Mandatory supporting document pack

The supplied form asks for the following supporting records:

1. Original letter confirming bank details or a cancelled cheque
2. Certificate of Incorporation, when the vendor is a company
3. PAN copy
4. GST Registration Certificate
5. MSME Certificate, if registered
6. Copy of the agreement
7. Income Tax Return filing acknowledgements for the previous two years
8. Undertaking for non-applicability of E-Invoicing when the form answer is No

All fields marked `*` on Shiprocket's form are mandatory.

## RINADS handling policy

- Do not commit PAN, Aadhaar, GST certificates, bank account numbers, cancelled cheques, passwords, API keys or other KYC/secret documents to the public Git repository.
- Store legal/KYC documents only in an access-controlled document vault / approved Drive location.
- PostgreSQL provider configuration stores only the opaque credential binding ID `shiprocket_primary`.
- API credentials remain server-side and are never exposed through `NEXT_PUBLIC_*` environment variables or frontend responses.
- Vendor/KYC completion and API production-readiness are separate gates. Completing the VRF does not make the Shiprocket adapter live.

## Technical credential contract

Current Shiprocket seller API integration uses a dedicated Shiprocket API user:

- `RINADS_SHIPROCKET_EMAIL`
- `RINADS_SHIPROCKET_PASSWORD`

These are resolved server-side through `shiprocket_primary` and exchanged for a bearer token by the Shiprocket client. Do not store the bearer token in tenant configuration.

## Production acceptance gate

Shiprocket can move from `not_configured` / `credentials_detected` to `live` only after all applicable checks pass:

- commercial/vendor onboarding approved
- API-user credentials configured in the secret store
- authentication verified
- courier serviceability/rate query verified
- canonical RINADS shipment command enriched with customer address/contact/payment/order-item data
- order creation verified using a controlled shipment
- AWB assignment verified
- pickup scheduling verified
- label generation verified
- tracking/webhook normalization verified
- cancellation verified
- idempotency and duplicate-shipment protection verified
- NDR/RTO/return handling verified where enabled
- audit events written through RINADS Intelligence / RINPO Runtime boundary
- `RINADS_SHIPROCKET_LIVE=1` enabled only after the above evidence is reviewed

## Source

This provider identity and vendor/KYC checklist were transcribed from the Shiprocket Limited Vendor Registration Form supplied to RINADS on 22 October 2026. Sensitive values are intentionally not included in this repository document.
