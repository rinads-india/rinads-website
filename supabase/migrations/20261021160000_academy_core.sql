-- Business Cloud V2: RINADS Academy durable learning domain.
--
-- Public Academy marketing/content routes remain unchanged. This migration adds
-- tenant-scoped learning truth for courses, cohorts, enrollment, progress,
-- evidence and certification. It does not create a second auth/user system.

insert into public.permissions (key, description)
values
  ('academy.read', 'Read Academy course/cohort and learning operations'),
  ('academy.learn', 'Access assigned Academy learning and submit learner progress/evidence'),
  ('academy.manage', 'Create and manage Academy courses, lessons, cohorts and enrollments'),
  ('academy.assess', 'Review learner evidence and assessment state'),
  ('academy.certify', 'Issue and revoke Academy certificates')
on conflict (key) do nothing;

create table if not exists public.academy_courses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  slug text not null,
  title text not null,
  description text not null default '',
  level text not null default 'all' check (level in ('all', 'beginner', 'intermediate', 'advanced')),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  estimated_minutes integer check (estimated_minutes is null or estimated_minutes >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, slug),
  check (length(btrim(slug)) > 0),
  check (length(btrim(title)) > 0)
);

create table if not exists public.academy_modules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  course_id uuid not null,
  title text not null,
  description text not null default '',
  position integer not null check (position > 0),
  is_required boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (course_id, position),
  constraint academy_modules_course_same_org_fk
    foreign key (organization_id, course_id)
    references public.academy_courses(organization_id, id)
    on delete cascade
    deferrable initially immediate
);

create table if not exists public.academy_lessons (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  module_id uuid not null,
  title text not null,
  lesson_type text not null default 'article'
    check (lesson_type in ('article', 'video', 'live', 'assignment', 'quiz', 'project', 'external')),
  position integer not null check (position > 0),
  duration_minutes integer check (duration_minutes is null or duration_minutes >= 0),
  content_ref text,
  is_required boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (module_id, position),
  constraint academy_lessons_module_same_org_fk
    foreign key (organization_id, module_id)
    references public.academy_modules(organization_id, id)
    on delete cascade
    deferrable initially immediate
);

create table if not exists public.academy_cohorts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  course_id uuid not null,
  name text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  status text not null default 'planned'
    check (status in ('planned', 'active', 'completed', 'cancelled')),
  capacity integer check (capacity is null or capacity > 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  constraint academy_cohorts_course_same_org_fk
    foreign key (organization_id, course_id)
    references public.academy_courses(organization_id, id)
    on delete cascade
    deferrable initially immediate,
  check (ends_at is null or starts_at is null or ends_at >= starts_at)
);

create table if not exists public.academy_enrollments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  course_id uuid not null,
  cohort_id uuid,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active'
    check (status in ('invited', 'active', 'completed', 'withdrawn')),
  enrolled_at timestamptz not null default now(),
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, course_id, user_id),
  constraint academy_enrollments_course_same_org_fk
    foreign key (organization_id, course_id)
    references public.academy_courses(organization_id, id)
    deferrable initially immediate,
  constraint academy_enrollments_cohort_same_org_fk
    foreign key (organization_id, cohort_id)
    references public.academy_cohorts(organization_id, id)
    deferrable initially immediate,
  check (completed_at is null or completed_at >= enrolled_at)
);

create table if not exists public.academy_lesson_progress (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  enrollment_id uuid not null,
  lesson_id uuid not null,
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'completed', 'skipped')),
  progress_percent integer not null default 0 check (progress_percent between 0 and 100),
  started_at timestamptz,
  completed_at timestamptz,
  last_seen_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (enrollment_id, lesson_id),
  constraint academy_progress_enrollment_same_org_fk
    foreign key (organization_id, enrollment_id)
    references public.academy_enrollments(organization_id, id)
    on delete cascade
    deferrable initially immediate,
  constraint academy_progress_lesson_same_org_fk
    foreign key (organization_id, lesson_id)
    references public.academy_lessons(organization_id, id)
    on delete cascade
    deferrable initially immediate,
  check (completed_at is null or started_at is null or completed_at >= started_at)
);

create table if not exists public.academy_evidence (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  enrollment_id uuid not null,
  lesson_id uuid,
  submitted_by uuid not null references auth.users(id) on delete cascade default auth.uid(),
  title text not null,
  artifact_ref text not null,
  status text not null default 'submitted'
    check (status in ('submitted', 'accepted', 'revision_requested', 'rejected')),
  assessor_id uuid references auth.users(id) on delete set null,
  assessor_feedback text,
  submitted_at timestamptz not null default now(),
  assessed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  constraint academy_evidence_enrollment_same_org_fk
    foreign key (organization_id, enrollment_id)
    references public.academy_enrollments(organization_id, id)
    on delete cascade
    deferrable initially immediate,
  constraint academy_evidence_lesson_same_org_fk
    foreign key (organization_id, lesson_id)
    references public.academy_lessons(organization_id, id)
    deferrable initially immediate
);

create table if not exists public.academy_certificates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  enrollment_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  certificate_number text not null,
  status text not null default 'active' check (status in ('active', 'revoked')),
  issued_at timestamptz not null default now(),
  issued_by uuid references auth.users(id) on delete set null default auth.uid(),
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id) on delete set null,
  revoke_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, certificate_number),
  unique (organization_id, enrollment_id),
  constraint academy_certificates_enrollment_same_org_fk
    foreign key (organization_id, enrollment_id)
    references public.academy_enrollments(organization_id, id)
    deferrable initially immediate,
  check ((status = 'active' and revoked_at is null) or (status = 'revoked' and revoked_at is not null))
);

create index if not exists academy_courses_org_status_idx
  on public.academy_courses(organization_id, status, updated_at desc);
create index if not exists academy_modules_course_position_idx
  on public.academy_modules(organization_id, course_id, position);
create index if not exists academy_lessons_module_position_idx
  on public.academy_lessons(organization_id, module_id, position);
create index if not exists academy_cohorts_org_status_idx
  on public.academy_cohorts(organization_id, status, starts_at);
create index if not exists academy_enrollments_user_status_idx
  on public.academy_enrollments(organization_id, user_id, status);
create index if not exists academy_progress_enrollment_idx
  on public.academy_lesson_progress(organization_id, enrollment_id, status);
create index if not exists academy_evidence_enrollment_status_idx
  on public.academy_evidence(organization_id, enrollment_id, status, submitted_at desc);
create index if not exists academy_certificates_user_idx
  on public.academy_certificates(organization_id, user_id, issued_at desc);

alter table public.academy_courses enable row level security;
alter table public.academy_modules enable row level security;
alter table public.academy_lessons enable row level security;
alter table public.academy_cohorts enable row level security;
alter table public.academy_enrollments enable row level security;
alter table public.academy_lesson_progress enable row level security;
alter table public.academy_evidence enable row level security;
alter table public.academy_certificates enable row level security;

-- Explicit grants: never depend on project-specific Supabase defaults.
revoke all
  on table public.academy_courses,
           public.academy_modules,
           public.academy_lessons,
           public.academy_cohorts,
           public.academy_enrollments,
           public.academy_lesson_progress,
           public.academy_evidence,
           public.academy_certificates
  from anon;

grant select, insert, update
  on table public.academy_courses,
           public.academy_modules,
           public.academy_lessons,
           public.academy_cohorts,
           public.academy_enrollments,
           public.academy_lesson_progress,
           public.academy_evidence,
           public.academy_certificates
  to authenticated;

grant all
  on table public.academy_courses,
           public.academy_modules,
           public.academy_lessons,
           public.academy_cohorts,
           public.academy_enrollments,
           public.academy_lesson_progress,
           public.academy_evidence,
           public.academy_certificates
  to service_role;

-- Course structure / cohort content read.
do $$
declare
  t text;
begin
  foreach t in array array['academy_courses','academy_modules','academy_lessons','academy_cohorts']
  loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (' ||
      'private.has_permission(organization_id, ''academy.read'') or ' ||
      'private.has_permission(organization_id, ''academy.learn'') or ' ||
      'private.has_permission(organization_id, ''academy.manage'') or ' ||
      'private.has_permission(organization_id, ''academy.assess'') or ' ||
      'private.has_permission(organization_id, ''academy.certify'') or ' ||
      'private.has_permission(organization_id, ''org.manage''))',
      t || '_select', t
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (' ||
      'private.has_permission(organization_id, ''academy.manage'') or ' ||
      'private.has_permission(organization_id, ''org.manage''))',
      t || '_insert', t
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (' ||
      'private.has_permission(organization_id, ''academy.manage'') or ' ||
      'private.has_permission(organization_id, ''org.manage'')) with check (' ||
      'private.has_permission(organization_id, ''academy.manage'') or ' ||
      'private.has_permission(organization_id, ''org.manage''))',
      t || '_update', t
    );
  end loop;
end $$;

create policy academy_enrollments_select on public.academy_enrollments
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or private.has_permission(organization_id, 'academy.read')
    or private.has_permission(organization_id, 'academy.manage')
    or private.has_permission(organization_id, 'academy.assess')
    or private.has_permission(organization_id, 'academy.certify')
    or private.has_permission(organization_id, 'org.manage')
  );
create policy academy_enrollments_insert on public.academy_enrollments
  for insert to authenticated
  with check (
    private.has_permission(organization_id, 'academy.manage')
    or private.has_permission(organization_id, 'org.manage')
  );
create policy academy_enrollments_update on public.academy_enrollments
  for update to authenticated
  using (
    private.has_permission(organization_id, 'academy.manage')
    or private.has_permission(organization_id, 'org.manage')
  )
  with check (
    private.has_permission(organization_id, 'academy.manage')
    or private.has_permission(organization_id, 'org.manage')
  );

create policy academy_progress_select on public.academy_lesson_progress
  for select to authenticated
  using (
    exists (
      select 1 from public.academy_enrollments e
      where e.organization_id = academy_lesson_progress.organization_id
        and e.id = academy_lesson_progress.enrollment_id
        and e.user_id = (select auth.uid())
    )
    or private.has_permission(organization_id, 'academy.read')
    or private.has_permission(organization_id, 'academy.manage')
    or private.has_permission(organization_id, 'academy.assess')
    or private.has_permission(organization_id, 'org.manage')
  );
create policy academy_progress_insert on public.academy_lesson_progress
  for insert to authenticated
  with check (
    (
      private.has_permission(organization_id, 'academy.learn')
      and exists (
        select 1 from public.academy_enrollments e
        where e.organization_id = academy_lesson_progress.organization_id
          and e.id = academy_lesson_progress.enrollment_id
          and e.user_id = (select auth.uid())
          and e.status = 'active'
      )
    )
    or private.has_permission(organization_id, 'academy.manage')
    or private.has_permission(organization_id, 'org.manage')
  );
create policy academy_progress_update on public.academy_lesson_progress
  for update to authenticated
  using (
    (
      private.has_permission(organization_id, 'academy.learn')
      and exists (
        select 1 from public.academy_enrollments e
        where e.organization_id = academy_lesson_progress.organization_id
          and e.id = academy_lesson_progress.enrollment_id
          and e.user_id = (select auth.uid())
          and e.status = 'active'
      )
    )
    or private.has_permission(organization_id, 'academy.manage')
    or private.has_permission(organization_id, 'org.manage')
  )
  with check (
    (
      private.has_permission(organization_id, 'academy.learn')
      and exists (
        select 1 from public.academy_enrollments e
        where e.organization_id = academy_lesson_progress.organization_id
          and e.id = academy_lesson_progress.enrollment_id
          and e.user_id = (select auth.uid())
          and e.status = 'active'
      )
    )
    or private.has_permission(organization_id, 'academy.manage')
    or private.has_permission(organization_id, 'org.manage')
  );

create policy academy_evidence_select on public.academy_evidence
  for select to authenticated
  using (
    submitted_by = (select auth.uid())
    or private.has_permission(organization_id, 'academy.read')
    or private.has_permission(organization_id, 'academy.manage')
    or private.has_permission(organization_id, 'academy.assess')
    or private.has_permission(organization_id, 'org.manage')
  );
create policy academy_evidence_insert on public.academy_evidence
  for insert to authenticated
  with check (
    (
      submitted_by = (select auth.uid())
      and private.has_permission(organization_id, 'academy.learn')
      and exists (
        select 1 from public.academy_enrollments e
        where e.organization_id = academy_evidence.organization_id
          and e.id = academy_evidence.enrollment_id
          and e.user_id = (select auth.uid())
          and e.status = 'active'
      )
    )
    or private.has_permission(organization_id, 'academy.manage')
    or private.has_permission(organization_id, 'org.manage')
  );
create policy academy_evidence_update on public.academy_evidence
  for update to authenticated
  using (
    private.has_permission(organization_id, 'academy.assess')
    or private.has_permission(organization_id, 'academy.manage')
    or private.has_permission(organization_id, 'org.manage')
  )
  with check (
    private.has_permission(organization_id, 'academy.assess')
    or private.has_permission(organization_id, 'academy.manage')
    or private.has_permission(organization_id, 'org.manage')
  );

create policy academy_certificates_select on public.academy_certificates
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or private.has_permission(organization_id, 'academy.read')
    or private.has_permission(organization_id, 'academy.manage')
    or private.has_permission(organization_id, 'academy.certify')
    or private.has_permission(organization_id, 'org.manage')
  );
create policy academy_certificates_insert on public.academy_certificates
  for insert to authenticated
  with check (
    private.has_permission(organization_id, 'academy.certify')
    or private.has_permission(organization_id, 'org.manage')
  );
create policy academy_certificates_update on public.academy_certificates
  for update to authenticated
  using (
    private.has_permission(organization_id, 'academy.certify')
    or private.has_permission(organization_id, 'org.manage')
  )
  with check (
    private.has_permission(organization_id, 'academy.certify')
    or private.has_permission(organization_id, 'org.manage')
  );

comment on table public.academy_courses is
  'Tenant Academy course authority. Public marketing pages remain separate until explicitly wired.';
comment on table public.academy_enrollments is
  'One canonical learner enrollment per organization/course/user in the foundation release.';
comment on table public.academy_lesson_progress is
  'Per-enrollment durable lesson progress; learner writes are constrained to their active enrollment.';
comment on table public.academy_evidence is
  'Learner evidence/artifact reference with assessor workflow; file bytes belong in approved storage, not this table.';
comment on table public.academy_certificates is
  'Issued/revoked Academy certificate record; certificate issuance requires academy.certify or org.manage.';
