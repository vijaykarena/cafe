-- Cafe POS Database Schema
-- Run this in your Supabase SQL Editor

-- 1. Create Profiles Table (syncs with auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  manager_id uuid references public.profiles(id) on delete set null,
  name text not null,
  email text not null unique,
  role text not null check (role in ('admin', 'manager', 'cashier', 'cook', 'waiter')),
  is_archived boolean default false,
  is_banned boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- 2. Create Categories Table
create table public.categories (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  color text not null, -- Tailwind color class or hex (e.g. 'bg-red-500', '#EF4444')
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.categories enable row level security;

-- 3. Create Products Table
create table public.products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  category_id uuid references public.categories(id) on delete set null,
  price numeric(10, 2) not null check (price >= 0),
  unit_of_measure text not null default 'piece', -- e.g. per piece, kg, litre
  tax numeric(5, 2) not null default 0.00, -- e.g. 5.00 for 5% tax
  description text,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.products enable row level security;

-- 4. Create Floors Table
create table public.floors (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.floors enable row level security;

-- 5. Create Tables Table
create table public.tables (
  id uuid default gen_random_uuid() primary key,
  floor_id uuid references public.floors(id) on delete cascade not null,
  table_number text not null,
  seats integer not null default 2,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (floor_id, table_number)
);

alter table public.tables enable row level security;

-- 6. Create Sessions Table
create table public.sessions (
  id uuid default gen_random_uuid() primary key,
  opened_by uuid references public.profiles(id) not null,
  opened_at timestamp with time zone default timezone('utc'::text, now()) not null,
  closed_at timestamp with time zone,
  opening_balance numeric(10, 2) not null,
  closing_balance numeric(10, 2),
  status text not null check (status in ('open', 'closed')) default 'open'
);

alter table public.sessions enable row level security;

-- 7. Create Customers Table
create table public.customers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text,
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.customers enable row level security;

-- 8. Create Orders Table
create table public.orders (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.sessions(id) on delete cascade not null,
  table_id uuid references public.tables(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  order_number text not null unique, -- generated sequentially or by timestamp
  subtotal numeric(10, 2) not null default 0.00,
  tax numeric(10, 2) not null default 0.00,
  discount_amount numeric(10, 2) not null default 0.00,
  total numeric(10, 2) not null default 0.00,
  status text not null check (status in ('draft', 'paid', 'cancelled')) default 'draft',
  payment_method text check (payment_method in ('cash', 'card', 'upi')),
  payment_reference text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.orders enable row level security;

-- 9. Create Order Items Table
create table public.order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10, 2) not null,
  tax_rate numeric(5, 2) not null,
  total_price numeric(10, 2) not null,
  is_completed_in_kitchen boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.order_items enable row level security;

-- 10. Create KDS Tickets Table
create table public.kds_tickets (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  status text not null check (status in ('to_cook', 'preparing', 'completed')) default 'to_cook',
  assigned_to uuid references public.profiles(id) on delete set null, -- cook who picked up the ticket
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.kds_tickets enable row level security;

-- 11. Create Coupons Table
create table public.coupons (
  id uuid default gen_random_uuid() primary key,
  code text not null unique,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  value numeric(10, 2) not null,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.coupons enable row level security;

-- 12. Create Promotions Table
create table public.promotions (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text not null check (type in ('product', 'order')),
  trigger_product_id uuid references public.products(id) on delete cascade,
  min_quantity integer,
  min_order_amount numeric(10, 2),
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  value numeric(10, 2) not null,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.promotions enable row level security;

-- 13. Create Payment Methods Table
create table public.payment_methods (
  id uuid default gen_random_uuid() primary key,
  name text not null unique check (name in ('cash', 'card', 'upi')),
  is_enabled boolean default true,
  upi_id text, -- e.g. cafe@ybl (needed only for UPI QR generation)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.payment_methods enable row level security;


-- ==================== TRIGGERS & FUNCTIONS ====================

-- Trigger to automatically create a profile for new auth.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, manager_id, name, email, role)
  values (
    new.id,
    (new.raw_user_meta_data->>'manager_id')::uuid,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'cashier')
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ==================== RLS POLICIES ====================
-- For simplicity, since the client is client-side, we allow read/write for authenticated users.
-- Real production RLS rules should be fine-tuned.

create policy "Allow read access to all profiles" on public.profiles for select using (true);
create policy "Allow update access to own profile" on public.profiles for update using (auth.uid() = id);
create policy "Allow insert access to admin profiles" on public.profiles for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Allow update access to admin profiles" on public.profiles for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Allow delete access to admin profiles" on public.profiles for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Repeat default permissive policies for other tables
create policy "Allow read access to categories" on public.categories for select using (true);
create policy "Allow write access to categories for admin" on public.categories for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy "Allow read access to products" on public.products for select using (true);
create policy "Allow write access to products for admin" on public.products for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy "Allow read access to floors" on public.floors for select using (true);
create policy "Allow write access to floors for admin" on public.floors for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy "Allow read access to tables" on public.tables for select using (true);
create policy "Allow write access to tables for admin" on public.tables for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy "Allow all access to sessions" on public.sessions for all using (auth.role() = 'authenticated');
create policy "Allow all access to customers" on public.customers for all using (auth.role() = 'authenticated');
create policy "Allow all access to orders" on public.orders for all using (auth.role() = 'authenticated');
create policy "Allow all access to order_items" on public.order_items for all using (auth.role() = 'authenticated');
create policy "Allow all access to kds_tickets" on public.kds_tickets for all using (auth.role() = 'authenticated');
create policy "Allow all access to coupons" on public.coupons for all using (auth.role() = 'authenticated');
create policy "Allow all access to promotions" on public.promotions for all using (auth.role() = 'authenticated');
create policy "Allow all access to payment_methods" on public.payment_methods for all using (auth.role() = 'authenticated');



