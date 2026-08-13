# RINADS Documentation

**Mode:** BUILD Phase 0 complete pending verification  
**Repository:** RINADS monorepo (Public Experience in `apps/website`)

## Start here

| Document | Purpose |
|----------|---------|
| [architecture/AUDIT_GAP_ANALYSIS.md](./architecture/AUDIT_GAP_ANALYSIS.md) | Full architecture audit |
| [architecture/PHASE_0_COMPLETION_REPORT.md](./architecture/PHASE_0_COMPLETION_REPORT.md) | Phase 0 build report |
| [security/FINDINGS.md](./security/FINDINGS.md) | Security findings |
| [database/TARGET_ARCHITECTURE.md](./database/TARGET_ARCHITECTURE.md) | DB design (no live migrations yet) |
| [decisions/README.md](./decisions/README.md) | Accepted ADRs |
| [deployment/POLICY.md](./deployment/POLICY.md) | Deploy workflow |
| [roadmap/30_60_90.md](./roadmap/30_60_90.md) | Roadmap |
| [roadmap/PRIORITY_MATRIX.md](./roadmap/PRIORITY_MATRIX.md) | Priorities |

## Architecture boundaries

- `packages/*` — reusable platform **code**
- `supabase/*` — PostgreSQL schema/migrations (**NOT LIVE** in Phase 0)
- `apps/website` — Public Experience

## Next phase

Phase 1 CORE (Supabase Auth → profiles → orgs → RBAC → RLS) requires **new Founder authorization**.
