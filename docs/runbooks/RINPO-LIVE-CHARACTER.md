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
| Language | `apps/website/lib/rinpo-live/languages.ts` | per-session override |
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
   The reference image is a frame from the character video
   (`scripts/runway/assets/rinpo-reference.png`). `--clone-voice` clones the
   voice from the same video's audio (`rinpo-voice-sample.mp3`); only clone a
   voice you have the right to use. Without it, the `clara` preset is used.
4. Add the printed `RUNWAY_AVATAR_ID` and your `RUNWAYML_API_SECRET` to Vercel
   (Production **and** Preview) and `.env.local`. Both are server-only.
5. In the Runway Developer Portal set a spend/usage limit — the in-app limits
   below are a brake, not a billing guarantee.
6. Open `/rinpo/live`. Until both variables exist the page says live video is
   not enabled and the start button stays disabled.

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

## Languages

`auto` follows whatever the visitor speaks. English, Hindi, Spanish, French and
German are in Runway's documented voice-language list. **Malayalam, Tamil and
Arabic are labelled Beta**: the model is told to speak them, but Runway does not
document voice support, so check pronunciation with the voice you chose (a
designed voice via `eleven_multilingual_ttv_v2` / `eleven_ttv_v3` is the
documented route to a better-suited voice) before removing the label.

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

- **Server tools** (e.g. lead capture, live order lookup) need a long-lived RPC
  connection (`@runwayml/avatars-node-rpc`) that does not fit a short serverless
  route; they need a small worker.
- Per-IP and daily limits are not shared across instances (see above).
- Speaker labels in captions are inferred from Runway's transcript ids and have
  not been observed against a live session.
