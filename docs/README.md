# RINADS Documentation

**Mode:** BUILD Phase 1 CORE (identity) — staging Supabase apply pending Founder project  
**Repository:** RINADS monorepo (Public Experience in `apps/website`)

## Start here

| Document | Purpose |
|----------|---------|
| [architecture/AUDIT_GAP_ANALYSIS.md](./architecture/AUDIT_GAP_ANALYSIS.md) | Full architecture audit |
| [architecture/PHASE_0_COMPLETION_REPORT.md](./architecture/PHASE_0_COMPLETION_REPORT.md) | Phase 0 build report |
| [architecture/PHASE_1_COMPLETION_REPORT.md](./architecture/PHASE_1_COMPLETION_REPORT.md) | Phase 1 CORE report |
| [security/FINDINGS.md](./security/FINDINGS.md) | Security findings |
| [database/TARGET_ARCHITECTURE.md](./database/TARGET_ARCHITECTURE.md) | DB design |
| [deployment/SUPABASE_MIGRATIONS.md](./deployment/SUPABASE_MIGRATIONS.md) | How to apply CORE migrations |
| [decisions/README.md](./decisions/README.md) | Accepted ADRs |
| [deployment/POLICY.md](./deployment/POLICY.md) | Deploy workflow |
| [roadmap/30_60_90.md](./roadmap/30_60_90.md) | Roadmap |
| [roadmap/PRIORITY_MATRIX.md](./roadmap/PRIORITY_MATRIX.md) | Priorities |

## Architecture boundaries

- `packages/*` — reusable platform **code**
- `supabase/*` — PostgreSQL schema/migrations (CORE identity migration present; project link required to apply)
- `apps/website` — Public Experience (demo auth default; Supabase via env flag)

## Next phase

Intelligence / RINPO tools / verticals require **new Founder authorization** after staging Auth verification.
