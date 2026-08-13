# Deferred technical debt (Phase 0)

| Item | Decision | When |
|------|----------|------|
| Three.js + `@react-three/*` | **Keep** — unused `Rinpo3D` may return; do not remove in Phase 0 | Revisit when bundle budget requires |
| In-memory chat rate limit | Best-effort only; ineffective across serverless instances | Phase 1: edge middleware / Upstash / Vercel Firewall |
| `packages/ui` shadcn | Skeleton only | After Phase 1 foundation |
| RinpoChat eslint overrides | Preserve behavior | OPERATE refactor |
| Untitled / UUID assets | Do not mass-rename | Asset curation pass |
