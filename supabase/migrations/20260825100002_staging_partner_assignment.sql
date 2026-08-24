-- Align staging partner with web pod for business-website assignment test
UPDATE service_partners sp
SET pod_id = p.id, skills = ARRAY['social', 'content', 'web', 'ads', 'frontend']
FROM service_pods p
WHERE sp.id = 'a0000001-0000-4000-8000-000000000001'::uuid
  AND p.key = 'web';

-- Re-run staging assignment if still paid
DO $$
DECLARE
  v_result JSONB;
BEGIN
  IF EXISTS (
    SELECT 1 FROM service_orders
    WHERE id = 'c0000001-0000-4000-8000-000000000001'::uuid
      AND status IN ('paid', 'assigned')
  ) THEN
    UPDATE service_orders SET status = 'paid'
    WHERE id = 'c0000001-0000-4000-8000-000000000001'::uuid AND status = 'assigned';
    v_result := assign_service_order('c0000001-0000-4000-8000-000000000001'::uuid);
    RAISE NOTICE 'staging assign retry: %', v_result;
  END IF;
END $$;
