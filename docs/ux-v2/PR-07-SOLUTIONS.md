# RINADS UX V2 — PR-07 Industry Solutions

## Objective

Rebuild the public Solutions experience around one product principle:

```text
Shared RINADS core
        +
Industry configuration
        =
Vertical solution
```

This avoids presenting each industry as a separate technology platform while still giving visitors enough vertical specificity to understand how RINADS fits their operation.

## Routes

PR-07 keeps all existing URLs:

- /solutions
- /solutions/retail
- /solutions/nursery
- /solutions/salon
- /solutions/jewellery
- /solutions/logistics
- /solutions/healthcare

The historical `/solutions/nursery` URL is retained for compatibility, while the public label becomes **Landscape & Nursery**.

## Solutions hub

The hub now explains three layers:

1. Shared platform
2. Operating Systems
3. Industry configuration

It separates the catalogue into two truthful states.

### Available

- Retail
- Landscape & Nursery
- Salon / R GLOW

### Coming soon

- Jewellery
- Healthcare
- Logistics

Coming-soon pages are explicitly described as product direction/configuration previews rather than production-ready products.

## Shared vertical page structure

Each solution page now includes:

1. vertical hero
2. availability status
3. shared RINADS foundation
4. signature industry experience
5. industry workflow
6. RINPO in the vertical
7. configured capabilities
8. related platform links
9. CTA

## Retail

Retail is presented as a configuration spanning:

- Business OS
- Commerce OS
- Marketing OS
- Automation OS

The synthetic demo shows product, inventory, order, customer, and growth state without representing fictional values as real customer results.

## Landscape & Nursery

The public name is upgraded from **Nursery** to **Landscape & Nursery** while keeping the existing route.

The experience focuses on:

- inventory
- quotes
- project work
- field operations
- orders
- delivery
- customer follow-up

This remains aligned with the existing nursery/landscape template and commerce/operations architecture.

## Salon / R GLOW

Salon becomes the strongest acquisition/product page because the repository contains a dedicated R GLOW application and salon domain packages.

The page now exposes code-backed product areas:

- appointments & calendar
- services & staff
- POS & refunds
- clients & notes
- loyalty
- campaigns
- communications
- reviews & recovery
- RINPO-assisted salon workflows

### R GLOW status language

The page intentionally separates:

- **product code built**
- **production cutover still pending operational validation**

It does not present live Twilio, worker enablement, or production credentials as complete.

The page exposes:

- customer booking entry
- RINADS signup
- existing salon sign-in via /os

Public booking links are organization-specific. The generic booking route is therefore labelled as a booking entry rather than a live demo salon.

## Jewellery

Jewellery remains **Coming soon**.

The page demonstrates a configuration direction around:

- collections
- product presentation
- appointments
- CRM
- commerce
- high-value fulfilment
- brand content

The page explicitly identifies the signature visual as a concept, not a production Jewellery OS claim.

## Logistics

Logistics remains **Coming soon** as a vertical even though Logistics OS primitives and platform concepts exist.

The vertical page therefore distinguishes:

- platform-level Logistics OS
- planned logistics-business configuration

The concept covers shipment intake, carrier assignment, tracking, exceptions, delivery, and returns.

## Healthcare

Healthcare remains **Coming soon** and is intentionally scoped to **non-clinical operations**:

- scheduling
- visit flow
- team workflow
- follow-up
- communication
- operational review

The page explicitly does not claim:

- diagnosis
- treatment recommendations
- clinical decision support
- healthcare compliance certification

## RINPO model

Every vertical reuses the same RINPO interface.

The context changes by solution, but the architecture remains:

```text
RINPO
  ↓
shared platform context
  ↓
Operating Systems
  ↓
industry workflow
```

A vertical does not get its own independent intelligence/runtime stack.

## Demo policy

Available-solution demos may use synthetic operating data.

Coming-soon solution visuals are labelled as concept previews.

No customer results, operational metrics, live integrations, or deployment claims are invented.

## Non-goals

- no route migration
- no tenant-provisioning change
- no database change
- no Supabase migration
- no RLS change
- no R GLOW production cutover
- no provider credential activation
- no new Logistics or Jewellery backend
- no healthcare clinical functionality
- no compliance certification claim

## Tests

PR-07 adds tests that lock:

- one solution experience per public vertical
- availability state: Retail/Nursery/Salon available
- Jewellery/Healthcare/Logistics coming soon
- R GLOW public identity and key built capabilities
- healthcare non-clinical boundary
- coming-soon availability disclaimer

## Follow-up

PR-08 should now rebuild:

- /services
- individual service pages
- /academy
- Academy programme framing

Services should be positioned as implementation on top of the RINADS platform rather than as a disconnected agency catalogue.
