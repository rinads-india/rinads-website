# RINPO Live — Runway Character runbook

RINPO Live is the real-time video conversation at `/rinpo/live`. A
[Runway Character](https://docs.dev.runwayml.com/characters/) animates the RINPO
mascot, listens, and answers in the visitor's language from RINADS's own
knowledge. The idle clip on the page is the recorded character video.

## What "training" means here

Runway Characters are **not fine-tuned**. RINPO's behaviour comes from three
editable layers, plus a review loop:

| Layer | Where | Limit |
| --- | --- | --- |
| Behaviour and rules | `apps/website/lib/rinpo-live/personality.ts` | 10,000 chars (≈3.4k used) |
| Facts (knowledge base) | generated from the site catalogs + `apps/website/content/rinpo-knowledge/*.md` | 50,000 tokens (≈5.7k used) |
| Language (English, Malayalam) | `apps/website/lib/rinpo-live/languages.ts` | per-session override |
| Review loop | `runway:transcripts` → `corrections.md` → `runway:sync` | — |

Facts are generated from `productCatalog`, `solutionCatalog`, `services`,
`commercialConfig` and `companyConfig`, so the character can never be more
optimistic than the website: roadmap editions stay "roadmap" and no price is
spoken while `COMMERCIAL_CONFIG.priceApproved` is `false`.

## One-time setup

1. Create a Runway developer account and API key: https://dev.runway.com/settings/api-keys
   (the account needs credits — sessions are billed while the worker is active).
2. Preview what will be published (no API calls):
   ```bash
   pnpm --filter @rinads/website runway:sync --dry-run --export /tmp/rinpo-knowledge
   ```
3. Create the Character, publish knowledge and link it:
   ```bash
   export RUNWAYML_API_SECRET=...
   pnpm --filter @rinads/website runway:sync --clone-voice   # or --voice-preset clara
   ```
   For Malayalam use `--design-voice` instead (see *Languages* below).
   The reference image is a frame from the character video
   (`scripts/runway/assets/rinpo-reference.png`). `--clone-voice` clones the
   voice from the same video's audio (`rinpo-voice-sample.mp3`); only clone a
   voice you have the right to use. Without it, the `clara` preset is used.
   **Prefer not to run it locally?** Use the manual GitHub Actions workflow
   *RINPO Live — Runway sync* (`.github/workflows/rinpo-live-sync.yml`):
   1. Settings → Secrets and variables → Actions → add the secret
      `RUNWAYML_API_SECRET` (optionally on an environment named `rinpo-live` with
      required reviewers as an approval gate).
   2. Actions → *RINPO Live — Runway sync* → **Run workflow** on `main` with
      `dry_run` left on (needs no key) and check the summary.
   3. Run it again with `dry_run` off (and `clone_voice` on if you want the video's
      voice). The run summary prints `RUNWAY_AVATAR_ID`.
   4. Save that id as an Actions **variable** `RUNWAY_AVATAR_ID` so later runs update
      the same Character, then continue with step 4 below.

   The workflow is manual-only, runs from `main` only (branch code can never read the
   secret), uses a read-only token, and never deploys. Creating twice is refused:
   if a Character named "RINPO" already exists the sync stops and tells you to set
   `RUNWAY_AVATAR_ID` (or pass `--force-create` on purpose).
4. Add the printed `RUNWAY_AVATAR_ID` and your `RUNWAYML_API_SECRET` to Vercel
   (Production **and** Preview) and `.env.local`. Both are server-only.
5. In the Runway Developer Portal set a spend/usage limit — the in-app limits
   below are a brake, not a billing guarantee.
6. Open `/rinpo/live`. Until both variables exist the page says live video is
   not enabled and the start button stays disabled.

## Go-live checklist (follows docs/deployment/POLICY.md)

RINPO Live is founder-gated: merging the code does not enable it. It switches on
only when both `RUNWAYML_API_SECRET` and `RUNWAY_AVATAR_ID` exist in the target
Vercel environment.

1. **Merge** the PR through the normal flow (CI → review → merge → staging).
   With no Runway variables the page is live but honestly shows "not enabled".
2. **Before enabling in an environment**
   - Counsel adds Runway to `/legal/subprocessors` (deliberately a placeholder
     today — this change does not invent vendor entries) and the Privacy Policy/DPA
     are reviewed for conversation transcripts and recordings.
   - A spend/usage limit is set in the Runway Developer Portal.
3. **Create the Character** (steps above) and add `RUNWAY_AVATAR_ID` +
   `RUNWAYML_API_SECRET` to that environment, then redeploy.
4. **Check configuration** (read-only, no network): `pnpm ops:preflight` reports
   "rinpo live (runway)": disabled is a pass; only one variable set, or a
   `NEXT_PUBLIC_` Runway variable, is flagged.
5. **Verify the deployment** (read-only, starts no session, spends no credits):
   `pnpm ops:verify --website https://<host>` — the `[rinpo live]` probe prints
   `enabled` or `disabled (founder-gated)`; only a broken endpoint fails.
6. **Smoke it by hand once:** open `/rinpo/live`, pick Auto, speak, confirm the
   character answers, a link card appears when you ask about pricing or contact,
   and the call ends at the time limit. Run the Malayalam acceptance test (see Languages)
   before removing the Beta label.

## Day-to-day

- **Edit facts or tone:** change `content/rinpo-knowledge/*.md`, the catalogs, or
  `personality.ts`, then run `runway:sync`. Existing documents are updated by
  name; the Character is updated in place (`RUNWAY_AVATAR_ID` set).
- **Review conversations (training loop):**
  ```bash
  RUNWAY_AVATAR_ID=... pnpm --filter @rinads/website runway:transcripts --limit 20 --out ~/rinpo-review.md
  ```
  Transcripts contain visitor speech — do not commit or share them. Add one entry
  per weak answer to `content/rinpo-knowledge/corrections.md`, then `runway:sync`.
- **Add a language:** add an entry to `LIVE_LANGUAGES`. Mark it `beta` until you
  have listened to the chosen voice speak it.
- **Change the reference image:** replace `scripts/runway/assets/rinpo-reference.png`
  and run `runway:sync --update-image`.
- **Removed a document?** `runway:sync` never deletes; remove it in the portal.

## Controls and limits

| Control | Default | Env |
| --- | --- | --- |
| Call length | 180 s (Runway max 300) | `RINPO_LIVE_MAX_SECONDS` |
| Sessions per IP | 3 per 10 min | code (`lib/rinpo-live/guard.ts`) |
| Sessions per day | 200 per server instance | `RINPO_LIVE_DAILY_CAP` |
| Cross-site POSTs | rejected (Origin check) | — |

Per-IP and daily counters are in memory (per serverless instance), like the chat
route's limiter. For a hard ceiling use the Runway portal limits.

## Languages — English and Malayalam

RINPO Live speaks **English and Malayalam**. The picker offers *English*, *Malayalam*
and *Auto*, which follows whichever of the two the visitor speaks and switches the
moment they do. Anything else is declined politely (RINPO says it speaks English and
Malayalam). Language is a per-session override of the prompt, not a separate avatar.

**Malayalam is labelled Beta, deliberately.** What is and is not established:

- Instruction-following: the prompt tells RINPO to write Malayalam in Malayalam script
  (so it is spoken correctly), in short sentences, with digits read one by one.
- Speech-to-text and text-to-speech quality in Malayalam through Runway's *live*
  pipeline is **not documented by Runway and has not been tested here**. ElevenLabs
  lists Malayalam for its v3 text-to-speech and its Scribe speech-to-text, and Runway's
  voice design uses that v3 model, but the live-call result still has to be heard.
- Preset voices are the least likely to suit Malayalam. Create the voice with
  `--design-voice` (workflow input `design_voice`): it designs an English + Malayalam
  voice from a prompt (`DEFAULT_VOICE_DESIGN_PROMPT` in `lib/rinpo-live/voice.ts`, or
  your own with `--voice-prompt "…"`), using Runway's `eleven_ttv_v3` model. Listen to it
  in the Runway portal and in a real call before removing the Beta label.
- `--clone-voice` clones the English-speaking character video; how it sounds in
  Malayalam is unverified. Only one voice option may be used per run.

**Acceptance test before removing Beta** (do it once, in a real call): speak five
Malayalam questions (services, pricing, contact, a product status, something not in the
knowledge). Check RINPO understood you, answered in Malayalam, pronounced product names
and phone digits clearly, and did not invent anything.

## What "all data on the platform" means

RINPO knows **all public RINADS platform information**, generated from the same typed
content that drives the website so it can never be more optimistic than the site:
company, products and their availability status, every operating system and its modules,
use cases, services, industry editions (with capabilities), plans and pricing policy,
RINPO and Academy, and what the site says about customer proof (currently none is
published — RINPO says so and never names a customer). That is about 8.5k of Runway's
50k-token budget.

It deliberately does **not** know any organisation's private data (customers, orders,
invoices, projects, staff). The Live page is public and unauthenticated; wiring tenant
data to it would expose one customer's information to anyone who starts a call, and the
prompt tells RINPO to say plainly that it cannot see private data. Letting a *signed-in*
owner ask RINPO about their own workspace is a separate, larger feature: it needs
authentication, per-organisation isolation and server tools (see below).

## How it works

```
Browser ──POST /api/rinpo/live {language}──▶ Next route
                                              │ origin + rate-limit guards
                                              │ create session (personality + startScript per language,
                                              │   maxDuration, suggest_link tool) → poll READY → consume
Browser ◀── one-time WebRTC credentials ──────┘
Browser ══ WebRTC (mic ↔ video) ══▶ Runway     (API key never reaches the browser)
```

The avatar can call one tool, `suggest_link`, with a closed list of page keys
(`lib/rinpo-live/tools.ts`). The browser maps the key to a route we own and shows
a link card that opens in a new tab, so the call is never interrupted and the
model can never emit an arbitrary URL.

## Privacy

Runway keeps conversation transcripts (and recordings when available). The page
discloses that RINPO is an AI and that the conversation may be transcribed, and
the personality refuses to collect passwords or card numbers. Review your Privacy
Policy and DPA/Subprocessors pages to cover Runway before enabling in production.

## Not included (next steps)

- **Private platform data.** A signed-in mode where an owner can ask RINPO about their
  own workspace needs authentication, tenant isolation and audit, so it is a separate
  build, not a setting.
- **Server tools** (e.g. lead capture, live order lookup) need a long-lived RPC
  connection (`@runwayml/avatars-node-rpc`) that does not fit a short serverless
  route; they need a small worker.
- Per-IP and daily limits are not shared across instances (see above).
- Speaker labels in captions are inferred from Runway's transcript ids and have
  not been observed against a live session.
