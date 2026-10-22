-- Academy Core integrity follow-up: prove that modules, lessons, enrollments,
-- progress, evidence and certificates cannot cross-link different courses even
-- when every row belongs to the same organization.

create unique index if not exists academy_modules_org_id_course_unique
  on public.academy_modules(organization_id, id, course_id);
create unique index if not exists academy_cohorts_org_id_course_unique
  on public.academy_cohorts(organization_id, id, course_id);
create unique index if not exists academy_enrollments_org_id_course_unique
  on public.academy_enrollments(organization_id, id, course_id);
create unique index if not exists academy_enrollments_org_id_user_unique
  on public.academy_enrollments(organization_id, id, user_id);

alter table public.academy_lessons
  add column if not exists course_id uuid;

update public.academy_lessons l
set course_id = m.course_id
from public.academy_modules m
where m.organization_id = l.organization_id
  and m.id = l.module_id
  and l.course_id is null;

alter table public.academy_lessons
  alter column course_id set not null;

alter table public.academy_lessons
  drop constraint if exists academy_lessons_module_same_org_fk;
alter table public.academy_lessons
  add constraint academy_lessons_module_same_course_fk
  foreign key (organization_id, module_id, course_id)
  references public.academy_modules(organization_id, id, course_id)
  on delete cascade
  deferrable initially immediate;

create unique index if not exists academy_lessons_org_id_course_unique
  on public.academy_lessons(organization_id, id, course_id);

alter table public.academy_enrollments
  drop constraint if exists academy_enrollments_cohort_same_org_fk;
alter table public.academy_enrollments
  add constraint academy_enrollments_cohort_same_course_fk
  foreign key (organization_id, cohort_id, course_id)
  references public.academy_cohorts(organization_id, id, course_id)
  deferrable initially immediate;

alter table public.academy_lesson_progress
  add column if not exists course_id uuid;

update public.academy_lesson_progress p
set course_id = e.course_id
from public.academy_enrollments e
where e.organization_id = p.organization_id
  and e.id = p.enrollment_id
  and p.course_id is null;

alter table public.academy_lesson_progress
  alter column course_id set not null;

alter table public.academy_lesson_progress
  drop constraint if exists academy_progress_enrollment_same_org_fk;
alter table public.academy_lesson_progress
  drop constraint if exists academy_progress_lesson_same_org_fk;
alter table public.academy_lesson_progress
  add constraint academy_progress_enrollment_same_course_fk
  foreign key (organization_id, enrollment_id, course_id)
  references public.academy_enrollments(organization_id, id, course_id)
  on delete cascade
  deferrable initially immediate;
alter table public.academy_lesson_progress
  add constraint academy_progress_lesson_same_course_fk
  foreign key (organization_id, lesson_id, course_id)
  references public.academy_lessons(organization_id, id, course_id)
  on delete cascade
  deferrable initially immediate;

alter table public.academy_evidence
  add column if not exists course_id uuid;

update public.academy_evidence ev
set course_id = e.course_id
from public.academy_enrollments e
where e.organization_id = ev.organization_id
  and e.id = ev.enrollment_id
  and ev.course_id is null;

alter table public.academy_evidence
  alter column course_id set not null;

alter table public.academy_evidence
  drop constraint if exists academy_evidence_enrollment_same_org_fk;
alter table public.academy_evidence
  drop constraint if exists academy_evidence_lesson_same_org_fk;
alter table public.academy_evidence
  add constraint academy_evidence_enrollment_same_course_fk
  foreign key (organization_id, enrollment_id, course_id)
  references public.academy_enrollments(organization_id, id, course_id)
  on delete cascade
  deferrable initially immediate;
alter table public.academy_evidence
  add constraint academy_evidence_lesson_same_course_fk
  foreign key (organization_id, lesson_id, course_id)
  references public.academy_lessons(organization_id, id, course_id)
  deferrable initially immediate;

alter table public.academy_certificates
  drop constraint if exists academy_certificates_enrollment_same_org_fk;
alter table public.academy_certificates
  add constraint academy_certificates_enrollment_same_user_fk
  foreign key (organization_id, enrollment_id, user_id)
  references public.academy_enrollments(organization_id, id, user_id)
  deferrable initially immediate;

comment on column public.academy_lessons.course_id is
  'Denormalized course key used to enforce same-course module/progress/evidence foreign keys.';
comment on column public.academy_lesson_progress.course_id is
  'Integrity key proving the progress lesson belongs to the enrollment course.';
comment on column public.academy_evidence.course_id is
  'Integrity key proving submitted lesson evidence belongs to the enrollment course.';
