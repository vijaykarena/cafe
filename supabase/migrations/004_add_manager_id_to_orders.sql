-- 004: Add manager_id to orders table

ALTER TABLE public.orders ADD COLUMN manager_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

-- If existing orders exist, this will add the column with nulls. You may want to manually clean them up.
-- If the table is fresh, making it NOT NULL is safer, but we leave it nullable to avoid breaking existing data.

CREATE INDEX idx_orders_manager_id ON public.orders(manager_id);

-- Enable RLS for orders if not already
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Manager: full access to own orders
CREATE POLICY "manager_orders_all" ON public.orders
  FOR ALL
  USING (manager_id = auth.uid())
  WITH CHECK (manager_id = auth.uid());

-- Staff: read-only access to their manager's orders
CREATE POLICY "staff_orders_select" ON public.orders
  FOR SELECT
  USING (
    manager_id = (
      SELECT p.manager_id FROM public.profiles p WHERE p.id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('cashier', 'waiter')
    )
  );

-- Also add policies for order_items if they don't exist
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "manager_order_items_all" ON public.order_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
      AND o.manager_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
      AND o.manager_id = auth.uid()
    )
  );

CREATE POLICY "staff_order_items_select" ON public.order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
      AND o.manager_id = (
        SELECT p.manager_id FROM public.profiles p WHERE p.id = auth.uid()
      )
    )
  );

-- And for kds_tickets
ALTER TABLE public.kds_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "manager_kds_tickets_all" ON public.kds_tickets
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = kds_tickets.order_id
      AND o.manager_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = kds_tickets.order_id
      AND o.manager_id = auth.uid()
    )
  );

CREATE POLICY "staff_kds_tickets_all" ON public.kds_tickets
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = kds_tickets.order_id
      AND o.manager_id = (
        SELECT p.manager_id FROM public.profiles p WHERE p.id = auth.uid()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = kds_tickets.order_id
      AND o.manager_id = (
        SELECT p.manager_id FROM public.profiles p WHERE p.id = auth.uid()
      )
    )
  );
