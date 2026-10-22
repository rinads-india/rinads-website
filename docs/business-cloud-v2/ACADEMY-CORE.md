# RINADS Academy Core

Status: backend foundation / pre-production.

The current RINADS Academy public experience already communicates the product model. Academy Core adds the durable learning truth underneath it without changing public routes or creating a second identity system.

## Learning graph

```text
Organization
  ↓
Course
  ↓
Module
  ↓
Lesson

Course → Cohort
Course → Enrollment → Lesson Progress
                   → Evidence / Portfolio artifact reference
                   → Certificate
```

Every learning record is tenant-scoped by `organization_id`. Course-level composite foreign keys additionally prevent records from linking a lesson/cohort/enrollment from a different course inside the same organization.

## Delivered in this slice

- Academy permissions: read / learn / manage / assess / certify
- courses with draft/published/archived state
- ordered modules and lessons
- lesson types for article, video, live, assignment, quiz, project and external content
- cohorts with dates/capacity/status
- canonical user enrollment
- durable lesson progress
- learner evidence/artifact references + assessor workflow
- issued/revoked certificates
- same-organization and same-course relational integrity
- certificate → enrollment user integrity
- learner self-access through existing Supabase Auth identity
- manager/assessor/certifier RLS separation
- explicit SQL grants instead of relying on project-specific Supabase defaults
- no anonymous Academy database access in the foundation

## Important boundaries

- File/video bytes do not live in Academy tables; `artifact_ref` / `content_ref` point to approved storage or content systems.
- Public Academy marketing content is not silently migrated into tenant course records.
- Course completion is not automatically certified; `academy.certify` is a separate permission.
- Evidence acceptance and certificate issuance remain human/governed workflows until RINPO actions are explicitly approved.
- One canonical enrollment per organization/course/user is the foundation rule. Retakes/versioned credentials require a later explicit model rather than duplicate ambiguous rows.

## Next slice

1. repository/service layer and owner/admin Academy workspace;
2. enrollment/onboarding actions;
3. course progress projection and completion rules;
4. assignment/quiz assessment contracts;
5. certificate verification/public credential URL with privacy controls;
6. cohort scheduling, mentor/instructor roles and live-session integration;
7. portfolio/skills graph linked to RINADS ID;
8. talent/worker marketplace handoff after certification;
9. RINPO learning coach using scoped Academy context;
10. usage/ROI analytics: enrollment → completion → certification → project/work outcome.

## Public product gate

Until the UI/service layer is wired and production migrations are verified, the existing Academy pages remain product/experience surfaces. Do not claim persisted learner progress, certification issuance or cohort operations are live merely because the schema exists in source.
