# RINADS UX V2 — PR-09 RINPO Story, Voice + Phone

## Objective

Make the public RINPO channel pages consistent with the persistent interaction model established in PR-03 while clearly separating:

- cinematic brand storytelling
- browser-level voice interaction
- future telephony integration
- product-side governed execution

The goal is a stronger RINPO identity without overstating what is live.

---

## RINPO Story

The Story page remains cinematic, but it is now explicitly framed as:

> Brand lore · A fictional origin story

The narrative no longer presents fictional character material as a factual product claim.

### Removed / corrected

PR-09 removes or rewrites claims such as:

- "World's First Business Intelligence Character"
- operations "running themselves"
- 24/7 channel promises not backed by current production integrations
- implied autonomous selling across external channels
- generic claims that every capability is already live

### Story-to-product bridge

The story now distinguishes:

```text
RINPO character
      ↓
fictional identity / brand lore
      ↓
persistent RINADS interface
      ↓
actual supported channels and product controls
```

The banyan-tree metaphor is retained as creative brand storytelling, but the page labels it as story rather than technical history.

---

## RINPO Voice

`/rinpo/voice` now has a dedicated product experience instead of the generic channel template.

### Public demo

The page can demonstrate:

- browser speech recognition
- English / Malayalam Web Speech language selection
- recognized transcript
- browser speech synthesis
- handoff from recognized speech into persistent RINPO chat

### Capability boundary

The page explicitly states that:

- speech recognition depends on browser/device support
- the public demo uses Web Speech APIs
- voice is a channel into RINPO, not a separate permission model
- product actions still depend on implemented tools, permissions, confirmations, approvals, and runtime paths
- production voice channels require supported runtime/provider integration

The page does not claim a proprietary production speech stack.

---

## RINPO Phone

`/rinpo/phone` now has a dedicated page.

The repository audit for this PR found no live PSTN/telephony connector such as an implemented Exotel, Calliyo, Vapi, or Twilio Voice integration.

Therefore RINPO Phone is now presented as:

> a governed business-calling product direction and integration model

—not as an already-live autonomous phone agent.

### Demonstrated lifecycle

```text
Call arrives
    ↓
Identify intent
    ↓
Use permitted context
    ↓
Respond or draft next step
    ↓
Escalate / approve
    ↓
Record outcome
```

The simulated call UI is explicitly labelled fictional and executes no mutation.

### Required production controls

The page identifies the real work required for production telephony:

- telephony provider integration
- inbound/outbound number configuration
- webhooks and call state
- identity / tenant context
- permissions
- escalation
- consent / recording rules where applicable
- failure handling
- observability
- call outcome / follow-up
- audit

---

## Persistent RINPO handset

The global RINPO handset remains the canonical interactive shell.

PR-09 removes misleading preview content from handset sub-screens.

### Quick Actions

The previous labels implied immediate external actions such as:

- booking consultation
- instant AI growth audit
- scheduling project meetings

Those controls only opened a chat.

They are now labelled as conversation/planning starters and explicitly state that they do not book meetings, run external audits, or execute outside actions by themselves.

### Notifications

The previous screen contained fabricated live-looking items such as:

- "RINPO Vision ... now live"
- "2 New"
- current-system notifications

It is now an **Activity Preview** with example interface states and an explicit notice that it is not a live notification feed.

---

## Spoken homepage intro

The homepage RINPO intro speech is rewritten around the current platform model.

It now describes:

- RINADS as the AI operating platform
- RINPO as the character and interface
- public chat and browser voice
- supported product context/tools where implemented
- permission / confirmation / approval / runtime boundaries

It no longer promises that all business operations are automatically run by RINPO.

---

## Public metadata

Default CMS metadata for Story, Voice, and Phone is updated to match the new capability boundary.

- Story → fictional origin + product identity
- Voice → browser speech input/output
- Phone → governed telephony product direction

No production database migration is required because these routes currently rely on CMS defaults unless an explicit `site_seo` row overrides them.

---

## Non-goals

PR-09 does not add:

- PSTN connectivity
- Exotel
- Calliyo
- Vapi
- Twilio Voice
- call recording
- call storage schema
- call webhook processing
- outbound dialer
- autonomous calling
- new Supabase tables
- new Edge Functions
- LLM provider changes
- WhatsApp production cutover
- new external-channel credentials

---

## Tests

PR-09 adds tests that lock:

- dedicated Voice and Phone pages
- Story is explicitly fictional
- no unsupported "World's First" claim
- Phone transparently states no live telephony connector
- Voice is labelled as browser speech
- fake live notifications are removed
- fake instant-action wording is removed
- spoken RINPO intro retains governed-action boundaries

---

## Follow-up

PR-10 should rebuild the project-intake experience:

```text
Goal
  ↓
RINPO-guided questions
  ↓
Requirements
  ↓
Project Brief
  ↓
Human review / submit
```

It should replace the remaining generic project/contact flow without pretending that quote, schedule, or delivery commitments are automatically generated.
