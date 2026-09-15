-- R GLOW Phase D — salon_notes (Part A). One polymorphic table serves
-- appointment notes, customer notes, and staff tasks instead of three
-- separate tables — entity_type discriminates the target, visibility gates
-- whether a customer-facing surface could ever show it (nothing here is
-- exposed publicly today; this flag exists so that boundary is explicit
-- if/when a customer portal is built).

CREATE TABLE IF NOT EXISTS salon_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('appointment', 'customer', 'staff_task')),
  entity_id UUID NOT NULL,
  body TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'internal' CHECK (visibility IN ('internal', 'customer_visible')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done', 'cancelled')),
  assigned_to UUID REFERENCES organization_members(id) ON DELETE SET NULL,
  due_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_salon_notes_org ON salon_notes(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_salon_notes_entity ON salon_notes(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_salon_notes_assigned ON salon_notes(assigned_to) WHERE status = 'open';

DROP TRIGGER IF EXISTS trg_salon_notes_updated_at ON salon_notes;
CREATE TRIGGER trg_salon_notes_updated_at
  BEFORE UPDATE ON salon_notes
  FOR EACH ROW EXECUTE FUNCTION salon_pos_set_updated_at();

ALTER TABLE salon_notes ENABLE ROW LEVEL SECURITY;

-- Admin/manager (org.manage) get full access to every note. Staff can read
-- and create notes for appointments at their own branch, and read/create
-- customer notes as any org member (front-desk needs customer context).
-- Staff tasks are visible to the assignee plus org.manage.
CREATE POLICY salon_notes_select_scoped ON salon_notes
  FOR SELECT TO authenticated
  USING (
    private.has_permission(organization_id, 'org.manage')
    OR (
      entity_type = 'appointment'
      AND EXISTS (
        SELECT 1 FROM salon_appointments a
        WHERE a.id = salon_notes.entity_id
          AND private.is_salon_staff_for_branch(a.branch_id)
      )
    )
    OR (entity_type = 'customer' AND private.is_org_member(organization_id))
    OR (
      entity_type = 'staff_task'
      AND (
        private.is_org_member(organization_id)
        AND (
          assigned_to IS NULL
          OR EXISTS (
            SELECT 1 FROM organization_members m
            WHERE m.id = salon_notes.assigned_to AND m.user_id = auth.uid()
          )
        )
      )
    )
  );

CREATE POLICY salon_notes_insert_scoped ON salon_notes
  FOR INSERT TO authenticated
  WITH CHECK (
    private.is_org_member(organization_id)
    AND (
      private.has_permission(organization_id, 'org.manage')
      OR (
        entity_type = 'appointment'
        AND EXISTS (
          SELECT 1 FROM salon_appointments a
          WHERE a.id = salon_notes.entity_id
            AND private.is_salon_staff_for_branch(a.branch_id)
        )
      )
      OR entity_type = 'customer'
      OR entity_type = 'staff_task'
    )
  );

CREATE POLICY salon_notes_update_scoped ON salon_notes
  FOR UPDATE TO authenticated
  USING (
    private.has_permission(organization_id, 'org.manage')
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM organization_members m
      WHERE m.id = salon_notes.assigned_to AND m.user_id = auth.uid()
    )
  )
  WITH CHECK (
    private.has_permission(organization_id, 'org.manage')
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM organization_members m
      WHERE m.id = salon_notes.assigned_to AND m.user_id = auth.uid()
    )
  );

CREATE POLICY salon_notes_delete_manage ON salon_notes
  FOR DELETE TO authenticated
  USING (private.has_permission(organization_id, 'org.manage'));
