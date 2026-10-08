-- RINADS WORLD wishlist sign-ups from world.rinads.com. Public may insert only; nobody can read via the API.
create table public.world_wishlist (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text not null check (char_length(email) between 5 and 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  name text check (name is null or char_length(name) <= 80),
  city text check (city is null or char_length(city) <= 80),
  marketing_consent boolean not null default false,
  source text not null default 'world.rinads.com' check (char_length(source) <= 60),
  game_version text check (game_version is null or char_length(game_version) <= 20)
);
create unique index world_wishlist_email_key on public.world_wishlist (lower(email));
alter table public.world_wishlist enable row level security;
revoke all on public.world_wishlist from anon, authenticated;
grant insert (email, name, city, marketing_consent, source, game_version) on public.world_wishlist to anon, authenticated;
create policy "Public can join the wishlist" on public.world_wishlist
  for insert to anon, authenticated with check (true);
comment on table public.world_wishlist is 'RINADS WORLD wishlist sign-ups (world.rinads.com). Insert-only for the public; read in the dashboard or with the service role.';
