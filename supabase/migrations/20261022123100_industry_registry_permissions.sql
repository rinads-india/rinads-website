-- Tighten Industry Registry tenant writes.
-- All organization members may read their organization classification.
-- Only users with org.manage may change primary/secondary industry mappings.

alter table public.organization_industries enable row level security;

drop policy if exists organization_industries_insert_member on public.organization_industries;
drop policy if exists organization_industries_update_member on public.organization_industries;
drop policy if exists organization_industries_delete_member on public.organization_industries;

create policy organization_industries_insert_manager
  on public.organization_industries for insert to authenticated
  with check (
    private.is_org_member(organization_id)
    and private.has_permission(organization_id, 'org.manage')
  );

create policy organization_industries_update_manager
  on public.organization_industries for update to authenticated
  using (
    private.is_org_member(organization_id)
    and private.has_permission(organization_id, 'org.manage')
  )
  with check (
    private.is_org_member(organization_id)
    and private.has_permission(organization_id, 'org.manage')
  );

create policy organization_industries_delete_manager
  on public.organization_industries for delete to authenticated
  using (
    private.is_org_member(organization_id)
    and private.has_permission(organization_id, 'org.manage')
  );
