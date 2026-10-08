-- Owner order status updates append timeline events through the authenticated Data API.
-- Keep the existing organization-member SELECT policy and allow INSERT only for
-- members who hold the same commerce.order.manage permission required to manage orders.

DROP POLICY IF EXISTS order_events_org_manage_insert ON public.order_events;
CREATE POLICY order_events_org_manage_insert
ON public.order_events
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = order_events.order_id
      AND private.is_org_member(o.organization_id)
      AND private.has_permission(o.organization_id, 'commerce.order.manage'::text)
  )
);
