-- RINPO / Runtime hardening: immutable canonical events + per-consumer processing state
-- Canon rule: business_events are append-only. Processing state must not mutate the event row.

-- Keep the legacy column for compatibility, but explicitly deprecate it.
COMMENT ON COLUMN business_events.processed_at IS
  'DEPRECATED: business_events is append-only. Track processing in business_event_consumptions.';

-- Reject UPDATE/DELETE even for privileged application paths. Canonical events are immutable.
CREATE OR REPLACE FUNCTION private.prevent_business_event_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
BEGIN
  RAISE EXCEPTION 'business_events is append-only; % is not permitted', TG_OP
    USING ERRCODE = '42501';
END;
$$;

REVOKE ALL ON FUNCTION private.prevent_business_event_mutation() FROM PUBLIC;

DROP TRIGGER IF EXISTS business_events_append_only ON business_events;
CREATE TRIGGER business_events_append_only
  BEFORE UPDATE OR DELETE ON business_events
  FOR EACH ROW
  EXECUTE FUNCTION private.prevent_business_event_mutation();

-- Per-consumer processing state belongs outside the canonical event row.
CREATE TABLE IF NOT EXISTS business_event_consumptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES business_events(id) ON DELETE CASCADE,
  consumer_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'processed', 'failed')),
  attempt_count INT NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  processed_at TIMESTAMPTZ,
  last_error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, event_id, consumer_key)
);

CREATE INDEX IF NOT EXISTS idx_business_event_consumptions_poll
  ON business_event_consumptions(organization_id, consumer_key, status, updated_at);

-- Prevent a consumption record from pointing at an event owned by another organization.
CREATE OR REPLACE FUNCTION private.validate_business_event_consumption_org()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM business_events e
    WHERE e.id = NEW.event_id
      AND e.organization_id = NEW.organization_id
  ) THEN
    RAISE EXCEPTION 'business event does not belong to organization'
      USING ERRCODE = '23503';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.validate_business_event_consumption_org() FROM PUBLIC;

DROP TRIGGER IF EXISTS business_event_consumptions_org_guard ON business_event_consumptions;
CREATE TRIGGER business_event_consumptions_org_guard
  BEFORE INSERT OR UPDATE OF organization_id, event_id ON business_event_consumptions
  FOR EACH ROW
  EXECUTE FUNCTION private.validate_business_event_consumption_org();

ALTER TABLE business_event_consumptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY business_event_consumptions_member_select
  ON business_event_consumptions
  FOR SELECT
  TO authenticated
  USING (private.is_org_member(organization_id));

COMMENT ON TABLE business_event_consumptions IS
  'Mutable per-consumer processing state for immutable business_events.';
