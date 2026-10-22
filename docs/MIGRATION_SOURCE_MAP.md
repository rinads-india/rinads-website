# Migration Source Map

Date: 2026-10-22

This map connects active/legacy sources to their canonical RINADS destination. It is intentionally concise; the detailed operational register is maintained separately.

## Platform sources

- `RINADS-ONE` → RINASPACE interaction patterns, RINCALL/voice/events → MERGE
- `RINADS-RINPO` → RINPO assets/contracts → MERGE
- `rinads-rinpo-AI-Native-Business-Communication-OS` → communication/CRM/telephony contracts → MERGE
- `founder-command-os` → Founder Space patterns → MERGE
- `rinads-studio`, `cozy-code-library`, `rinads-intelligence-studio-migration-sandbox` → shared UI/design system → MERGE
- archived RI/GOD MODE/FLOW/old Intelligence experiments → reference only → ARCHIVE

## Industry/client sources

- `r-glow-salon-suite`, `RINADS-SALON-ERP`, Fab Signature prototype, Kabini assets → R GLOW → MERGE/TENANT
- `bhima-gold`, `New-jewellery`, Anupam sources → Jewellery Pack; Bhima brand/character remain tenant IP → TENANT + MERGE generic logic
- `AMBADY-PEBBLES-GARDEN` → Commerce + Garden/Nursery Pack → TENANT + MERGE
- `project-management-s` → Work/Projects/Field Service capability → MERGE
- `BRD-ERP`, `rinads-india-BRD-ERP`, DriveFlow Pro → Automotive Pack → TENANT + MERGE
- `myceo-website` → Finance/RINPO CFO positioning + client frontend → TENANT; finance logic must stay canonical
- `m-living-studio` → Academy/marketplace/creative-service patterns → TENANT + later MERGE
- `george-catering`, `screwfast`, Linea/Charliecsons → tenant/reference UX sources → TENANT/ARCHIVE after extraction

## Creative/world sources

- `BHIMA-CENTENARY-REMOTION` → Studios production reference → TENANT
- `remix-of-ai-video-studio-landing-page` → RINASPACE/RINPO Phone + Studios UI patterns → MERGE
- `RinadsWorld` → RINADS WORLD core, integrated only through governed APIs → KEEP

## Google Drive source roles

- Locked Brand Guidelines v1.2 + Brand Kit → brand governance source
- Founder Control Tower v4.2 → Founder Space requirements/input
- Social OS Control Center + RINPO Content Calendar/Playbook → Growth OS requirements/input
- RINADS Work OS → Work Graph requirements/input
- Bhima folders/product masters/Bhima Boy → tenant product/creative data
- Ambady folders → tenant product/creative data
- prior Product & Platform Audit → historical evidence, not canonical architecture

## Stop-work rule

Once a capability has been migrated and accepted in the canonical repo, overlapping product development in the source repository stops. The source becomes one of:

- tenant frontend/data adapter,
- archived reference,
- specialized runtime that consumes canonical contracts.
