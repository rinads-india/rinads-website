# Security Findings — rinads-website

**Date:** 2026-08-13  
**Scope:** Auth, authorization, API abuse, secrets, client-state manipulation  
**Status:** Documented only — **no remediations applied**

---

## Classification legend

| Level | Meaning |
|-------|---------|
| P0 | Critical — fix before treating any auth/data as real |
| P1 | High — fix in foundation phase |
| P2 | Medium — plan in core platform phase |
| P3 | Low — polish / hygiene |

---

## P0 — Critical

### SEC-P0-01 — Plaintext passwords in localStorage

**Where:** [`contexts/AuthContext.tsx`](../../contexts/AuthContext.tsx)  
**Keys:** `rinads_users` stores `{ username, password, role }[]`

**Issue:** Passwords are written and compared in plaintext in the browser. Any XSS, shared device, extension, or DevTools access exposes credentials. This is never acceptable for production identity.

**Auth nature:** **Simulated** — not Supabase Auth, not server sessions, not hashed credentials.

**Recommended remediation (after Founder approval):**

1. Immediately disable signup/login persistence **or** relabel UI as “Demo only — not secure”.
2. Delete `rinads_users` password storage path entirely when introducing Supabase Auth.
3. Never migrate plaintext localStorage users into production DB without forced password reset (prefer: do not migrate).

### SEC-P0-02 — Spoofable sessions and privilege escalation

**Where:** `rinads_auth` session `{ username, role }`; signup role picker includes `founder` / `super-admin`  
**Files:** `AuthContext.tsx`, `LoginModal.tsx`, `ClientPortal.tsx`

**Issue:**

- Anyone can set `localStorage.rinads_auth` to any role.
- Anyone can self-signup as `super-admin` / `founder`.
- “Protection” is React conditionals only (`role === "client"`).

**Recommended remediation:**

1. Remove elevated roles from public signup immediately when BUILD starts.
2. Introduce server-side session verification (Supabase Auth + RLS).
3. Assign privileged roles only via Founder-controlled bootstrap / invite.

### SEC-P0-03 — False sense of security on Client Portal

**Where:** `RinpoPhoneScreens/ClientPortal.tsx`

**Issue:** UI presents Projects / Invoices / Support as a portal while auth is fake. Risk is organizational (trust, compliance), not data breach of real invoices (placeholders are empty).

**Recommended remediation:** Label as preview; gate real portal behind CORE auth in a separate app (`apps/client`).

---

## P1 — High

### SEC-P1-01 — Unauthenticated, unthrottled `POST /api/chat`

**Where:** [`app/api/chat/route.ts`](../../app/api/chat/route.ts)

**Issue:** No auth, no rate limit, no body size guard, no CAPTCHA. Abuse = DoS / cost if later swapped to paid LLM without controls.

**Current risk mitigated by:** Rule-based responses (no model spend today).

**Recommended remediation:**

1. Rate limit (edge middleware / Vercel firewall / Upstash) before any LLM.
2. Request size limits + input validation schema.
3. When AI is added: auth-aware quotas + tool permission layer.

### SEC-P1-02 — No protected routes / middleware

**Issue:** No `middleware.ts`. All routes public. Role checks are client-only.

**Recommended remediation:** Next.js middleware + server components checking session for any future authenticated areas; keep marketing public.

### SEC-P1-03 — Production deploy without security gates

**Where:** `package.json` script `deploy` → `vercel deploy --prod`

**Issue:** No required CI (lint/typecheck/test/security) before prod.

**Recommended remediation:** GitHub Actions required checks; protect `main`; staging environment first.

### SEC-P1-04 — Demo auth may be mistaken for production

**Issue:** Login UI looks real.

**Recommended remediation:** Explicit “Demo” badge; or remove auth until Supabase ready.

---

## P2 — Medium

### SEC-P2-01 — No audit logging

Cannot answer who did what. Required for AI actions and admin ops later.

### SEC-P2-02 — No security headers documented in-repo

Missing CSP/HSTS/etc. configuration as code (`vercel.json` or Next headers). Relying on platform defaults is unverified.

### SEC-P2-03 — Client state as source of truth for reminders

`rinpo-reminders` in localStorage — fine for demo; not for multi-device business ops.

### SEC-P2-04 — Contact channel has no server validation

Contact page is link-out only (phone/WhatsApp/web). Low direct risk; when forms appear, require server validation + spam controls.

---

## P3 — Low

### SEC-P3-01 — Hardcoded public phone in multiple files

Public marketing info; centralize in config later.

### SEC-P3-02 — No `.env.example`

Currently no secrets needed; add contract when Supabase arrives so service role never lands in client bundles.

---

## Secrets scan (this audit)

| Check | Result |
|-------|--------|
| `.env*` committed | Not present |
| API keys in source | Not found |
| Service role in client | N/A |
| Supabase keys | N/A |

**Positive:** No secret leakage found in repository.

---

## Authorization reality check

| Question | Answer |
|----------|--------|
| Are credentials stored? | Yes — plaintext in browser |
| Are passwords client-side? | Yes |
| Is auth real or simulated? | **Simulated** |
| Does authorization exist? | UI-only labels |
| Are protected routes actually protected? | **No** |
| Are secrets exposed? | No app secrets found |
| Can API be abused? | Yes (chat DoS) |
| Can client state be manipulated? | **Yes** |
| Sensitive data exposed? | Demo passwords if users enter real ones |

---

## Recommended security sequence (post-approval)

1. Quarantine demo auth (P0)
2. Introduce Supabase Auth + RLS skeleton (no customer data yet)
3. Rate-limit chat; prepare AI gateway controls
4. Add CI + staging
5. Audit log table + privileged action policy
6. Only then: Client Portal with real data
