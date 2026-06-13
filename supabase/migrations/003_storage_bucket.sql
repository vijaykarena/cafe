-- 003: Supabase storage bucket for product images

INSERT INTO storage.buckets (id, name, public)
VALUES ('product', 'product', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "product_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product');

CREATE POLICY "product_images_manager_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

CREATE POLICY "product_images_manager_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'product'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

CREATE POLICY "product_images_manager_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );
