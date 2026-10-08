create table if not exists public.world_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  reporter_id text not null check (char_length(reporter_id) <= 64),
  reported_id text not null check (char_length(reported_id) <= 64),
  reported_name text check (char_length(reported_name) <= 32),
  zone text check (char_length(zone) <= 32),
  reason text check (char_length(reason) <= 64),
  recent_chat text check (char_length(recent_chat) <= 1200),
  game_version text check (char_length(game_version) <= 16),
  status text not null default 'new'
);
comment on table public.world_reports is 'RINADS WORLD player reports from the in-game PEOPLE app (guest ids, last chat lines). Insert-only for the public; review in the dashboard or with the service role.';
alter table public.world_reports enable row level security;
create policy "public can file reports" on public.world_reports for insert to anon, authenticated
  with check (status = 'new');
revoke update, delete, select on public.world_reports from anon, authenticated;
grant insert on public.world_reports to anon, authenticated;
