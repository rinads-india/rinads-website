# RINADS Brand Architecture v1

Date: 2026-10-22  
Status: LOCKED / canonical baseline  
Authority: Founder-approved naming and uploaded RINADS STUDIOS Master Identity v1.0

## 1. Non-negotiable visual rules

- The uploaded ribbon-style `R` is the master symbol. Use the original artwork unchanged.
- Never regenerate, redraw, stretch, skew, rotate, simplify, trace, or reinterpret the master `R`.
- Official public studio name: **RINADS STUDIOS**.
- **R + Studios** is cinematic shorthand / film-ident usage only; it is not the standalone corporate name.
- **RINPO** remains a separate character and intelligence identity.
- Master palette:
  - RINADS Purple `#9F4BC7`
  - Electric `#A45CFF`
  - Deep Violet `#5A189A`
  - Near Black `#0B0B0F`
  - White `#FFFFFF`

## 2. Brand hierarchy

```text
RINADS TECHNOLOGIES
└── RINADS
    ├── RINADS INTELLIGENCE - RI
    │   ├── RINPO RUNTIME
    │   │   └── RINPO
    │   │       └── RINPO PHONE
    │   └── RI platform capabilities
    ├── RI RINAVERSE
    │   ├── Industry RINAVERSE experiences
    │   ├── Integration RINAVERSE experiences
    │   └── Network / marketplace / character experiences
    ├── RI LABS
    └── RINADS STUDIOS
```

Meaning:

- **RINADS TECHNOLOGIES** — company / legal technology identity.
- **RINADS** — master ecosystem and customer-facing umbrella.
- **RINADS INTELLIGENCE - RI** — governed intelligence, reasoning and orchestration layer.
- **RINPO RUNTIME** — memory, tool execution, workflows, approvals, automation and audit runtime.
- **RINPO** — human-facing intelligence character.
- **RINPO PHONE** — portable interaction surface into RINPO and RI capabilities.
- **RI RINAVERSE** — spatial, interactive and digital-world experience layer; canonical public host is `world.rinads.com`.
- **RI LABS** — R&D, experiments, learning, validation and incubation.
- **RINADS STUDIOS** — film, media, storytelling, characters and production workflows.

## 3. Locked brand names

### Corporate and core

- RINADS
- RINADS TECHNOLOGIES
- RINADS INTELLIGENCE - RI
- RINPO
- RINPO RUNTIME
- RINPO PHONE
- RI LABS
- RINADS STUDIOS

### RI platform capabilities

- RI ID
- RI SPACE
- RI DRIVE
- RI SHEETS
- RI CONNECTORS
- RI PARTNER
- RI VERIFIED
- RI GROWTH
- RI AUTOMATION
- RI LOGISTICS

### RINAVERSE / business experiences

- RI RINAVERSE
- RI NETWORK RINAVERSE
- RI COMMUNICATIONS RINAVERSE
- RI BUSINESS SUITE RINAVERSE
- RI MARKETPLACE RINAVERSE
- RI CHARACTER RINAVERSE
- RI ARTIFICIAL RINAVERSE

### Industry RINAVERSE

- RI SALON RINAVERSE
- RI JEWELLERY RINAVERSE
- RI AUTOMOTIVE RINAVERSE
- RI LANDSCAPE RINAVERSE

### Integration RINAVERSE

- RI SHOPIFY RINAVERSE
- RI WIX RINAVERSE
- RI CHATGPT RINAVERSE
- RI SHIPROCKET RINAVERSE
- RI DELHIVERY RINAVERSE
- RI WHATSAPP RINAVERSE
- RI ADS MANAGER RINAVERSE

## 4. Domain policy

Do **not** create one subdomain per brand name. A product name is not automatically a deployment boundary.

Use subdomains only where a separate runtime, security boundary, deployment lifecycle or distinct experience justifies them.

### Canonical runtime hosts

| Host | Purpose |
| --- | --- |
| `rinads.com` | master public site, product discovery, pricing, acquisition and shared routes |
| `intelligence.rinads.com` | RINADS INTELLIGENCE - RI experience / governed intelligence entry |
| `rinpo.rinads.com` | RINPO public/interactive entry where a separate character runtime is required |
| `world.rinads.com` | RI RINAVERSE / 3D world runtime |
| `studio.rinads.com` | RINADS STUDIOS experience when deployed separately |

Existing app/runtime domains may remain during migration, but no new hostname should be created merely because a new RI capability is named.

### Route-first policy

Prefer route families on `rinads.com`:

```text
/app/space
/app/phone
/ri/id
/ri/drive
/ri/sheets
/ri/connectors
/ri/automation
/ri/growth
/ri/logistics
/rinaverse/salon
/rinaverse/jewellery
/rinaverse/automotive
/rinaverse/landscape
/rinaverse/network
/rinaverse/communications
/rinaverse/business-suite
/rinaverse/marketplace
/rinaverse/character
/rinaverse/artificial
/rinaverse/integrations/shopify
/rinaverse/integrations/wix
/rinaverse/integrations/chatgpt
/rinaverse/integrations/shiprocket
/rinaverse/integrations/delhivery
/rinaverse/integrations/whatsapp
/rinaverse/integrations/ads-manager
```

This avoids DNS sprawl, fragmented SEO, duplicated authentication, duplicated analytics and separate maintenance burden.

## 5. Application and package mapping

This brand architecture follows the canonical no-new-shell policy.

| Brand / experience | Canonical implementation boundary |
| --- | --- |
| RINADS public experience | `apps/website` |
| Business / owner operations | `apps/owner-portal` |
| Customer account | `apps/customer-portal` |
| Commerce | `apps/storefront` |
| Salon vertical | `apps/rinaglow` + `packages/salon` |
| Platform administration | `apps/platform-admin` |
| Brand registry / visual tokens | `packages/brand` |
| RINADS INTELLIGENCE - RI | `packages/intelligence` |
| RINPO RUNTIME | `packages/runtime` |
| RI LOGISTICS | canonical shipping/router capability; provider adapters below it |
| RI COMMUNICATIONS RINAVERSE | `packages/communication` |
| RINPO PHONE | shared shell under RINPO / communication boundary; not an independent OS |
| RI GROWTH | shared capability package after work-graph boundary |
| RINADS STUDIOS | shared creative workflow/asset capability; editor tools remain external adapters |
| RI RINAVERSE | separate world runtime only where 3D engine/deployment requires it; use canonical APIs, never direct raw ERP access |

## 6. Product registry rules

Every new RI product or capability must have:

1. A canonical `key`.
2. Exact display `name` from the locked registry.
3. One category: `corporate`, `core`, `platform`, `rinaverse`, `industry-rinaverse`, `integration-rinaverse`, or `experience`.
4. One canonical public route or justified runtime host.
5. A package owner or app owner.
6. An entitlement/capability key for provisioning.
7. A lifecycle state: `concept`, `alpha`, `beta`, `ga`, or `retired`.
8. If a third-party trademark is present, an integration descriptor and trademark/partner-review flag.

The source of truth for application code is `packages/brand/src/registry.ts`.

## 7. Navigation architecture

### Public navigation

```text
Platform
  RINADS INTELLIGENCE - RI
  RINPO
  RINPO PHONE
  RI BUSINESS SUITE RINAVERSE

Industries
  Salon
  Jewellery
  Automotive
  Landscape

RINAVERSE
  World
  Network
  Marketplace
  Character
  Artificial

Capabilities
  RI ID
  RI SPACE
  RI DRIVE
  RI SHEETS
  RI CONNECTORS
  RI AUTOMATION
  RI GROWTH
  RI LOGISTICS
  RI COMMUNICATIONS

Integrations
  Shopify
  Wix
  ChatGPT
  Shiprocket
  Delhivery
  WhatsApp
  Ads Manager

Company
  RINADS TECHNOLOGIES
  RI LABS
  RINADS STUDIOS
  RI PARTNER
  RI VERIFIED
```

Do not show every locked full name in the top-level nav. Use concise nav labels while preserving the canonical full brand name on destination pages, metadata and registry records.

## 8. Supabase / Business Graph taxonomy

Do not create a database table per brand. Model brands, capabilities, packs and entitlements as governed registry data.

Recommended canonical entities:

- `platform_products` — product/experience identity and lifecycle.
- `capability_registry` — reusable capabilities exposed to tenants and RINPO Runtime.
- `industry_packs` — Salon, Jewellery, Automotive, Landscape and future industry bundles.
- `integration_connectors` — Shopify, Wix, ChatGPT, Shiprocket, Delhivery, WhatsApp, Ads Manager and future adapters.
- `tenant_entitlements` — tenant-to-product/capability access.
- `tenant_integrations` — tenant-specific connector installation/configuration state.
- `runtime_agents` / existing agent catalog — RINPO role/runtime bindings.
- `brand_assets` — approved asset references and variants; do not store regenerated versions of the master R.

Suggested canonical keys:

```text
ri.intelligence
rinpo
rinpo.runtime
rinpo.phone
ri.id
ri.space
ri.drive
ri.sheets
ri.connectors
ri.automation
ri.growth
ri.logistics
rinaverse.world
rinaverse.network
rinaverse.communications
rinaverse.business_suite
rinaverse.marketplace
rinaverse.character
rinaverse.artificial
industry.salon
industry.jewellery
industry.automotive
industry.landscape
integration.shopify
integration.wix
integration.chatgpt
integration.shiprocket
integration.delhivery
integration.whatsapp
integration.ads_manager
```

## 9. Provisioning flow

A purchase or approved activation should resolve as:

```text
Product / Pack
→ entitlement
→ tenant provisioning
→ capability bindings
→ connector installation requirements
→ RINPO Runtime permissions
→ role / approval policy
→ UI navigation exposure
→ audit event
```

Naming must therefore be data-driven from the registry and must not be hard-coded independently inside each app.

## 10. External trademark and partner rule

Names containing Shopify, Wix, ChatGPT, Shiprocket, Delhivery, WhatsApp or other third-party marks are integration-family identifiers inside RINADS. Public presentation must not imply ownership, endorsement, certification or partnership unless that status is contractually true.

Where required, use a descriptor such as **“RI RINAVERSE for Shopify”**, **“Connect Shopify through RI CONNECTORS”** or equivalent legal/partner-approved wording while retaining the canonical internal registry key.

## 11. Governance gate

Before shipping a new name, page, package, repository or subdomain:

1. Search the brand registry.
2. Reuse an existing capability wherever possible.
3. Apply the no-new-shell policy.
4. Require Founder approval for any new master-brand or RINAVERSE family name.
5. Require brand review for any new logo lockup or master-symbol usage.
6. Require legal/partner review for third-party marks.
7. Keep product entitlement, runtime capability and UI navigation keys aligned.

This file is the canonical naming and brand-architecture baseline until superseded by a Founder-approved version.