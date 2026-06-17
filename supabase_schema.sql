-- ============================================================
-- Pet Food App - Supabase Schema
-- הרץ את כל הקובץ הזה ב-Supabase SQL Editor
-- ============================================================

-- Enable RLS
alter database postgres set "app.jwt_secret" to 'your-jwt-secret';

-- -----------------------------------------------
-- טבלת פרופילי משתמשים
-- -----------------------------------------------
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text not null,
  phone text,
  is_admin boolean default false,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Admin can view all profiles" on public.profiles
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Admin can update all profiles" on public.profiles
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- -----------------------------------------------
-- טבלת מוצרים
-- -----------------------------------------------
create table public.products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  price numeric(10,2) not null,
  unit text default 'יח׳',
  stock integer default 0,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.products enable row level security;

create policy "Anyone logged in can view active products" on public.products
  for select using (auth.uid() is not null and active = true);

create policy "Admin can do everything with products" on public.products
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- -----------------------------------------------
-- טבלת הזמנות
-- -----------------------------------------------
create table public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('order', 'manual', 'opening_balance')),
  -- order = הזמנה רגילה
  -- manual = הזמנה ידנית (מנהלת מזינה עבור חבר)
  -- opening_balance = יתרת פתיחה (ללא פירוט מוצרים)
  status text default 'pending' check (status in ('pending', 'paid', 'partial')),
  total numeric(10,2) not null default 0,
  note text,  -- לתיאור יתרת פתיחה
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.orders enable row level security;

create policy "Users can view own orders" on public.orders
  for select using (auth.uid() = user_id);

create policy "Admin can view all orders" on public.orders
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "Users can insert own orders" on public.orders
  for insert with check (auth.uid() = user_id);

create policy "Admin can insert any order" on public.orders
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "Admin can update any order" on public.orders
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- -----------------------------------------------
-- טבלת פריטי הזמנה
-- -----------------------------------------------
create table public.order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id),
  product_name text not null,  -- שמירת שם בזמן ההזמנה
  product_price numeric(10,2) not null,
  quantity integer not null default 1,
  subtotal numeric(10,2) not null,
  created_at timestamptz default now()
);

alter table public.order_items enable row level security;

create policy "Users can view own order items" on public.order_items
  for select using (
    exists (select 1 from public.orders where id = order_id and user_id = auth.uid())
  );

create policy "Admin can view all order items" on public.order_items
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "Users can insert own order items" on public.order_items
  for insert with check (
    exists (select 1 from public.orders where id = order_id and user_id = auth.uid())
  );

create policy "Admin can insert any order items" on public.order_items
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- -----------------------------------------------
-- טבלת תשלומים
-- -----------------------------------------------
create table public.payments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount numeric(10,2) not null,
  note text,
  created_at timestamptz default now()
);

alter table public.payments enable row level security;

create policy "Users can view own payments" on public.payments
  for select using (auth.uid() = user_id);

create policy "Admin can view all payments" on public.payments
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "Admin can insert payments" on public.payments
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- -----------------------------------------------
-- View: יתרת חוב לכל משתמש
-- -----------------------------------------------
create or replace view public.user_balances as
select
  p.id,
  p.full_name,
  p.phone,
  coalesce(sum(o.total), 0) as total_charged,
  coalesce(pay.total_paid, 0) as total_paid,
  coalesce(sum(o.total), 0) - coalesce(pay.total_paid, 0) as balance
from public.profiles p
left join public.orders o on o.user_id = p.id
left join (
  select user_id, sum(amount) as total_paid
  from public.payments
  group by user_id
) pay on pay.user_id = p.id
where p.is_admin = false
group by p.id, p.full_name, p.phone, pay.total_paid;

-- -----------------------------------------------
-- Function: יצירת פרופיל אוטומטי בהרשמה
-- -----------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- -----------------------------------------------
-- מוצרי ברירת מחדל לדוגמה (מחקי אם לא צריך)
-- -----------------------------------------------
insert into public.products (name, price, unit, stock) values
  ('רויאל קנין חתולים בוגרים 10 ק"ג', 142, 'שק', 20),
  ('פרינס גורים 2 ק"ג', 68, 'שק', 15),
  ('ספידי לחתולים 20 ק"ג', 185, 'שק', 10),
  ('פיליקס נשנושים 60 גרם', 12, 'אריזה', 50);
