-- Lance ce fichier apres schema.sql si ta base existait deja.
-- Il revient au modele simple avec un seul compte admin.

alter table public.admin_users drop constraint if exists admin_users_role_check;
alter table public.admin_users
  alter column role set default 'admin';

update public.admin_users
set role = 'admin'
where role is distinct from 'admin';

delete from public.admin_users
where email in ('gerant@restaurant.com', 'boss@restaurant.com');

alter table public.admin_users
  add constraint admin_users_role_check check (role = 'admin');

insert into public.admin_users (email, password_hash, role)
values
  ('admin@restaurant.com', extensions.crypt('admin123', extensions.gen_salt('bf')), 'admin')
on conflict (email) do update
set password_hash = excluded.password_hash,
    role = excluded.role;

alter table public.clients
  add column if not exists client_code text,
  add column if not exists workplace text,
  add column if not exists notes text;

update public.clients
set client_code = 'CL-' || upper(substr(id::text, 1, 6))
where client_code is null;

alter table public.clients
  alter column client_code set default ('CL-' || upper(substr(gen_random_uuid()::text, 1, 6))),
  alter column client_code set not null;

create unique index if not exists idx_clients_client_code on public.clients(client_code);
create index if not exists idx_clients_phone on public.clients(phone);
create index if not exists idx_clients_workplace on public.clients(workplace);

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

create or replace function public.require_admin_role(input_token text, allowed_roles text[] default array['admin'])
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.require_admin_session(input_token);
  return 'admin';
end;
$$;

grant execute on function public.require_admin_role(text, text[]) to anon, authenticated;
