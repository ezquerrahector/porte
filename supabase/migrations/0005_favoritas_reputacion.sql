-- Favoritas del Bazar
create table if not exists public.favorites (
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);
alter table public.favorites enable row level security;
create policy "favoritas propias" on public.favorites for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Calificación del comprador al vendedor (una por pedido, solo cuando el pedido quedó conforme)
create table if not exists public.reviews (
  order_id uuid primary key references public.orders(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  buyer_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);
alter table public.reviews enable row level security;
create policy "calificar mis compras" on public.reviews for insert to authenticated
  with check (buyer_id = auth.uid() and exists (
    select 1 from public.orders o where o.id = order_id and o.buyer_id = auth.uid() and o.seller_id = reviews.seller_id and o.status = 'conforme'));
create policy "ver calificaciones propias" on public.reviews for select to authenticated
  using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin());

-- Resumen público del vendedor: nombre corto, ventas y calificación (sin datos personales)
create or replace function public.seller_summary(p_seller uuid)
returns table (display_name text, zone text, sales int, rating numeric, reviews int, since date)
language sql stable security definer set search_path = public as $$
  select
    coalesce(split_part(p.full_name, ' ', 1) || coalesce(' ' || left(nullif(split_part(p.full_name, ' ', 2), ''), 1) || '.', ''), 'Vendedor'),
    p.zone,
    (select count(*)::int from public.orders o where o.seller_id = p.id and o.status = 'conforme'),
    (select round(avg(r.rating)::numeric, 1) from public.reviews r where r.seller_id = p.id),
    (select count(*)::int from public.reviews r where r.seller_id = p.id),
    p.created_at::date
  from public.profiles p where p.id = p_seller;
$$;
revoke execute on function public.seller_summary(uuid) from public, anon;
grant execute on function public.seller_summary(uuid) to authenticated;
