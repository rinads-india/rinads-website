-- RI Entity Projection: unified slug-addressable registry
-- Thin read-model; canonical data stays in source tables.
-- entity_type values: 'service' | 'product' | 'industry' | 'place' | 'organization'
-- visibility: 'public' | 'org' | 'private'

create table if not exists public.ri_entities (
  id            uuid primary key default gen_random_uuid(),
  entity_type   text not null,
  canonical_id  text not null,           -- source table PK (UUID or slug string)
  slug          text not null unique,
  title         text not null,
  subtitle      text,
  description   text,
  pillar        text,
  tags          text[] default '{}',
  status        text not null default 'active' check (status in ('active','archived','draft')),
  visibility    text not null default 'public' check (visibility in ('public','org','private')),
  organization_id uuid references public.organizations(id) on delete cascade,
  cover_image_url text,
  href          text,                    -- canonical platform URL
  metadata      jsonb default '{}',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index if not exists ri_entities_type_idx on public.ri_entities(entity_type);
create index if not exists ri_entities_slug_idx on public.ri_entities(slug);
create index if not exists ri_entities_org_idx  on public.ri_entities(organization_id);
create index if not exists ri_entities_tags_idx on public.ri_entities using gin(tags);
create index if not exists ri_entities_fts_idx  on public.ri_entities
  using gin(to_tsvector('english', coalesce(title,'') || ' ' || coalesce(subtitle,'') || ' ' || coalesce(description,'')));

alter table public.ri_entities enable row level security;

create policy "ri_entities: anyone reads public"
  on public.ri_entities for select
  using (visibility = 'public');

create policy "ri_entities: org members read org-scoped"
  on public.ri_entities for select
  using (
    visibility = 'org'
    and organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid() and status = 'active'
    )
  );

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'ri_entities_updated_at') then
    create trigger ri_entities_updated_at
      before update on public.ri_entities
      for each row execute function public.set_updated_at();
  end if;
end $$;

-- Seed platform services into ri_entities (idempotent upsert)
insert into public.ri_entities (entity_type, canonical_id, slug, title, description, pillar, href, visibility)
select
  'service',
  id::text,
  slug,
  name,
  description,
  pillar,
  '/services/' || slug,
  'public'
from public.services
where is_active = true and organization_id is null
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  pillar = excluded.pillar,
  href = excluded.href,
  updated_at = now();
