# RINADS UX V2 — PR-04 Homepage

## Objective

Rebuild the RINADS homepage so it behaves like the public front door to the operating platform instead of a long sequence of product descriptions.

The homepage now emphasizes:

1. one canonical RINPO entry
2. clear platform architecture
3. intent-based discovery
4. synthetic product demonstrations
5. operating-system breadth
6. connected workflow
7. industry configurations
8. real product-surface proof from the codebase
9. trust by architecture
10. Services and Academy as expansion paths

## Section order

```text
Hero + RINPO
Proof strip
Platform architecture
Intent router
Demo workspace
RINPO recommendation demo
Operating System suite
Connected workflow
Industry configurations
Product proof
Trust by architecture
Services
Academy
Final CTA
```

## Hero

The hero keeps the canonical position:

> The AI Operating Platform for Business.

The first interaction is RINPO. Hero suggestions are intentionally reduced to four:

- What's happening in my business?
- Find what needs attention
- Build something
- Automate a workflow

The hero no longer adds another full character visual next to the globally persistent RINPO widget.

## Product demonstration policy

All business metrics displayed on the public homepage are explicitly labelled:

> Demo workspace · synthetic data

No customer result, revenue, lead, project, or shipment metric is presented as a real customer outcome.

## Architecture

Homepage architecture is presented as:

```text
RINADS Experience
      ↓
RINPO
      ↓
RINADS Intelligence
      ↓
Operating Systems
      ↓
RINADS Cloud
```

RINADS Services is shown as implementation and delivery capability around the stack, not as a technical runtime layer.

The canonical /platform architecture page remains a PR-05 concern.

## Intent router

Visitors can start from outcomes instead of product names:

- Run my business
- Build software
- Grow my brand
- Create content
- Automate operations
- Train people

Every option routes into the existing persistent RINPO chat with contextual intent.

## Operating systems

The homepage displays exactly eight OS products:

- Business OS
- Commerce OS
- Marketing OS
- Creative OS
- Logistics OS
- Automation OS
- Build OS
- Academy OS

RINADS Intelligence and RINADS Cloud are represented as platform-core layers instead of being visually counted as additional operating systems.

## Industry configurations

The homepage preserves the existing vertical catalogue and truthful status:

Available:
- Retail
- Landscape & Nursery
- Salon / R GLOW

Coming soon:
- Jewellery
- Healthcare
- Logistics

The canonical route remains `/solutions/nursery`; only the public label is upgraded to **Landscape & Nursery**.

## Product proof

Because approved public customer case studies are not yet represented in the repository, this PR does not invent them.

Instead, the homepage exposes product surfaces that exist in the platform codebase:

- R GLOW · Salon OS
- Omnichannel Commerce
- RINPO

Commerce, Logistics, Marketing, and Build preview components remain available as visual demonstrations.

## Trust

The homepage only exposes architecture claims supported by the current platform implementation/documentation:

- tenant-aware architecture
- permissions before action
- human approval paths
- events and audit

This is not a compliance certification section.

## Services

The homepage continues using the existing service catalogue. The AI service is visually labelled **Intelligence** on the homepage to avoid presenting two separate cards with the same "Automate" verb. Full Services taxonomy refactor remains PR-08 scope.

## Academy

The homepage preserves the Academy lifecycle:

```text
LEARN → PRACTICE → WORK → SHIP → MEASURE → IMPROVE → CERTIFY
```

The homepage intentionally previews only AI School, Software School, and Founder School to reduce visual overload. The full programme catalogue remains on /academy.

## Non-goals

- no /platform page redesign
- no individual OS page redesign
- no Solutions page redesign
- no Services taxonomy migration
- no Academy route redesign
- no customer-logo invention
- no customer-result invention
- no new database schema
- no new analytics provider
- no new AI provider
- no production action execution from marketing UI

## Tests

PR-04 adds tests to lock:

- four hero prompt suggestions
- exactly eight operating systems in the homepage OS suite
- two platform-core entries
- current vertical availability status

## Follow-up

PR-05 should now rebuild:

- /platform
- /platform/rinads-intelligence
- /platform/rinads-cloud

using the same architectural model established here.
