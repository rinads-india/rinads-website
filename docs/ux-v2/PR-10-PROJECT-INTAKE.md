# RINADS UX V2 — PR-10 Intelligent Project Intake

## Objective

Replace the legacy project/contact form with a structured intake flow that helps a visitor turn an idea or operating problem into a reviewable Project Brief before RINADS makes any commercial or delivery commitment.

The flow is:

```text
Goal
  ↓
Requirements
  ↓
Project Brief
  ↓
RINPO review
  ↓
Human review / submit
```

This PR also replaces the previous fake one-second form submission with real server-side persistence.

---

## Public experience

### Step 1 — Goal

Visitors start from the outcome they want rather than choosing a technology too early.

Current goal categories:

- Run my business better
- Build software
- Grow my brand
- Sell online
- Automate operations
- Create media
- Train people
- Transform the business
- Something else

Each goal can suggest editable platform/service areas.

### Step 2 — Requirements

The intake asks for:

- name
- email
- company
- phone
- industry/business type
- current problem
- desired outcome
- intended users
- current tools/systems
- must-haves/constraints
- budget range
- desired timeline

Only the minimum fields required to make the request reviewable are mandatory.

### Step 3 — Project Brief

The page generates a deterministic brief from the submitted fields.

It does **not** use an LLM to invent:

- scope
- price
- project duration
- staffing
- architecture
- delivery commitment
- contract terms

The brief presents:

- goal
- business/industry
- users
- problem
- desired outcome
- likely scope based on user selections
- current tools
- constraints/context
- budget range
- timeline
- next review step

The user reviews this before submission.

---

## RINPO

RINPO is available throughout the intake as a requirements guide.

RINPO can help:

- identify the most relevant goal
- identify missing requirements
- clarify scope questions
- review the generated brief

RINPO is explicitly instructed not to invent quote, delivery date, or commercial commitment.

The Project Brief itself is generated deterministically from the form data so the submission does not depend on LLM availability.

---

## Real backend persistence

PR-10 adds:

`POST /api/project-intake`

The route:

1. enforces a request-size limit
2. applies a best-effort in-memory rate limit
3. validates all required fields
4. validates the generated brief shape
5. uses a honeypot for basic bot filtering
6. reads Supabase credentials only server-side
7. inserts through the service-role client
8. returns the intake reference only after a real database insert

No service-role secret is sent to the browser.

### Database

Migration:

`20260923100000_project_intakes.sql`

creates the platform-global `project_intakes` table.

The table includes:

- status
- goal
- contact details
- problem
- desired outcome
- users
- current tools
- must-haves
- budget/timeline
- selected needs
- JSON Project Brief
- source path
- consent
- human-review fields
- timestamps

### Security

`project_intakes` has RLS enabled.

Direct access is revoked from:

- PUBLIC
- anon
- authenticated

Only `service_role` receives direct table privileges.

Public writes therefore go through the validated website API route rather than direct PostgREST access.

---

## Human review

Successful submission creates a database row with:

`status = submitted`

The public page makes clear that submission does not create:

- a paid order
- an invoice
- a project record
- a deployment
- a delivery date
- an agreed price or scope

The brief is ready for RINADS human review.

A dedicated platform-admin review queue is still a follow-up. Until that UI exists, the persisted intake remains available to authorized production operators through the protected database/admin environment.

---

## Removed legacy behaviour

PR-10 removes the old project page behaviour that:

- used agency-style service-category chips as the main intake model
- used placeholder social links
- waited one second and displayed a fake success state
- promised “Expect a reply within 24 hours” without a backend workflow
- presented the project page primarily as an agency contact card

---

## Metadata

Default CMS metadata for `/projects` is updated to describe the structured Project Brief experience.

The historical CMS migration is not edited.

---

## Non-goals

PR-10 does not add:

- automated quoting
- automatic contracts
- automatic project provisioning
- automatic invoice creation
- automatic project scheduling
- automated sales follow-up
- notification delivery
- CRM lead conversion
- platform-admin intake queue
- LLM-generated requirements
- new external provider dependency

---

## Tests

PR-10 adds tests that lock:

- the outcome-first goal model
- deterministic brief generation
- no invented commercial commitment
- required contact/problem/outcome/consent validation
- real API submission instead of a fake timeout
- no “24 hour” reply promise
- service-role-only database writes
- RLS + privilege revocation on the intake table

---

## Deployment order

Because PR-10 introduces a database table used by the website API, production rollout should occur in this order:

1. CI passes
2. apply `20260923100000_project_intakes.sql` to production Supabase
3. verify table/RLS/grants
4. merge PR to `main`
5. verify Vercel production deployment
6. submit one controlled production smoke-test intake
7. verify the row exists with `status = submitted`
8. remove/archive the smoke-test row if desired

This order prevents the new website from reaching production before its persistence layer exists.

---

## Follow-up

PR-11 should address the trust/resources/customer-proof layer and can include a privileged platform-admin Project Intake queue so the submission lifecycle becomes:

```text
submitted
  ↓
under_review
  ↓
qualified / archived
```
