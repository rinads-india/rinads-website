# RINADS UX V2 — PR-08 Services + Academy

## Objective

Reposition RINADS Services and RINADS Academy as extensions of the operating platform rather than two disconnected brochure experiences.

The public model becomes:

```text
RINADS PLATFORM
      │
      ├── Services → implementation capability
      └── Academy  → capability-building system
```

Both surfaces reuse RINPO as the persistent interface.

---

## Services

### Public taxonomy

Services now use seven distinct public verbs:

```text
BUILD
GROW
INTELLIGENCE
AUTOMATE
CREATE
TRANSFORM
TRAIN
```

The previous AI service shared the verb **Automate** with Automation. PR-08 separates it into:

- **Intelligence & AI** → INTELLIGENCE
- **Automation** → AUTOMATE

### Platform-led delivery

The Services hub now explains three delivery layers:

1. Platform first
2. Service expertise
3. Operational handover

This establishes the principle that RINADS Services should reuse the platform wherever it fits rather than produce one-off work that sits outside the product ecosystem.

### Service-line experience

Each service page now communicates:

1. outcome
2. platform connection
3. delivery process
4. deliverables/capabilities
5. RINPO project guide
6. engagement principles
7. project CTA

### Service mappings

**BUILD — Software & Systems**
- Build OS
- Business OS
- RINADS Cloud

**GROW — Marketing & Growth**
- Marketing OS
- Creative OS
- Business OS

**INTELLIGENCE — Intelligence & AI**
- RINPO
- RINADS Intelligence
- Automation OS

**AUTOMATE — Automation**
- Automation OS
- Business OS
- RINADS Cloud

**CREATE — Creative & Media**
- Creative OS
- Marketing OS
- RINPO

**TRANSFORM — Business Transformation**
- Business OS
- Automation OS
- RINADS Cloud

**TRAIN — Training & Enablement**
- Academy OS
- RINPO
- RINADS Academy

### Live service catalog

The existing platform service catalog remains server-backed.

When catalog rows are available, the Services page labels them:

> Orderable service catalog

Pricing is explicitly described as coming from active platform data rather than static marketing copy.

PR-08 does not change catalog tables, pricing, checkout, Razorpay, or service-order backend behaviour.

---

## Academy

### Real Experience model

The Academy homepage is rebuilt around:

```text
LEARN
  ↓
PRACTICE
  ↓
WORK
  ↓
SHIP
  ↓
MEASURE
  ↓
IMPROVE
  ↓
CERTIFY
```

The page makes the distinction explicit:

> The course is not the outcome. Capability is.

### RINPO Tutor

RINPO is positioned as the persistent learning interface across Academy:

- explain
- suggest practice
- connect learning to work
- review output
- identify the next useful improvement

The public page explicitly does not claim that every tutoring, assessment, or certification workflow is fully automated today.

### Program experience

Every Academy program now has a structured model for:

- Practice
- Work
- Ship
- Measure

Coverage includes:

- RINADS University
- Programs
- Live Classes
- AI School
- AI Filmmaking
- Founder School
- Software School
- Marketing School
- Creator School

### Schedule-truthfulness rule

The previous Academy landing page contained recurring examples such as:

- Weekly live
- Weekend intensives
- Bi-weekly

Those schedules were not backed by a current scheduling source in the repository.

PR-08 removes them.

Program pages now state:

> Specific cohorts, dates, instructors, and schedules should only be treated as confirmed when published separately.

This prevents illustrative schedule copy from being interpreted as an active class commitment.

### Evidence model

Academy now emphasizes:

- practice evidence
- work evidence
- shipped evidence
- measured improvement

Certification is positioned after capability evidence, not as the only learning outcome.

---

## Design system alignment

Service and Academy cards now use the UX V2 semantic surface, border, text, and interaction roles rather than legacy white-border styling.

No locked RINADS brand primitive changes are introduced.

---

## Non-goals

PR-08 does not change:

- Supabase schema
- RLS
- auth
- billing
- Razorpay
- service checkout backend
- service order runtime
- Academy database schema
- certification backend
- live class scheduling backend
- RINPO model provider configuration
- production worker configuration

No new customer metrics, class schedules, instructor claims, or certification claims are invented.

---

## Tests

PR-08 adds tests that lock:

- exactly seven distinct service verbs
- one service experience per public service line
- Intelligence & AI distinct from Automation
- one real-experience configuration per Academy program
- no unverified recurring schedule copy on the Academy landing page
- explicit schedule-confirmation language on program pages

---

## Follow-up

PR-09 should focus on the deeper RINPO public surfaces:

- /rinpo/story
- /rinpo/voice
- /rinpo/phone

The goal should be to make them consistent with the persistent RINPO state model from PR-03 while clearly separating cinematic storytelling, product demonstration, and real execution capability.
