-- 001: Drop old tables and recreate categories + products with new schema

DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.kds_tickets CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;

-- Categories table
CREATE TABLE public.categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  manager_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz DEFAULT NULL
);

CREATE UNIQUE INDEX categories_manager_name_unique
  ON public.categories (manager_id, name)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_categories_manager_id ON public.categories (manager_id);
CREATE INDEX idx_categories_deleted_at ON public.categories (deleted_at);

-- Products table
CREATE TABLE public.products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  manager_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  name text NOT NULL,
  price numeric(10, 2) NOT NULL CHECK (price >= 0),
  tax text NOT NULL,
  unit_of_measure text NOT NULL DEFAULT 'piece',
  description text,
  image_url text NOT NULL,
  is_available boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz DEFAULT NULL
);

CREATE INDEX idx_products_manager_id ON public.products (manager_id);
CREATE INDEX idx_products_category_id ON public.products (category_id);
CREATE INDEX idx_products_deleted_at ON public.products (deleted_at);
CREATE INDEX idx_products_is_available ON public.products (is_available);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
