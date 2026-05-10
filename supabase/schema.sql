-- Premium Délice - schema complet pour recréer une base propre.
-- À exécuter en premier dans le SQL editor Supabase.

create extension if not exists pgcrypto;

drop view if exists public.global_financial_summary cascade;
drop view if exists public.daily_financial_summary cascade;
drop view if exists public.client_financial_summary cascade;

drop function if exists public.admin_validate_pending_order(text, uuid, uuid, text, numeric) cascade;
drop function if exists public.require_admin_role(text, text[]) cascade;
drop function if exists public.require_admin_session(text) cascade;
drop function if exists public.admin_login(text, text) cascade;

drop table if exists public.client_payments cascade;
drop table if exists public.order_items cascade;
drop table if exists public.orders cascade;
drop table if exists public.pending_orders cascade;
drop table if exists public.products cascade;
drop table if exists public.clients cascade;
drop table if exists public.admin_sessions cascade;
drop table if exists public.admin_users cascade;

create table public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  role text not null default 'admin',
  created_at timestamptz not null default now(),

  constraint admin_users_email_not_empty check (length(trim(email)) > 0),
  constraint admin_users_role_check check (role = 'admin')
);

create table public.admin_sessions (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references public.admin_users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null default now() + interval '12 hours',
  created_at timestamptz not null default now()
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  client_code text not null default ('CL-' || upper(substr(gen_random_uuid()::text, 1, 6))),
  workplace text,
  notes text,
  created_at timestamptz not null default now(),

  constraint clients_name_not_empty check (length(trim(name)) > 0),
  constraint clients_phone_unique unique (phone)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(12,2) not null,
  category text not null,
  image_url text,
  available boolean not null default true,
  created_at timestamptz not null default now(),

  constraint products_name_not_empty check (length(trim(name)) > 0),
  constraint products_price_positive check (price >= 0),
  constraint products_category_valid check (
    category in ('condiments', 'accompagnements', 'legumes', 'petit_dejeuner', 'boissons')
  )
);

create table public.pending_orders (
  id uuid primary key default gen_random_uuid(),
  items jsonb not null,
  created_at timestamptz not null default now(),

  constraint pending_orders_items_array check (jsonb_typeof(items) = 'array'),
  constraint pending_orders_items_not_empty check (jsonb_array_length(items) > 0)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete restrict,
  total_amount numeric(12,2) not null,
  paid_amount numeric(12,2) not null default 0,
  remaining_amount numeric(12,2) generated always as (total_amount - paid_amount) stored,
  payment_type text not null,
  created_at timestamptz not null default now(),

  constraint orders_total_amount_positive check (total_amount >= 0),
  constraint orders_paid_amount_positive check (paid_amount >= 0),
  constraint orders_paid_not_greater_than_total check (paid_amount <= total_amount),
  constraint orders_payment_type_valid check (payment_type in ('cash', 'mobile_money', 'credit'))
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  unit_price numeric(12,2) not null,
  quantity integer not null,
  total_price numeric(12,2) generated always as (unit_price * quantity) stored,
  created_at timestamptz not null default now(),

  constraint order_items_product_name_not_empty check (length(trim(product_name)) > 0),
  constraint order_items_unit_price_positive check (unit_price >= 0),
  constraint order_items_quantity_positive check (quantity > 0)
);

create table public.client_payments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete restrict,
  amount numeric(12,2) not null,
  payment_method text not null default 'cash',
  payment_source text not null default 'debt_repayment',
  notes text,
  created_at timestamptz not null default now(),

  constraint client_payments_amount_positive check (amount > 0),
  constraint client_payments_method_valid check (payment_method in ('cash', 'mobile_money', 'other')),
  constraint client_payments_source_valid check (payment_source in ('order_initial', 'debt_repayment'))
);

create index idx_admin_sessions_token_hash on public.admin_sessions(token_hash);
create index idx_clients_name on public.clients(name);
create unique index idx_clients_client_code on public.clients(client_code);
create index idx_clients_phone on public.clients(phone);
create index idx_clients_workplace on public.clients(workplace);
create index idx_products_available on public.products(available);
create index idx_products_category on public.products(category);
create index idx_pending_orders_created_at on public.pending_orders(created_at desc);
create index idx_orders_client_id on public.orders(client_id);
create index idx_orders_created_at on public.orders(created_at desc);
create index idx_orders_payment_type on public.orders(payment_type);
create index idx_orders_remaining_amount on public.orders(remaining_amount);
create index idx_order_items_order_id on public.order_items(order_id);
create index idx_order_items_product_id on public.order_items(product_id);
create index idx_client_payments_client_id on public.client_payments(client_id);
create index idx_client_payments_created_at on public.client_payments(created_at desc);

create or replace view public.client_financial_summary
with (security_invoker = on) as
select
  c.id as client_id,
  c.name,
  c.phone,
  c.client_code,
  c.workplace,
  count(o.id) as orders_count,
  coalesce(sum(o.total_amount), 0) as total_commandes,
  coalesce(sum(o.paid_amount), 0) as total_paye,
  coalesce(sum(o.remaining_amount), 0) as dette_totale,
  coalesce((
    select sum(cp.amount)
    from public.client_payments cp
    where cp.client_id = c.id
      and cp.payment_source = 'debt_repayment'
  ), 0) as total_remboursements
from public.clients c
left join public.orders o on o.client_id = c.id
group by c.id, c.name, c.phone, c.client_code, c.workplace;

create or replace view public.daily_financial_summary
with (security_invoker = on) as
select
  date(o.created_at) as date,
  count(*) as nombre_commandes,
  count(distinct o.client_id) as nombre_clients,
  coalesce(sum(o.total_amount), 0) as total_jour,
  coalesce(sum(o.paid_amount), 0) as total_paye,
  coalesce(sum(o.remaining_amount), 0) as total_dettes
from public.orders o
group by date(o.created_at)
order by date desc;

create or replace view public.global_financial_summary
with (security_invoker = on) as
select
  count(*) as nombre_commandes,
  count(distinct client_id) as nombre_clients,
  coalesce(sum(total_amount), 0) as total_global,
  coalesce(sum(paid_amount), 0) as total_paye,
  coalesce(sum(remaining_amount), 0) as total_dettes
from public.orders;

create or replace function public.admin_login(input_email text, input_password text)
returns table (
  token text,
  email text,
  role text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  found_admin public.admin_users;
  raw_token text;
begin
  select *
  into found_admin
  from public.admin_users
  where admin_users.email = lower(trim(input_email))
    and admin_users.password_hash = extensions.crypt(input_password, admin_users.password_hash)
    and admin_users.role = 'admin'
  limit 1;

  if found_admin.id is null then
    raise exception 'Email ou mot de passe incorrect';
  end if;

  raw_token := gen_random_uuid()::text || '-' || gen_random_uuid()::text;

  insert into public.admin_sessions (admin_user_id, token_hash)
  values (found_admin.id, encode(extensions.digest(raw_token, 'sha256'), 'hex'));

  return query
  select raw_token, found_admin.email, found_admin.role;
end;
$$;

create or replace function public.require_admin_session(input_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_id uuid;
begin
  select s.admin_user_id
  into admin_id
  from public.admin_sessions s
  join public.admin_users u on u.id = s.admin_user_id
  where s.token_hash = encode(extensions.digest(input_token, 'sha256'), 'hex')
    and s.expires_at > now()
    and u.role = 'admin'
  limit 1;

  if admin_id is null then
    raise exception 'Session admin invalide';
  end if;

  return admin_id;
end;
$$;

create or replace function public.require_admin_role(
  input_token text,
  allowed_roles text[] default array['admin']
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_role text;
begin
  select u.role
  into admin_role
  from public.admin_sessions s
  join public.admin_users u on u.id = s.admin_user_id
  where s.token_hash = encode(extensions.digest(input_token, 'sha256'), 'hex')
    and s.expires_at > now()
    and u.role = any(allowed_roles)
  limit 1;

  if admin_role is null then
    raise exception 'Acces refuse';
  end if;

  return admin_role;
end;
$$;

create or replace function public.admin_validate_pending_order(
  input_token text,
  input_pending_order_id uuid,
  input_client_id uuid,
  input_payment_type text,
  input_paid_amount numeric default 0
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_order_id uuid;
  computed_total numeric(12,2);
  final_paid numeric(12,2);
begin
  perform public.require_admin_session(input_token);

  if input_payment_type not in ('cash', 'mobile_money', 'credit') then
    raise exception 'Type de paiement invalide';
  end if;

  if not exists (select 1 from public.clients c where c.id = input_client_id) then
    raise exception 'Client introuvable';
  end if;

  select coalesce(sum(p.price * ((item.value ->> 'quantity')::integer)), 0)
  into computed_total
  from public.pending_orders po
  cross join jsonb_array_elements(po.items) item
  join public.products p on p.id = ((item.value ->> 'product_id')::uuid)
  where po.id = input_pending_order_id;

  if computed_total <= 0 then
    raise exception 'Panier invalide ou vide';
  end if;

  if input_payment_type in ('cash', 'mobile_money') then
    final_paid := computed_total;
  else
    final_paid := coalesce(input_paid_amount, 0);

    if final_paid < 0 or final_paid >= computed_total then
      raise exception 'Une commande a credit doit garder une dette';
    end if;
  end if;

  insert into public.orders (client_id, total_amount, paid_amount, payment_type)
  values (input_client_id, computed_total, final_paid, input_payment_type)
  returning id into new_order_id;

  insert into public.order_items (order_id, product_id, product_name, unit_price, quantity)
  select
    new_order_id,
    p.id,
    p.name,
    p.price,
    (item.value ->> 'quantity')::integer
  from public.pending_orders po
  cross join jsonb_array_elements(po.items) item
  join public.products p on p.id = ((item.value ->> 'product_id')::uuid)
  where po.id = input_pending_order_id;

  if final_paid > 0 then
    insert into public.client_payments (
      client_id,
      amount,
      payment_method,
      payment_source,
      notes
    )
    values (
      input_client_id,
      final_paid,
      case when input_payment_type = 'mobile_money' then 'mobile_money' else 'cash' end,
      'order_initial',
      'Paiement initial commande ' || upper(substr(new_order_id::text, 1, 8))
    );
  end if;

  delete from public.pending_orders where id = input_pending_order_id;

  return new_order_id;
end;
$$;

alter table public.admin_users enable row level security;
alter table public.admin_sessions enable row level security;
alter table public.clients enable row level security;
alter table public.products enable row level security;
alter table public.pending_orders enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.client_payments enable row level security;

create policy public_read_available_products
on public.products
for select
to anon
using (available = true);

create policy public_insert_pending_orders
on public.pending_orders
for insert
to anon
with check (true);

insert into public.admin_users (email, password_hash, role)
values ('admin@restaurant.com', extensions.crypt('admin123', extensions.gen_salt('bf')), 'admin');

grant usage on schema public to anon, authenticated;
grant select on public.products to anon, authenticated;
grant insert on public.pending_orders to anon, authenticated;
grant execute on function public.admin_login(text, text) to anon, authenticated;
grant execute on function public.require_admin_session(text) to anon, authenticated;
grant execute on function public.require_admin_role(text, text[]) to anon, authenticated;
grant execute on function public.admin_validate_pending_order(text, uuid, uuid, text, numeric) to anon, authenticated;
