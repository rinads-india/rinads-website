-- RINADS Marketing OS Phase 0.2
-- Governed publication approvals + idempotent publication worker protocol.
--
-- IMPORTANT: This migration does NOT enable any provider write transport.
-- Provider adapters remain fail-closed until a later, separately reviewed gate.

-- ---------------------------------------------------------------------------
-- Canonical Runtime approval linkage
-- ---------------------------------------------------------------------------
ALTER TABLE public.runtime_approvals
  ADD COLUMN IF NOT EXISTS resource_type TEXT,
  ADD COLUMN IF NOT EXISTS resource_id UUID,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'runtime_approvals_id_organization_key'
      AND conrelid = 'public.runtime_approvals'::regclass
  ) THEN
    ALTER TABLE public.runtime_approvals
      ADD CONSTRAINT runtime_approvals_id_organization_key
      UNIQUE (id, organization_id);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS runtime_approvals_one_pending_resource_uidx
  ON public.runtime_approvals(organization_id, action_key, resource_type, resource_id)
  WHERE status = 'pending' AND resource_type IS NOT NULL AND resource_id IS NOT NULL;

ALTER TABLE public.marketing_publications
  ADD COLUMN IF NOT EXISTS approval_id UUID,
  ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'marketing_publications_approval_same_org_fk'
      AND conrelid = 'public.marketing_publications'::regclass
  ) THEN
    ALTER TABLE public.marketing_publications
      ADD CONSTRAINT marketing_publications_approval_same_org_fk
      FOREIGN KEY (approval_id, organization_id)
      REFERENCES public.runtime_approvals(id, organization_id)
      ON DELETE RESTRICT;
  END IF;
END $$;

ALTER TABLE public.marketing_publication_attempts
  ADD COLUMN IF NOT EXISTS dispatch_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivery_state TEXT NOT NULL DEFAULT 'not_started';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'marketing_publication_attempts_delivery_state_check'
      AND conrelid = 'public.marketing_publication_attempts'::regclass
  ) THEN
    ALTER TABLE public.marketing_publication_attempts
      ADD CONSTRAINT marketing_publication_attempts_delivery_state_check
      CHECK (delivery_state IN ('not_started', 'sent', 'unknown'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS marketing_publications_processing_started_idx
  ON public.marketing_publications(processing_started_at)
  WHERE status = 'PROCESSING';

-- ---------------------------------------------------------------------------
-- Exact approved payload fingerprint.
-- This is an integrity fingerprint, not an authorization substitute. Authorization
-- remains RLS + permissions + canonical runtime_approvals.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.marketing_publication_payload_hash(
  p_publication_id UUID,
  p_organization_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, private, extensions
AS $$
DECLARE
  v_payload JSONB;
BEGIN
  SELECT jsonb_build_object(
    'publication_id', p.id,
    'organization_id', p.organization_id,
    'content_item_id', p.content_item_id,
    'variant_id', p.variant_id,
    'channel_account_id', p.channel_account_id,
    'publication_metadata', p.metadata,
    'content', jsonb_build_object(
      'title', c.title,
      'brief', c.brief,
      'content_type', c.content_type,
      'canonical_copy', c.canonical_copy
    ),
    'variant', CASE WHEN v.id IS NULL THEN NULL ELSE jsonb_build_object(
      'format', v.format,
      'copy', v.copy,
      'media_spec', v.media_spec,
      'metadata', v.metadata
    ) END,
    'media', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', a.id,
          'asset_kind', a.asset_kind,
          'storage_path', a.storage_path,
          'mime_type', a.mime_type,
          'checksum', a.checksum,
          'metadata', a.metadata
        ) ORDER BY a.id
      )
      FROM public.marketing_media_assets a
      WHERE a.organization_id = p.organization_id
        AND a.content_item_id = p.content_item_id
    ), '[]'::jsonb)
  )
  INTO v_payload
  FROM public.marketing_publications p
  JOIN public.marketing_content_items c
    ON c.id = p.content_item_id AND c.organization_id = p.organization_id
  LEFT JOIN public.marketing_content_variants v
    ON v.id = p.variant_id AND v.organization_id = p.organization_id
  WHERE p.id = p_publication_id
    AND p.organization_id = p_organization_id;

  IF v_payload IS NULL THEN
    RAISE EXCEPTION 'Marketing publication not found for tenant';
  END IF;

  RETURN encode(digest(convert_to(v_payload::text, 'UTF8'), 'sha256'), 'hex');
END;
$$;

REVOKE ALL ON FUNCTION private.marketing_publication_payload_hash(UUID, UUID) FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- Approval invalidation. Any externally meaningful creative/account mutation
-- invalidates pending/approved execution authority before another dispatch.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.invalidate_marketing_publication_approval(
  p_publication_id UUID,
  p_organization_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
  v_approval_id UUID;
BEGIN
  SELECT approval_id INTO v_approval_id
  FROM public.marketing_publications
  WHERE id = p_publication_id AND organization_id = p_organization_id;

  IF v_approval_id IS NOT NULL THEN
    UPDATE public.runtime_approvals
    SET status = 'expired',
        resolved_at = COALESCE(resolved_at, now()),
        metadata = metadata || jsonb_build_object('invalidated_reason', 'publication_payload_changed')
    WHERE id = v_approval_id
      AND organization_id = p_organization_id
      AND status = 'pending';
  END IF;

  UPDATE public.marketing_publications
  SET approval_id = NULL,
      status = CASE
        WHEN status IN ('REVIEW', 'APPROVED', 'SCHEDULED', 'FAILED') THEN 'REVIEW'
        ELSE status
      END,
      scheduled_at = CASE WHEN status IN ('APPROVED', 'SCHEDULED', 'FAILED') THEN NULL ELSE scheduled_at END,
      updated_at = now()
  WHERE id = p_publication_id
    AND organization_id = p_organization_id
    AND status NOT IN ('PROCESSING', 'PUBLISHED', 'PARTIAL_FAILURE', 'ARCHIVED');
END;
$$;

REVOKE ALL ON FUNCTION private.invalidate_marketing_publication_approval(UUID, UUID) FROM PUBLIC;

CREATE OR REPLACE FUNCTION private.invalidate_marketing_publications_for_content(
  p_content_item_id UUID,
  p_organization_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
  v_pub RECORD;
BEGIN
  IF p_content_item_id IS NULL THEN RETURN; END IF;
  FOR v_pub IN
    SELECT id
    FROM public.marketing_publications
    WHERE organization_id = p_organization_id
      AND content_item_id = p_content_item_id
      AND status NOT IN ('PROCESSING', 'PUBLISHED', 'PARTIAL_FAILURE', 'ARCHIVED')
  LOOP
    PERFORM private.invalidate_marketing_publication_approval(v_pub.id, p_organization_id);
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION private.invalidate_marketing_publications_for_content(UUID, UUID) FROM PUBLIC;

CREATE OR REPLACE FUNCTION private.marketing_content_change_invalidate_approvals()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
BEGIN
  IF TG_TABLE_NAME = 'marketing_content_items' THEN
    IF TG_OP = 'UPDATE' AND (
      OLD.title IS DISTINCT FROM NEW.title OR
      OLD.brief IS DISTINCT FROM NEW.brief OR
      OLD.content_type IS DISTINCT FROM NEW.content_type OR
      OLD.canonical_copy IS DISTINCT FROM NEW.canonical_copy OR
      OLD.metadata IS DISTINCT FROM NEW.metadata
    ) THEN
      PERFORM private.invalidate_marketing_publications_for_content(NEW.id, NEW.organization_id);
    END IF;
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'marketing_content_variants' THEN
    IF TG_OP = 'DELETE' THEN
      PERFORM private.invalidate_marketing_publications_for_content(OLD.content_item_id, OLD.organization_id);
      RETURN OLD;
    ELSIF TG_OP = 'INSERT' THEN
      PERFORM private.invalidate_marketing_publications_for_content(NEW.content_item_id, NEW.organization_id);
      RETURN NEW;
    ELSE
      IF OLD.content_item_id IS DISTINCT FROM NEW.content_item_id THEN
        PERFORM private.invalidate_marketing_publications_for_content(OLD.content_item_id, OLD.organization_id);
      END IF;
      IF OLD.content_item_id IS DISTINCT FROM NEW.content_item_id OR
         OLD.format IS DISTINCT FROM NEW.format OR
         OLD.copy IS DISTINCT FROM NEW.copy OR
         OLD.media_spec IS DISTINCT FROM NEW.media_spec OR
         OLD.metadata IS DISTINCT FROM NEW.metadata OR
         OLD.channel_account_id IS DISTINCT FROM NEW.channel_account_id THEN
        PERFORM private.invalidate_marketing_publications_for_content(NEW.content_item_id, NEW.organization_id);
      END IF;
      RETURN NEW;
    END IF;
  END IF;

  IF TG_TABLE_NAME = 'marketing_media_assets' THEN
    IF TG_OP = 'DELETE' THEN
      PERFORM private.invalidate_marketing_publications_for_content(OLD.content_item_id, OLD.organization_id);
      RETURN OLD;
    ELSIF TG_OP = 'INSERT' THEN
      PERFORM private.invalidate_marketing_publications_for_content(NEW.content_item_id, NEW.organization_id);
      RETURN NEW;
    ELSE
      IF OLD.content_item_id IS DISTINCT FROM NEW.content_item_id THEN
        PERFORM private.invalidate_marketing_publications_for_content(OLD.content_item_id, OLD.organization_id);
      END IF;
      IF OLD.content_item_id IS DISTINCT FROM NEW.content_item_id OR
         OLD.asset_kind IS DISTINCT FROM NEW.asset_kind OR
         OLD.storage_path IS DISTINCT FROM NEW.storage_path OR
         OLD.mime_type IS DISTINCT FROM NEW.mime_type OR
         OLD.checksum IS DISTINCT FROM NEW.checksum OR
         OLD.metadata IS DISTINCT FROM NEW.metadata THEN
        PERFORM private.invalidate_marketing_publications_for_content(NEW.content_item_id, NEW.organization_id);
      END IF;
      RETURN NEW;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

REVOKE ALL ON FUNCTION private.marketing_content_change_invalidate_approvals() FROM PUBLIC;

DROP TRIGGER IF EXISTS marketing_content_items_invalidate_publication_approval ON public.marketing_content_items;
CREATE TRIGGER marketing_content_items_invalidate_publication_approval
  AFTER UPDATE OF title, brief, content_type, canonical_copy, metadata
  ON public.marketing_content_items
  FOR EACH ROW EXECUTE FUNCTION private.marketing_content_change_invalidate_approvals();

DROP TRIGGER IF EXISTS marketing_content_variants_invalidate_publication_approval ON public.marketing_content_variants;
CREATE TRIGGER marketing_content_variants_invalidate_publication_approval
  AFTER INSERT OR UPDATE OR DELETE ON public.marketing_content_variants
  FOR EACH ROW EXECUTE FUNCTION private.marketing_content_change_invalidate_approvals();

DROP TRIGGER IF EXISTS marketing_media_assets_invalidate_publication_approval ON public.marketing_media_assets;
CREATE TRIGGER marketing_media_assets_invalidate_publication_approval
  AFTER INSERT OR UPDATE OR DELETE ON public.marketing_media_assets
  FOR EACH ROW EXECUTE FUNCTION private.marketing_content_change_invalidate_approvals();

CREATE OR REPLACE FUNCTION private.marketing_publication_change_invalidate_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
BEGIN
  IF OLD.variant_id IS DISTINCT FROM NEW.variant_id OR
     OLD.channel_account_id IS DISTINCT FROM NEW.channel_account_id OR
     OLD.metadata IS DISTINCT FROM NEW.metadata THEN
    PERFORM private.invalidate_marketing_publication_approval(NEW.id, NEW.organization_id);
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.marketing_publication_change_invalidate_approval() FROM PUBLIC;

DROP TRIGGER IF EXISTS marketing_publication_authoring_invalidate_approval ON public.marketing_publications;
CREATE TRIGGER marketing_publication_authoring_invalidate_approval
  AFTER UPDATE OF variant_id, channel_account_id, metadata
  ON public.marketing_publications
  FOR EACH ROW EXECUTE FUNCTION private.marketing_publication_change_invalidate_approval();

-- ---------------------------------------------------------------------------
-- Direct authenticated publication writes are authoring-only. Execution state
-- is controlled by the governed RPCs below and service-role workers.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS marketing_publications_insert_publish ON public.marketing_publications;
CREATE POLICY marketing_publications_insert_publish
  ON public.marketing_publications FOR INSERT TO authenticated
  WITH CHECK (
    (
      private.has_permission(organization_id, 'marketing.publish')
      OR private.has_permission(organization_id, 'org.manage')
    )
    AND status = 'DRAFT'
    AND approval_id IS NULL
    AND scheduled_at IS NULL
    AND published_at IS NULL
    AND external_post_id IS NULL
    AND external_url IS NULL
    AND processing_started_at IS NULL
    AND last_error IS NULL
  );

DROP POLICY IF EXISTS marketing_publications_update_publish ON public.marketing_publications;
DROP POLICY IF EXISTS marketing_publications_update_authoring ON public.marketing_publications;
CREATE POLICY marketing_publications_update_authoring
  ON public.marketing_publications FOR UPDATE TO authenticated
  USING (
    private.has_permission(organization_id, 'marketing.publish')
    OR private.has_permission(organization_id, 'org.manage')
  )
  WITH CHECK (
    private.has_permission(organization_id, 'marketing.publish')
    OR private.has_permission(organization_id, 'org.manage')
  );

REVOKE UPDATE ON TABLE public.marketing_publications FROM authenticated;
GRANT UPDATE (variant_id, channel_account_id, metadata) ON TABLE public.marketing_publications TO authenticated;

-- ---------------------------------------------------------------------------
-- Approval request / decision / scheduling RPCs.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.request_marketing_publication_approval(
  p_publication_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
  v_pub public.marketing_publications%ROWTYPE;
  v_approval_id UUID;
  v_hash TEXT;
BEGIN
  SELECT * INTO v_pub
  FROM public.marketing_publications
  WHERE id = p_publication_id
  FOR UPDATE;

  IF v_pub.id IS NULL THEN RAISE EXCEPTION 'Marketing publication not found'; END IF;
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF NOT (
    private.has_permission(v_pub.organization_id, 'marketing.publish')
    OR private.has_permission(v_pub.organization_id, 'org.manage')
  ) THEN
    RAISE EXCEPTION 'Missing marketing.publish permission';
  END IF;
  IF v_pub.status NOT IN ('DRAFT', 'REVIEW', 'FAILED') THEN
    RAISE EXCEPTION 'Publication status % cannot request approval', v_pub.status;
  END IF;

  v_hash := private.marketing_publication_payload_hash(v_pub.id, v_pub.organization_id);

  UPDATE public.runtime_approvals
  SET status = 'expired',
      resolved_at = COALESCE(resolved_at, now()),
      metadata = metadata || jsonb_build_object('superseded', true)
  WHERE organization_id = v_pub.organization_id
    AND action_key = 'marketing.publication.publish'
    AND resource_type = 'marketing_publication'
    AND resource_id = v_pub.id
    AND status = 'pending';

  INSERT INTO public.runtime_approvals (
    organization_id, action_key, payload_hash, risk_level, status,
    requested_by, reason, expires_at, resource_type, resource_id, metadata
  ) VALUES (
    v_pub.organization_id,
    'marketing.publication.publish',
    v_hash,
    'HIGH',
    'pending',
    auth.uid()::text,
    COALESCE(NULLIF(trim(p_reason), ''), 'Marketing publication requires human approval'),
    now() + interval '24 hours',
    'marketing_publication',
    v_pub.id,
    jsonb_build_object('publication_id', v_pub.id)
  )
  RETURNING id INTO v_approval_id;

  UPDATE public.marketing_publications
  SET status = 'REVIEW',
      approval_id = v_approval_id,
      scheduled_at = NULL,
      last_error = NULL,
      updated_at = now()
  WHERE id = v_pub.id AND organization_id = v_pub.organization_id;

  INSERT INTO public.business_events (
    organization_id, event_type, entity_type, entity_id, aggregate_type, aggregate_id,
    payload, idempotency_key, source, actor_type, actor_id, schema_version
  ) VALUES (
    v_pub.organization_id,
    'rinpo.action.requested',
    'marketing_publication',
    v_pub.id::text,
    'marketing_publication',
    v_pub.id::text,
    jsonb_build_object('approval_id', v_approval_id, 'action_key', 'marketing.publication.publish'),
    'rinpo.action.requested:marketing-publication:' || v_pub.id::text || ':' || v_approval_id::text,
    'marketing-os',
    'user',
    auth.uid()::text,
    'v1'
  )
  ON CONFLICT (organization_id, idempotency_key) DO NOTHING;

  RETURN v_approval_id;
END;
$$;

REVOKE ALL ON FUNCTION public.request_marketing_publication_approval(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_marketing_publication_approval(UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.resolve_marketing_publication_approval(
  p_approval_id UUID,
  p_decision TEXT,
  p_resolution_note TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
  v_approval public.runtime_approvals%ROWTYPE;
  v_pub public.marketing_publications%ROWTYPE;
  v_hash TEXT;
  v_event TEXT;
BEGIN
  IF p_decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Decision must be approved or rejected';
  END IF;

  SELECT * INTO v_approval
  FROM public.runtime_approvals
  WHERE id = p_approval_id
    AND action_key = 'marketing.publication.publish'
    AND resource_type = 'marketing_publication'
  FOR UPDATE;

  IF v_approval.id IS NULL THEN RAISE EXCEPTION 'Marketing approval not found'; END IF;
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF NOT private.has_permission(v_approval.organization_id, 'org.manage') THEN
    RAISE EXCEPTION 'Missing org.manage approval permission';
  END IF;
  IF v_approval.status <> 'pending' THEN
    RAISE EXCEPTION 'Approval is already %', v_approval.status;
  END IF;
  IF v_approval.expires_at <= now() THEN
    UPDATE public.runtime_approvals
    SET status = 'expired', resolved_at = now(), resolved_by = auth.uid()::text
    WHERE id = v_approval.id;
    UPDATE public.marketing_publications
    SET approval_id = NULL, status = 'REVIEW', updated_at = now()
    WHERE approval_id = v_approval.id AND organization_id = v_approval.organization_id;
    RAISE EXCEPTION 'Approval expired';
  END IF;

  SELECT * INTO v_pub
  FROM public.marketing_publications
  WHERE id = v_approval.resource_id
    AND organization_id = v_approval.organization_id
    AND approval_id = v_approval.id
  FOR UPDATE;

  IF v_pub.id IS NULL THEN RAISE EXCEPTION 'Publication is not bound to this approval'; END IF;

  v_hash := private.marketing_publication_payload_hash(v_pub.id, v_pub.organization_id);
  IF v_hash <> v_approval.payload_hash THEN
    UPDATE public.runtime_approvals
    SET status = 'expired',
        resolved_at = now(),
        resolved_by = auth.uid()::text,
        metadata = metadata || jsonb_build_object('invalidated_reason', 'payload_hash_mismatch')
    WHERE id = v_approval.id;
    UPDATE public.marketing_publications
    SET approval_id = NULL, status = 'REVIEW', scheduled_at = NULL, updated_at = now()
    WHERE id = v_pub.id AND organization_id = v_pub.organization_id;
    RAISE EXCEPTION 'Publication changed after approval request';
  END IF;

  UPDATE public.runtime_approvals
  SET status = p_decision,
      resolved_by = auth.uid()::text,
      resolved_at = now(),
      metadata = metadata || CASE
        WHEN NULLIF(trim(p_resolution_note), '') IS NULL THEN '{}'::jsonb
        ELSE jsonb_build_object('resolution_note', trim(p_resolution_note))
      END
  WHERE id = v_approval.id;

  IF p_decision = 'approved' THEN
    UPDATE public.marketing_publications
    SET status = 'APPROVED', last_error = NULL, updated_at = now()
    WHERE id = v_pub.id AND organization_id = v_pub.organization_id;
    v_event := 'rinpo.action.approved';
  ELSE
    UPDATE public.marketing_publications
    SET status = 'DRAFT', approval_id = NULL, scheduled_at = NULL, updated_at = now()
    WHERE id = v_pub.id AND organization_id = v_pub.organization_id;
    v_event := 'rinpo.action.rejected';
  END IF;

  INSERT INTO public.business_events (
    organization_id, event_type, entity_type, entity_id, aggregate_type, aggregate_id,
    payload, idempotency_key, source, actor_type, actor_id, schema_version
  ) VALUES (
    v_pub.organization_id,
    v_event,
    'marketing_publication',
    v_pub.id::text,
    'marketing_publication',
    v_pub.id::text,
    jsonb_build_object('approval_id', v_approval.id, 'decision', p_decision),
    v_event || ':marketing-publication:' || v_pub.id::text || ':' || v_approval.id::text,
    'marketing-os',
    'user',
    auth.uid()::text,
    'v1'
  )
  ON CONFLICT (organization_id, idempotency_key) DO NOTHING;

  RETURN p_decision;
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_marketing_publication_approval(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_marketing_publication_approval(UUID, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.schedule_marketing_publication(
  p_publication_id UUID,
  p_scheduled_at TIMESTAMPTZ
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
  v_pub public.marketing_publications%ROWTYPE;
  v_approval public.runtime_approvals%ROWTYPE;
  v_hash TEXT;
BEGIN
  SELECT * INTO v_pub
  FROM public.marketing_publications
  WHERE id = p_publication_id
  FOR UPDATE;

  IF v_pub.id IS NULL THEN RAISE EXCEPTION 'Marketing publication not found'; END IF;
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF NOT (
    private.has_permission(v_pub.organization_id, 'marketing.publish')
    OR private.has_permission(v_pub.organization_id, 'org.manage')
  ) THEN
    RAISE EXCEPTION 'Missing marketing.publish permission';
  END IF;
  IF p_scheduled_at IS NULL THEN RAISE EXCEPTION 'scheduled_at is required'; END IF;
  IF v_pub.status NOT IN ('APPROVED', 'SCHEDULED') OR v_pub.approval_id IS NULL THEN
    RAISE EXCEPTION 'Publication must be approved before scheduling';
  END IF;

  SELECT * INTO v_approval
  FROM public.runtime_approvals
  WHERE id = v_pub.approval_id
    AND organization_id = v_pub.organization_id;

  IF v_approval.id IS NULL OR v_approval.status <> 'approved' THEN
    RAISE EXCEPTION 'Canonical Runtime approval is not approved';
  END IF;

  v_hash := private.marketing_publication_payload_hash(v_pub.id, v_pub.organization_id);
  IF v_hash <> v_approval.payload_hash THEN
    PERFORM private.invalidate_marketing_publication_approval(v_pub.id, v_pub.organization_id);
    RAISE EXCEPTION 'Publication changed after approval';
  END IF;

  UPDATE public.marketing_publications
  SET status = 'SCHEDULED',
      scheduled_at = p_scheduled_at,
      processing_started_at = NULL,
      last_error = NULL,
      updated_at = now()
  WHERE id = v_pub.id AND organization_id = v_pub.organization_id;

  INSERT INTO public.business_events (
    organization_id, event_type, entity_type, entity_id, aggregate_type, aggregate_id,
    payload, idempotency_key, source, actor_type, actor_id, schema_version
  ) VALUES (
    v_pub.organization_id,
    'marketing.publication.scheduled',
    'marketing_publication',
    v_pub.id::text,
    'marketing_publication',
    v_pub.id::text,
    jsonb_build_object('scheduled_at', p_scheduled_at, 'approval_id', v_pub.approval_id),
    'marketing.publication.scheduled:' || v_pub.id::text || ':' || extract(epoch from p_scheduled_at)::bigint::text,
    'marketing-os',
    'user',
    auth.uid()::text,
    'v1'
  )
  ON CONFLICT (organization_id, idempotency_key) DO NOTHING;

  RETURN v_pub.id;
END;
$$;

REVOKE ALL ON FUNCTION public.schedule_marketing_publication(UUID, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.schedule_marketing_publication(UUID, TIMESTAMPTZ) TO authenticated;

-- ---------------------------------------------------------------------------
-- Service-role worker RPCs. The claim uses row locks + SKIP LOCKED so multiple
-- workers cannot claim the same publication. Approval hash is rechecked at claim.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_marketing_publications(p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  publication_id UUID,
  organization_id UUID,
  attempt_id UUID,
  attempt_no INTEGER,
  provider TEXT,
  channel_account_id UUID,
  approval_id UUID,
  approval_status TEXT,
  idempotency_key TEXT,
  publication_text TEXT,
  media_paths TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
  v_rec RECORD;
  v_attempt_id UUID;
  v_attempt_no INTEGER;
BEGIN
  IF COALESCE(auth.jwt() ->> 'role', '') <> 'service_role' THEN
    RAISE EXCEPTION 'Service role required';
  END IF;

  FOR v_rec IN
    SELECT
      p.id,
      p.organization_id,
      p.channel_account_id,
      p.approval_id,
      p.idempotency_key,
      ca.provider,
      COALESCE(NULLIF(v.copy, ''), c.canonical_copy, '') AS publication_text,
      COALESCE((
        SELECT array_agg(a.storage_path ORDER BY a.id)
        FROM public.marketing_media_assets a
        WHERE a.organization_id = p.organization_id
          AND a.content_item_id = p.content_item_id
      ), ARRAY[]::TEXT[]) AS media_paths
    FROM public.marketing_publications p
    JOIN public.runtime_approvals ra
      ON ra.id = p.approval_id
      AND ra.organization_id = p.organization_id
      AND ra.status = 'approved'
      AND ra.action_key = 'marketing.publication.publish'
      AND ra.resource_type = 'marketing_publication'
      AND ra.resource_id = p.id
    JOIN public.channel_accounts ca
      ON ca.id = p.channel_account_id
      AND ca.organization_id = p.organization_id
      AND ca.status = 'active'
    JOIN public.channel_connections cc
      ON cc.id = ca.connection_id
      AND cc.organization_id = p.organization_id
      AND cc.status = 'active'
    JOIN public.marketing_content_items c
      ON c.id = p.content_item_id AND c.organization_id = p.organization_id
    LEFT JOIN public.marketing_content_variants v
      ON v.id = p.variant_id AND v.organization_id = p.organization_id
    WHERE p.status = 'SCHEDULED'
      AND p.scheduled_at IS NOT NULL
      AND p.scheduled_at <= now()
      AND ra.payload_hash = private.marketing_publication_payload_hash(p.id, p.organization_id)
    ORDER BY p.scheduled_at, p.created_at
    FOR UPDATE OF p SKIP LOCKED
    LIMIT LEAST(GREATEST(COALESCE(p_limit, 20), 1), 100)
  LOOP
    SELECT COALESCE(MAX(mpa.attempt_no), 0) + 1
    INTO v_attempt_no
    FROM public.marketing_publication_attempts mpa
    WHERE mpa.publication_id = v_rec.id;

    INSERT INTO public.marketing_publication_attempts (
      organization_id, publication_id, attempt_no, status, delivery_state
    ) VALUES (
      v_rec.organization_id, v_rec.id, v_attempt_no, 'queued', 'not_started'
    )
    RETURNING id INTO v_attempt_id;

    UPDATE public.marketing_publications
    SET status = 'PROCESSING',
        processing_started_at = now(),
        last_error = NULL,
        updated_at = now()
    WHERE id = v_rec.id AND organization_id = v_rec.organization_id;

    publication_id := v_rec.id;
    organization_id := v_rec.organization_id;
    attempt_id := v_attempt_id;
    attempt_no := v_attempt_no;
    provider := v_rec.provider;
    channel_account_id := v_rec.channel_account_id;
    approval_id := v_rec.approval_id;
    approval_status := 'approved';
    idempotency_key := v_rec.idempotency_key;
    publication_text := v_rec.publication_text;
    media_paths := v_rec.media_paths;
    RETURN NEXT;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_marketing_publications(INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_marketing_publications(INTEGER) TO service_role;

CREATE OR REPLACE FUNCTION public.begin_marketing_publication_dispatch(
  p_publication_id UUID,
  p_attempt_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF COALESCE(auth.jwt() ->> 'role', '') <> 'service_role' THEN
    RAISE EXCEPTION 'Service role required';
  END IF;

  UPDATE public.marketing_publication_attempts a
  SET status = 'processing',
      started_at = COALESCE(started_at, now()),
      dispatch_started_at = COALESCE(dispatch_started_at, now()),
      delivery_state = 'unknown'
  FROM public.marketing_publications p
  WHERE a.id = p_attempt_id
    AND a.publication_id = p_publication_id
    AND p.id = p_publication_id
    AND a.organization_id = p.organization_id
    AND p.status = 'PROCESSING'
    AND a.status = 'queued'
    AND a.delivery_state = 'not_started';

  IF NOT FOUND THEN RAISE EXCEPTION 'Publication attempt is not dispatchable'; END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.begin_marketing_publication_dispatch(UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.begin_marketing_publication_dispatch(UUID, UUID) TO service_role;

CREATE OR REPLACE FUNCTION public.complete_marketing_publication_dispatch(
  p_publication_id UUID,
  p_attempt_id UUID,
  p_external_post_id TEXT,
  p_external_url TEXT DEFAULT NULL,
  p_provider_response JSONB DEFAULT '{}'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_org UUID;
BEGIN
  IF COALESCE(auth.jwt() ->> 'role', '') <> 'service_role' THEN
    RAISE EXCEPTION 'Service role required';
  END IF;
  IF NULLIF(trim(p_external_post_id), '') IS NULL THEN
    RAISE EXCEPTION 'external_post_id is required';
  END IF;

  SELECT organization_id INTO v_org
  FROM public.marketing_publications
  WHERE id = p_publication_id AND status = 'PROCESSING'
  FOR UPDATE;
  IF v_org IS NULL THEN RAISE EXCEPTION 'Publication is not processing'; END IF;

  UPDATE public.marketing_publication_attempts
  SET status = 'succeeded',
      finished_at = now(),
      delivery_state = 'sent',
      provider_response = COALESCE(p_provider_response, '{}'::jsonb),
      error_code = NULL,
      error_message = NULL
  WHERE id = p_attempt_id
    AND publication_id = p_publication_id
    AND organization_id = v_org
    AND status = 'processing'
    AND dispatch_started_at IS NOT NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'Publication attempt is not in-flight'; END IF;

  UPDATE public.marketing_publications
  SET status = 'PUBLISHED',
      published_at = now(),
      external_post_id = trim(p_external_post_id),
      external_url = p_external_url,
      processing_started_at = NULL,
      last_error = NULL,
      updated_at = now()
  WHERE id = p_publication_id AND organization_id = v_org;

  INSERT INTO public.business_events (
    organization_id, event_type, entity_type, entity_id, aggregate_type, aggregate_id,
    payload, idempotency_key, source, actor_type, schema_version
  ) VALUES (
    v_org,
    'marketing.publication.published',
    'marketing_publication',
    p_publication_id::text,
    'marketing_publication',
    p_publication_id::text,
    jsonb_build_object('attempt_id', p_attempt_id, 'external_post_id', trim(p_external_post_id)),
    'marketing.publication.published:' || p_publication_id::text,
    'marketing-os-worker',
    'system',
    'v1'
  )
  ON CONFLICT (organization_id, idempotency_key) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_marketing_publication_dispatch(UUID, UUID, TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_marketing_publication_dispatch(UUID, UUID, TEXT, TEXT, JSONB) TO service_role;

CREATE OR REPLACE FUNCTION public.fail_marketing_publication_dispatch(
  p_publication_id UUID,
  p_attempt_id UUID,
  p_error_code TEXT,
  p_error_message TEXT,
  p_delivery_state TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_org UUID;
  v_status TEXT;
  v_attempt_state TEXT;
BEGIN
  IF COALESCE(auth.jwt() ->> 'role', '') <> 'service_role' THEN
    RAISE EXCEPTION 'Service role required';
  END IF;
  IF p_delivery_state NOT IN ('not_sent', 'unknown') THEN
    RAISE EXCEPTION 'delivery_state must be not_sent or unknown';
  END IF;

  SELECT p.organization_id, a.delivery_state
  INTO v_org, v_attempt_state
  FROM public.marketing_publications p
  JOIN public.marketing_publication_attempts a
    ON a.publication_id = p.id AND a.organization_id = p.organization_id
  WHERE p.id = p_publication_id
    AND a.id = p_attempt_id
    AND p.status = 'PROCESSING'
  FOR UPDATE OF p, a;

  IF v_org IS NULL THEN RAISE EXCEPTION 'Publication attempt is not processing'; END IF;
  IF p_delivery_state = 'not_sent' AND v_attempt_state <> 'not_started' THEN
    RAISE EXCEPTION 'Cannot mark not_sent after dispatch started';
  END IF;

  v_status := CASE WHEN p_delivery_state = 'unknown' THEN 'PARTIAL_FAILURE' ELSE 'FAILED' END;

  UPDATE public.marketing_publication_attempts
  SET status = 'failed',
      finished_at = now(),
      error_code = COALESCE(NULLIF(p_error_code, ''), 'publication_failed'),
      error_message = COALESCE(NULLIF(p_error_message, ''), 'Publication dispatch failed'),
      delivery_state = CASE WHEN p_delivery_state = 'unknown' THEN 'unknown' ELSE 'not_started' END
  WHERE id = p_attempt_id AND publication_id = p_publication_id AND organization_id = v_org;

  UPDATE public.marketing_publications
  SET status = v_status,
      processing_started_at = NULL,
      last_error = COALESCE(NULLIF(p_error_message, ''), 'Publication dispatch failed'),
      updated_at = now()
  WHERE id = p_publication_id AND organization_id = v_org;

  INSERT INTO public.business_events (
    organization_id, event_type, entity_type, entity_id, aggregate_type, aggregate_id,
    payload, idempotency_key, source, actor_type, schema_version
  ) VALUES (
    v_org,
    'marketing.publication.failed',
    'marketing_publication',
    p_publication_id::text,
    'marketing_publication',
    p_publication_id::text,
    jsonb_build_object(
      'attempt_id', p_attempt_id,
      'delivery_state', p_delivery_state,
      'status', v_status,
      'error_code', COALESCE(NULLIF(p_error_code, ''), 'publication_failed')
    ),
    'marketing.publication.failed:' || p_publication_id::text || ':' || p_attempt_id::text,
    'marketing-os-worker',
    'system',
    'v1'
  )
  ON CONFLICT (organization_id, idempotency_key) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.fail_marketing_publication_dispatch(UUID, UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fail_marketing_publication_dispatch(UUID, UUID, TEXT, TEXT, TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.recover_stale_marketing_publication_dispatches(
  p_stale_after_minutes INTEGER DEFAULT 10,
  p_limit INTEGER DEFAULT 100
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_rec RECORD;
  v_requeued INTEGER := 0;
  v_partial INTEGER := 0;
BEGIN
  IF COALESCE(auth.jwt() ->> 'role', '') <> 'service_role' THEN
    RAISE EXCEPTION 'Service role required';
  END IF;

  FOR v_rec IN
    SELECT p.id, p.organization_id, a.id AS attempt_id, a.dispatch_started_at, a.delivery_state
    FROM public.marketing_publications p
    JOIN LATERAL (
      SELECT mpa.*
      FROM public.marketing_publication_attempts mpa
      WHERE mpa.publication_id = p.id
      ORDER BY mpa.attempt_no DESC
      LIMIT 1
    ) a ON true
    WHERE p.status = 'PROCESSING'
      AND p.processing_started_at < now() - make_interval(mins => GREATEST(COALESCE(p_stale_after_minutes, 10), 1))
    ORDER BY p.processing_started_at
    FOR UPDATE OF p SKIP LOCKED
    LIMIT LEAST(GREATEST(COALESCE(p_limit, 100), 1), 500)
  LOOP
    IF v_rec.dispatch_started_at IS NULL AND v_rec.delivery_state = 'not_started' THEN
      UPDATE public.marketing_publication_attempts
      SET status = 'failed',
          finished_at = now(),
          error_code = 'stale_before_dispatch',
          error_message = 'Worker lease expired before provider dispatch'
      WHERE id = v_rec.attempt_id;

      UPDATE public.marketing_publications
      SET status = 'SCHEDULED',
          scheduled_at = LEAST(COALESCE(scheduled_at, now()), now()),
          processing_started_at = NULL,
          last_error = 'Recovered stale worker before provider dispatch',
          updated_at = now()
      WHERE id = v_rec.id AND organization_id = v_rec.organization_id;
      v_requeued := v_requeued + 1;
    ELSE
      UPDATE public.marketing_publication_attempts
      SET status = 'failed',
          finished_at = now(),
          delivery_state = 'unknown',
          error_code = 'stale_after_dispatch',
          error_message = 'Worker lease expired after dispatch began; manual reconciliation required'
      WHERE id = v_rec.attempt_id;

      UPDATE public.marketing_publications
      SET status = 'PARTIAL_FAILURE',
          processing_started_at = NULL,
          last_error = 'Dispatch outcome unknown; manual reconciliation required',
          updated_at = now()
      WHERE id = v_rec.id AND organization_id = v_rec.organization_id;
      v_partial := v_partial + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('requeued_before_dispatch', v_requeued, 'partial_failure_after_dispatch', v_partial);
END;
$$;

REVOKE ALL ON FUNCTION public.recover_stale_marketing_publication_dispatches(INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.recover_stale_marketing_publication_dispatches(INTEGER, INTEGER) TO service_role;

COMMENT ON COLUMN public.marketing_publications.approval_id IS
  'Canonical Runtime approval bound to the exact publication payload. Creative/account changes invalidate this link.';
COMMENT ON COLUMN public.marketing_publication_attempts.delivery_state IS
  'not_started=safe to retry, unknown=provider request may have been delivered, sent=confirmed success. Never auto-retry unknown.';
COMMENT ON FUNCTION public.claim_marketing_publications(INTEGER) IS
  'Service-role only claim/lease entrypoint. Claims only due, approved, hash-matching publications using SKIP LOCKED.';
