-- Marketing OS Phase 0.2 transaction-safety hardening.
-- Keeps approval invalidation durable: state changes that intentionally invalidate
-- an approval return an explicit outcome instead of raising an exception that
-- would roll the transaction back.

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
    END IF;

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

  IF TG_TABLE_NAME = 'marketing_media_assets' THEN
    IF TG_OP = 'DELETE' THEN
      PERFORM private.invalidate_marketing_publications_for_content(OLD.content_item_id, OLD.organization_id);
      RETURN OLD;
    ELSIF TG_OP = 'INSERT' THEN
      PERFORM private.invalidate_marketing_publications_for_content(NEW.content_item_id, NEW.organization_id);
      RETURN NEW;
    END IF;

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

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.marketing_content_change_invalidate_approvals() FROM PUBLIC;

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
    SET approval_id = NULL, status = 'REVIEW', scheduled_at = NULL, updated_at = now()
    WHERE approval_id = v_approval.id AND organization_id = v_approval.organization_id;
    RETURN 'expired';
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
    RETURN 'invalidated';
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
    RETURN NULL;
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
