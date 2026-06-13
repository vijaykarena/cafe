-- 002: Row Level Security policies for categories and products

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Manager: full access to own non-deleted categories
CREATE POLICY "manager_categories_all" ON public.categories
  FOR ALL
  USING (
    manager_id = auth.uid()
    AND deleted_at IS NULL
  )
  WITH CHECK (
    manager_id = auth.uid()
  );

-- Cashier/Waiter: read-only access to their manager's non-deleted categories
CREATE POLICY "staff_categories_select" ON public.categories
  FOR SELECT
  USING (
    deleted_at IS NULL
    AND manager_id = (
      SELECT p.manager_id FROM public.profiles p WHERE p.id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('cashier', 'waiter')
    )
  );

-- Manager: full access to own non-deleted products
CREATE POLICY "manager_products_all" ON public.products
  FOR ALL
  USING (
    manager_id = auth.uid()
    AND deleted_at IS NULL
  )
  WITH CHECK (
    manager_id = auth.uid()
  );

-- Cashier/Waiter: read-only access to available products of their manager
CREATE POLICY "staff_products_select" ON public.products
  FOR SELECT
  USING (
    deleted_at IS NULL
    AND is_available = true
    AND manager_id = (
      SELECT p.manager_id FROM public.profiles p WHERE p.id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('cashier', 'waiter')
    )
  );
