-- Premium Délice - RPC admin utilisées par l'application.
-- À exécuter après supabase/schema.sql.

create extension if not exists pgcrypto;

create or replace function public.admin_list_clients(input_token text)
returns table (
  id uuid,
  name text,
  phone text,
  client_code text,
  workplace text,
  notes text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.require_admin_session(input_token);

  return query
  select c.id, c.name, c.phone, c.client_code, c.workplace, c.notes, c.created_at
  from public.clients c
  order by c.name asc;
end;
$$;

create or replace function public.admin_list_client_accounts(input_token text)
returns table (
  client_id uuid,
  name text,
  phone text,
  client_code text,
  workplace text,
  orders_count bigint,
  total_commandes numeric,
  total_paye numeric,
  dette_totale numeric,
  total_remboursements numeric
)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.require_admin_session(input_token);

  return query
  select
    s.client_id,
    s.name,
    s.phone,
    s.client_code,
    s.workplace,
    s.orders_count,
    s.total_commandes,
    s.total_paye,
    s.dette_totale,
    s.total_remboursements
  from public.client_financial_summary s
  order by s.dette_totale desc, s.name asc;
end;
$$;

create or replace function public.admin_create_client(
  input_token text,
  input_name text,
  input_phone text default null,
  input_workplace text default null,
  input_notes text default null
)
returns table (
  id uuid,
  name text,
  phone text,
  client_code text,
  workplace text,
  notes text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.require_admin_session(input_token);

  return query
  insert into public.clients (name, phone, workplace, notes)
  values (
    trim(input_name),
    nullif(trim(coalesce(input_phone, '')), ''),
    nullif(trim(coalesce(input_workplace, '')), ''),
    nullif(trim(coalesce(input_notes, '')), '')
  )
  returning clients.id, clients.name, clients.phone, clients.client_code,
    clients.workplace, clients.notes, clients.created_at;
end;
$$;

create or replace function public.admin_list_client_payments(
  input_token text,
  input_client_id uuid
)
returns table (
  id uuid,
  client_id uuid,
  amount numeric,
  payment_method text,
  payment_source text,
  notes text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.require_admin_session(input_token);

  return query
  select
    cp.id,
    cp.client_id,
    cp.amount,
    cp.payment_method,
    cp.payment_source,
    cp.notes,
    cp.created_at
  from public.client_payments cp
  where cp.client_id = input_client_id
    and cp.payment_source = 'debt_repayment'
  order by cp.created_at desc;
end;
$$;

create or replace function public.admin_record_client_payment(
  input_token text,
  input_client_id uuid,
  input_amount numeric,
  input_notes text default null
)
returns table (
  id uuid,
  client_id uuid,
  amount numeric,
  payment_method text,
  payment_source text,
  notes text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  client_debt numeric(12,2);
  remaining_to_apply numeric(12,2);
  applied_amount numeric(12,2);
  debt_order record;
  new_payment public.client_payments;
begin
  perform public.require_admin_session(input_token);

  if input_amount <= 0 then
    raise exception 'Le montant du paiement est invalide';
  end if;

  select coalesce(sum(o.remaining_amount), 0)
  into client_debt
  from public.orders o
  where o.client_id = input_client_id;

  if client_debt <= 0 then
    raise exception 'Ce client n''a pas de dette';
  end if;

  if input_amount > client_debt then
    raise exception 'Le paiement ne peut pas depasser la dette restante';
  end if;

  insert into public.client_payments (
    client_id,
    amount,
    payment_method,
    payment_source,
    notes
  )
  values (
    input_client_id,
    input_amount,
    'cash',
    'debt_repayment',
    nullif(trim(coalesce(input_notes, '')), '')
  )
  returning * into new_payment;

  remaining_to_apply := input_amount;

  for debt_order in
    select o.id, o.remaining_amount
    from public.orders o
    where o.client_id = input_client_id
      and o.remaining_amount > 0
    order by o.created_at asc
  loop
    exit when remaining_to_apply <= 0;

    applied_amount := least(remaining_to_apply, debt_order.remaining_amount);

    update public.orders
    set paid_amount = paid_amount + applied_amount
    where orders.id = debt_order.id;

    remaining_to_apply := remaining_to_apply - applied_amount;
  end loop;

  return query
  select
    new_payment.id,
    new_payment.client_id,
    new_payment.amount,
    new_payment.payment_method,
    new_payment.payment_source,
    new_payment.notes,
    new_payment.created_at;
end;
$$;

create or replace function public.admin_list_products(input_token text)
returns table (
  id uuid,
  name text,
  price numeric,
  category text,
  image_url text,
  available boolean,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.require_admin_session(input_token);

  return query
  select p.id, p.name, p.price, p.category, p.image_url, p.available, p.created_at
  from public.products p
  order by p.created_at desc;
end;
$$;

create or replace function public.admin_list_products_by_ids(
  input_token text,
  input_product_ids uuid[]
)
returns table (
  id uuid,
  name text,
  price numeric,
  category text,
  image_url text,
  available boolean,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.require_admin_session(input_token);

  return query
  select p.id, p.name, p.price, p.category, p.image_url, p.available, p.created_at
  from public.products p
  where p.id = any(input_product_ids);
end;
$$;

create or replace function public.admin_create_product(
  input_token text,
  input_name text,
  input_price numeric,
  input_category text,
  input_image_url text,
  input_available boolean
)
returns table (
  id uuid,
  name text,
  price numeric,
  category text,
  image_url text,
  available boolean,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.require_admin_session(input_token);

  return query
  insert into public.products (name, price, category, image_url, available)
  values (
    trim(input_name),
    input_price,
    trim(input_category),
    nullif(trim(coalesce(input_image_url, '')), ''),
    coalesce(input_available, true)
  )
  returning products.id, products.name, products.price, products.category,
    products.image_url, products.available, products.created_at;
end;
$$;

create or replace function public.admin_update_product(
  input_token text,
  input_product_id uuid,
  input_name text,
  input_price numeric,
  input_category text,
  input_image_url text,
  input_available boolean
)
returns table (
  id uuid,
  name text,
  price numeric,
  category text,
  image_url text,
  available boolean,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.require_admin_session(input_token);

  return query
  update public.products
  set
    name = trim(input_name),
    price = input_price,
    category = trim(input_category),
    image_url = nullif(trim(coalesce(input_image_url, '')), ''),
    available = coalesce(input_available, true)
  where products.id = input_product_id
  returning products.id, products.name, products.price, products.category,
    products.image_url, products.available, products.created_at;
end;
$$;

create or replace function public.admin_delete_product(
  input_token text,
  input_product_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.require_admin_session(input_token);
  delete from public.products where id = input_product_id;
end;
$$;

create or replace function public.admin_list_pending_orders(input_token text)
returns table (
  id uuid,
  items jsonb,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.require_admin_session(input_token);

  return query
  select po.id, po.items, po.created_at
  from public.pending_orders po
  order by po.created_at desc;
end;
$$;

create or replace function public.admin_cancel_pending_order(
  input_token text,
  input_pending_order_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.require_admin_session(input_token);

  delete from public.pending_orders
  where id = input_pending_order_id;

  if not found then
    raise exception 'Commande en attente introuvable';
  end if;
end;
$$;

create or replace function public.admin_list_orders(input_token text)
returns table (
  id uuid,
  client_id uuid,
  client_name text,
  client_phone text,
  total_amount numeric,
  paid_amount numeric,
  remaining_amount numeric,
  payment_type text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.require_admin_session(input_token);

  return query
  select
    o.id,
    o.client_id,
    c.name as client_name,
    c.phone as client_phone,
    o.total_amount,
    o.paid_amount,
    o.remaining_amount,
    o.payment_type,
    o.created_at
  from public.orders o
  join public.clients c on c.id = o.client_id
  order by o.created_at desc;
end;
$$;

create or replace function public.admin_list_order_items(
  input_token text,
  input_order_ids uuid[]
)
returns table (
  id uuid,
  order_id uuid,
  product_id uuid,
  product_name text,
  unit_price numeric,
  quantity integer,
  total_price numeric,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.require_admin_session(input_token);

  return query
  select
    oi.id,
    oi.order_id,
    oi.product_id,
    oi.product_name,
    oi.unit_price,
    oi.quantity,
    oi.total_price,
    oi.created_at
  from public.order_items oi
  where oi.order_id = any(input_order_ids)
  order by oi.created_at asc;
end;
$$;

grant execute on function public.admin_list_clients(text) to anon, authenticated;
grant execute on function public.admin_list_client_accounts(text) to anon, authenticated;
grant execute on function public.admin_create_client(text, text, text, text, text) to anon, authenticated;
grant execute on function public.admin_list_client_payments(text, uuid) to anon, authenticated;
grant execute on function public.admin_record_client_payment(text, uuid, numeric, text) to anon, authenticated;
grant execute on function public.admin_list_products(text) to anon, authenticated;
grant execute on function public.admin_list_products_by_ids(text, uuid[]) to anon, authenticated;
grant execute on function public.admin_create_product(text, text, numeric, text, text, boolean) to anon, authenticated;
grant execute on function public.admin_update_product(text, uuid, text, numeric, text, text, boolean) to anon, authenticated;
grant execute on function public.admin_delete_product(text, uuid) to anon, authenticated;
grant execute on function public.admin_list_pending_orders(text) to anon, authenticated;
grant execute on function public.admin_cancel_pending_order(text, uuid) to anon, authenticated;
grant execute on function public.admin_list_orders(text) to anon, authenticated;
grant execute on function public.admin_list_order_items(text, uuid[]) to anon, authenticated;
