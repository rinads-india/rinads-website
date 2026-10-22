-- Marketing OS Phase 0.2 publication privilege hardening.
-- Authenticated publishers retain authoring-only edits. Execution state remains
-- governed by approval/scheduling RPCs and service-role workers.

REVOKE UPDATE ON TABLE public.marketing_publications FROM PUBLIC, anon, authenticated;
REVOKE DELETE ON TABLE public.marketing_publications FROM PUBLIC, anon, authenticated;
REVOKE INSERT ON TABLE public.marketing_publications FROM PUBLIC, anon;

GRANT UPDATE (variant_id, channel_account_id, metadata)
  ON TABLE public.marketing_publications
  TO authenticated;

COMMENT ON TABLE public.marketing_publications IS
  'Marketing publication execution state is governed by approval/scheduling/worker RPCs; authenticated users can edit authoring-only fields.';
