# RINADS UX V2 — PR-03 Persistent RINPO Experience

## Objective

Make RINPO the persistent public interaction layer for RINADS without creating a second AI runtime or bypassing the platform's existing security boundaries.

This PR consolidates the public experience around the existing global `RinpoProvider`, `RinpoPhone`, and chat flow.

## Canonical interaction state

The public experience now has an explicit state contract:

```text
CLOSED
OPEN
LISTENING
THINKING
RESPONDING
RECOMMENDING
ACTION_PREVIEW
AWAITING_APPROVAL
EXECUTING
SUCCESS
FAILURE
AUDITED
```

Only states supported by the current public experience are surfaced automatically today:

- closed
- open
- listening
- thinking
- responding
- recommending
- failure

The remaining action states are reserved for structured executable-tool flows. They must not be faked by the marketing website.

## Page-aware context

RINPO now resolves lightweight public page context so its entry experience can adapt to:

- homepage / general RINADS
- Business OS
- Commerce OS
- Marketing OS
- Logistics OS
- Creative OS
- Build OS
- Academy
- Automation OS
- RINADS Intelligence
- RINADS Cloud
- Solutions
- Services
- Projects
- RINPO

Context only affects public prompts and guidance. It does not grant permissions, tenant access, business data, or execution capability.

## Canonical console

`/rinpo` previously presented a CommandBar and a separate RINPOChat card side-by-side. Both were entry surfaces into the same underlying phone experience.

PR-03 replaces those competing surfaces with one `RinpoConsole`:

- page-aware prompt
- contextual suggestions
- one composer
- visible interaction status
- one route into the existing persistent RINPO phone/chat

The old system components are left in place for other routes until later migration PRs.

## Persistent phone

The global phone now:

- closes through the provider's canonical close action
- exposes truthful interaction status
- shows the current page context
- removes the hard-coded notification badge that implied unread data
- preserves existing chat, voice, apps, quick actions, support, plans, profile, and portal screens

## Chat behaviour

The existing public rule-based chat is preserved.

The chat now updates the public interaction state:

- speech recognition start → listening
- prompt submit → thinking
- response with links → recommending
- response without links → responding
- request failure → failure

Suggested prompts are contextual to the page.

This PR does **not** claim that the public website can execute every proposed action.

## Security and execution boundary

This PR does not change:

- Supabase
- tenancy
- RLS
- permissions
- audit
- runtime
- tool registry
- server-side R GLOW RINPO actions
- LLM provider configuration

Executable actions are only enabled where the connected RINADS product already supports the required permission, approval, and audit path.

## Tests

Adds coverage for:

- Business OS context
- Academy context
- Solutions context
- unknown-route fallback
- complete display-label coverage for the interaction-state contract

## Non-goals

- no homepage V2 redesign
- no LLM migration
- no new AI provider
- no fake action execution
- no new database schema
- no R GLOW command-bar rewrite
- no RINPO Story / Voice / Phone marketing-page redesign
- no removal of legacy components still used by other routes

## Follow-up

PR-04 should use this persistent RINPO foundation while rebuilding the homepage, rather than introducing another independent chat or assistant UI.
