-- Porte · Esquema inicial (fase 1: clóset digital + reventa; tienda y membresía "muy pronto")

-- ===== Invitaciones =====
create table public.invites (
  code text primary key,
  max_uses int not null default 1 check (max_uses > 0),
  uses int not null default 0,
  note text,
  created_at timestamptz not null default now()
);
alter table public.invites enable row level security;

-- ===== Perfiles =====
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  zone text,
  size_top text,
  size_bottom text,
  shoe_size text,
  invite_code text references public.invites(code),
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- Alta solo con invitación válida: se valida en el servidor al crear el usuario
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_code text := upper(trim(coalesce(new.raw_user_meta_data->>'invite_code', '')));
  v_inv public.invites;
begin
  select * into v_inv from public.invites where code = v_code for update;
  if v_inv.code is null or v_inv.uses >= v_inv.max_uses then
    raise exception 'Código de invitación inválido o agotado';
  end if;
  update public.invites set uses = uses + 1 where code = v_code;
  insert into public.profiles (id, full_name, invite_code)
  values (new.id, new.raw_user_meta_data->>'full_name', v_code);
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.check_invite(p_code text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.invites where code = upper(trim(p_code)) and uses < max_uses);
$$;
grant execute on function public.check_invite(text) to anon, authenticated;

create policy "perfil propio: leer" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "perfil propio: editar" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
-- El usuario no puede otorgarse permisos de administrador
revoke update on public.profiles from authenticated, anon;
grant update (full_name, phone, zone, size_top, size_bottom, shoe_size) on public.profiles to authenticated;
create policy "admin: invitaciones" on public.invites for all using (public.is_admin()) with check (public.is_admin());

-- ===== Clóset =====
create table public.garments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  name text not null,
  category text not null check (category in ('arriba','encima','abajo','vestido','calzado','accesorio')),
  color text,
  brand text,
  size text,
  audience text not null default 'unisex' check (audience in ('mujer','hombre','unisex')),
  occasions text[] not null default '{}',
  warmth text not null default 'media' check (warmth in ('ligera','media','abrigadora')),
  photo_path text,
  wear_count int not null default 0,
  last_worn_at timestamptz,
  status text not null default 'activa' check (status in ('activa','en_venta','vendida','archivada')),
  created_at timestamptz not null default now()
);
create index garments_owner_idx on public.garments(owner_id, status);
alter table public.garments enable row level security;
create policy "clóset propio" on public.garments for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create table public.outfit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  garment_ids uuid[] not null,
  action text not null check (action in ('puesto','me_gusta','no_me_gusta')),
  occasion text,
  temp_c numeric,
  created_at timestamptz not null default now()
);
create index outfit_logs_user_idx on public.outfit_logs(user_id, created_at desc);
alter table public.outfit_logs enable row level security;
create policy "outfits propios" on public.outfit_logs for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Registrar uso de un outfit (actualiza contador y fecha de uso)
create or replace function public.wear_outfit(p_garment_ids uuid[], p_occasion text, p_temp numeric)
returns void language plpgsql security invoker set search_path = public as $$
begin
  update public.garments set wear_count = wear_count + 1, last_worn_at = now()
   where id = any(p_garment_ids) and owner_id = auth.uid();
  insert into public.outfit_logs (garment_ids, action, occasion, temp_c) values (p_garment_ids, 'puesto', p_occasion, p_temp);
end;
$$;

-- ===== Reventa =====
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  garment_id uuid references public.garments(id) on delete set null,
  seller_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  category text not null,
  audience text not null default 'unisex',
  size text,
  brand text,
  color text,
  condition text not null check (condition in ('nuevo_etiqueta','como_nuevo','buen_estado')),
  defects text,
  price numeric(10,2) not null check (price > 0),
  suggested_min numeric(10,2),
  suggested_max numeric(10,2),
  photo_paths text[] not null default '{}',
  status text not null default 'publicada' check (status in ('publicada','apartada','vendida','cancelada')),
  created_at timestamptz not null default now()
);
create index listings_status_idx on public.listings(status, created_at desc);
alter table public.listings enable row level security;
create policy "ver publicaciones" on public.listings for select to authenticated
  using (status in ('publicada','apartada','vendida') or seller_id = auth.uid() or public.is_admin());
create policy "publicar propias" on public.listings for insert to authenticated
  with check (seller_id = auth.uid() and status = 'publicada'
    and (garment_id is null or exists (select 1 from public.garments g where g.id = garment_id and g.owner_id = auth.uid())));
create policy "editar propias sin apartar" on public.listings for update to authenticated
  using (seller_id = auth.uid() and status = 'publicada')
  with check (seller_id = auth.uid() and status in ('publicada','cancelada'));
create policy "admin publicaciones" on public.listings for update to authenticated using (public.is_admin()) with check (public.is_admin());

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  folio bigint generated always as identity,
  listing_id uuid not null references public.listings(id),
  buyer_id uuid not null references public.profiles(id),
  seller_id uuid not null references public.profiles(id),
  price numeric(10,2) not null,
  status text not null default 'apartado' check (status in ('apartado','recoleccion_programada','recogido','en_camino','entregado','conforme','incidencia','cancelado')),
  pickup_window text,
  delivery_window text,
  buyer_address text,
  buyer_phone text,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index orders_one_active_per_listing on public.orders(listing_id) where status <> 'cancelado';
alter table public.orders enable row level security;
create policy "ver pedidos propios" on public.orders for select to authenticated
  using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin());
create policy "admin pedidos" on public.orders for update to authenticated using (public.is_admin()) with check (public.is_admin());

create table public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  note text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
alter table public.order_events enable row level security;
create policy "ver eventos propios" on public.order_events for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and (o.buyer_id = auth.uid() or o.seller_id = auth.uid() or public.is_admin())));

-- Apartar una prenda: bloquea la publicación para evitar doble venta (sin cobro hasta conectar pasarela)
create or replace function public.reserve_listing(p_listing uuid, p_address text, p_phone text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_l public.listings;
  v_order uuid;
begin
  if auth.uid() is null then raise exception 'Inicia sesión'; end if;
  select * into v_l from public.listings where id = p_listing for update;
  if v_l.id is null or v_l.status <> 'publicada' then raise exception 'Esta prenda ya no está disponible'; end if;
  if v_l.seller_id = auth.uid() then raise exception 'No puedes apartar tu propia prenda'; end if;
  update public.listings set status = 'apartada' where id = p_listing;
  insert into public.orders (listing_id, buyer_id, seller_id, price, buyer_address, buyer_phone)
  values (p_listing, auth.uid(), v_l.seller_id, v_l.price, p_address, p_phone)
  returning id into v_order;
  insert into public.order_events (order_id, status, note) values (v_order, 'apartado', 'Prenda apartada por el comprador');
  return v_order;
end;
$$;
grant execute on function public.reserve_listing(uuid, text, text) to authenticated;

-- Avance de estado por operación (admin): mantiene publicación, clóset y bitácora sincronizados
create or replace function public.advance_order(p_order uuid, p_status text, p_note text default null, p_window text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_o public.orders;
begin
  if not public.is_admin() then raise exception 'Solo operación'; end if;
  select * into v_o from public.orders where id = p_order for update;
  update public.orders set status = p_status, updated_at = now(),
    pickup_window = case when p_status = 'recoleccion_programada' then coalesce(p_window, pickup_window) else pickup_window end,
    delivery_window = case when p_status = 'en_camino' then coalesce(p_window, delivery_window) else delivery_window end,
    delivered_at = case when p_status = 'entregado' then now() else delivered_at end
  where id = p_order;
  if p_status = 'cancelado' then
    update public.listings set status = 'publicada' where id = v_o.listing_id;
  elsif p_status = 'conforme' then
    update public.listings set status = 'vendida' where id = v_o.listing_id;
    update public.garments set status = 'vendida' where id = (select garment_id from public.listings where id = v_o.listing_id);
  end if;
  insert into public.order_events (order_id, status, note) values (p_order, p_status, p_note);
end;
$$;
grant execute on function public.advance_order(uuid, text, text, text) to authenticated;

-- El comprador confirma conformidad dentro de las 48 horas
create or replace function public.confirm_order(p_order uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_o public.orders;
begin
  select * into v_o from public.orders where id = p_order for update;
  if v_o.buyer_id <> auth.uid() or v_o.status <> 'entregado' then raise exception 'No disponible'; end if;
  update public.orders set status = 'conforme', updated_at = now() where id = p_order;
  update public.listings set status = 'vendida' where id = v_o.listing_id;
  update public.garments set status = 'vendida' where id = (select garment_id from public.listings where id = v_o.listing_id);
  insert into public.order_events (order_id, status, note) values (p_order, 'conforme', 'El comprador confirmó que todo está bien');
end;
$$;
grant execute on function public.confirm_order(uuid) to authenticated;

-- ===== Muy pronto: lista de espera y quiz =====
create table public.waitlist (
  user_id uuid primary key default auth.uid() references public.profiles(id) on delete cascade,
  interests text[] not null default '{}',
  quiz jsonb not null default '{}',
  created_at timestamptz not null default now()
);
alter table public.waitlist enable row level security;
create policy "lista propia" on public.waitlist for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "admin lista" on public.waitlist for select using (public.is_admin());

-- ===== Fotos =====
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 5242880, array['image/jpeg','image/png','image/webp']);

create policy "fotos: subir en carpeta propia" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "fotos: borrar propias" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "fotos: ver propias o publicadas" on storage.objects for select to authenticated
  using (bucket_id = 'photos' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin()
    or exists (select 1 from public.listings l where l.status in ('publicada','apartada','vendida') and name = any(l.photo_paths))
  ));
