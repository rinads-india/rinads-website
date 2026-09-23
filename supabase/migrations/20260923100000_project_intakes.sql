-- Public project intake — platform-global lead capture.
-- Writes are server-only via the website API using the service role.
-- No browser role receives direct table access.

create table if not exists public.project_intakes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'submitted'
    check (status in ('submitted', 'under_review', 'qualified', 'archived')),
  goal text not null
    check (goal in ('run', 'build', 'grow', 'sell', 'automate', 'create', 'learn', 'transform', 'other')),
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) between 3 and 254),
  company text,
  phone text,
  industry text,
  problem text not null check (char_length(problem) between 1 and 2500),
  desired_outcome text not null check (char_length(desired_outcome) between 1 and 2500),
  users_text text,
  current_tools text,
  must_haves text,
  budget_range text,
  timeline text,
  selected_needs text[] not null default '{}',
  brief jsonb not null default '{}'::jsonb,
  source_path text not null default '/projects',
  consent boolean not null default false,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  internal_notes text
);

create index if not exists idx_project_intakes_status_created
  on public.project_intakes(status, created_at desc);

create index if not exists idx_project_intakes_email_created
  on public.project_intakes(lower(email), created_at desc);

alter table public.project_intakes enable row level security;

revoke all on table public.project_intakes from public, anon, authenticated;
grant all on table public.project_intakes to service_role;

create or replace function public.project_intakes_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_project_intakes_updated_at on public.project_intakes;
create trigger trg_project_intakes_updated_at
before update on public.project_intakes
for each row execute function public.project_intakes_set_updated_at();

comment on table public.project_intakes is
  'Platform-global public project intake submissions. Browser roles have no direct access; writes occur via a validated server route.';
