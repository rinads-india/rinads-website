-- Fix assign_service_order: cardinality() does not apply to jsonb

CREATE OR REPLACE FUNCTION assign_service_order(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order service_orders%ROWTYPE;
  v_service services%ROWTYPE;
  v_partner service_partners%ROWTYPE;
  v_task_id UUID;
  v_payout NUMERIC(12,2);
  v_required_skills TEXT[];
BEGIN
  SELECT * INTO v_order FROM service_orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'service order not found: %', p_order_id;
  END IF;
  IF v_order.status NOT IN ('paid', 'pending') THEN
    RETURN jsonb_build_object('skipped', true, 'reason', 'order not assignable', 'status', v_order.status);
  END IF;

  SELECT * INTO v_service FROM services WHERE id = v_order.service_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'service not found for order %', p_order_id;
  END IF;

  IF v_service.metadata ? 'required_skills' AND jsonb_typeof(v_service.metadata->'required_skills') = 'array' THEN
    SELECT ARRAY_AGG(x) INTO v_required_skills
    FROM jsonb_array_elements_text(v_service.metadata->'required_skills') AS x;
  ELSE
    v_required_skills := ARRAY[]::TEXT[];
  END IF;

  SELECT sp.* INTO v_partner
  FROM service_partners sp
  WHERE sp.status = 'active'
    AND sp.level <> 'trainee'
    AND sp.current_tasks < sp.max_tasks
    AND (v_service.pod_id IS NULL OR sp.pod_id = v_service.pod_id)
    AND (
      COALESCE(array_length(v_required_skills, 1), 0) = 0
      OR sp.skills && v_required_skills
    )
  ORDER BY sp.current_tasks ASC, sp.average_rating DESC, sp.completed_tasks DESC
  LIMIT 1;

  IF NOT FOUND THEN
    UPDATE service_orders SET status = 'paid', updated_at = now() WHERE id = p_order_id;
    RETURN jsonb_build_object('assigned', false, 'reason', 'no available partner');
  END IF;

  v_payout := COALESCE((v_service.metadata->>'default_payout')::numeric, 0);

  INSERT INTO service_tasks (order_id, partner_id, pod_id, status, payout_amount, due_date)
  VALUES (p_order_id, v_partner.id, v_partner.pod_id, 'assigned', v_payout, v_order.due_date)
  RETURNING id INTO v_task_id;

  UPDATE service_partners
  SET current_tasks = current_tasks + 1, updated_at = now()
  WHERE id = v_partner.id;

  UPDATE service_orders
  SET status = 'assigned', updated_at = now()
  WHERE id = p_order_id;

  INSERT INTO rinpo_audit_log (organization_id, actor_type, actor_id, action, resource_type, resource_id, metadata)
  VALUES (
    v_order.organization_id, 'system', 'assign_service_order', 'service.assigned',
    'service_order', p_order_id::text,
    jsonb_build_object('task_id', v_task_id, 'partner_id', v_partner.id, 'partner_name', v_partner.name)
  );

  RETURN jsonb_build_object(
    'assigned', true,
    'task_id', v_task_id,
    'partner_id', v_partner.id,
    'partner_name', v_partner.name,
    'pod_id', v_partner.pod_id
  );
END;
$$;

REVOKE ALL ON FUNCTION assign_service_order(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION assign_service_order(UUID) TO service_role;

-- Staging assignment smoke test (idempotent)
DO $$
DECLARE
  v_result JSONB;
BEGIN
  IF EXISTS (
    SELECT 1 FROM service_orders
    WHERE id = 'c0000001-0000-4000-8000-000000000001'::uuid
      AND status = 'paid'
  ) THEN
    v_result := assign_service_order('c0000001-0000-4000-8000-000000000001'::uuid);
    RAISE NOTICE 'assign_service_order staging test: %', v_result;
  END IF;
END $$;
