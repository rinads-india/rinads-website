# RINADS Documentation

**Status:** Architecture audit phase (documentation only)  
**Repository:** `rinads-website` (Public Experience + early RINPO UI)  
**Mode:** OPERATE / AUDIT — no product implementation until Founder approval

## Audit package (2026-08-13)

| Document | Purpose |
|----------|---------|
| [architecture/AUDIT_GAP_ANALYSIS.md](./architecture/AUDIT_GAP_ANALYSIS.md) | Full repository, CORE, Intelligence, RINPO, brand, multi-tenancy, debt, recommendations |
| [security/FINDINGS.md](./security/FINDINGS.md) | P0–P3 security findings and remediations (no fixes applied) |
| [database/TARGET_ARCHITECTURE.md](./database/TARGET_ARCHITECTURE.md) | Proposed Supabase/PostgreSQL domains (design only) |
| [architecture/DEPENDENCY_GRAPH.md](./architecture/DEPENDENCY_GRAPH.md) | Build order and blockers |
| [architecture/MIGRATION_STRATEGY.md](./architecture/MIGRATION_STRATEGY.md) | Safe path from website → ecosystem |
| [decisions/ADR_PROPOSALS.md](./decisions/ADR_PROPOSALS.md) | ADR-001 … ADR-012 proposals for Founder approval |
| [roadmap/30_60_90.md](./roadmap/30_60_90.md) | Foundation → Core → Intelligence roadmap |
| [roadmap/PRIORITY_MATRIX.md](./roadmap/PRIORITY_MATRIX.md) | P0–P3 engineering priorities |

## Constitutional folders (reserved)

```
docs/
├── architecture/
├── database/
├── security/
├── APIs/          # reserved
├── AI/            # reserved
├── RINPO/         # reserved
├── deployment/    # reserved
├── SOP/           # reserved
└── decisions/
```

## Rule

Do not implement RINADS CORE, Supabase, or monorepo migration until the Founder explicitly approves this audit.
