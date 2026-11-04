alter table public.profiles add column if not exists postal_code text check (postal_code ~ '^\d{5}$');
grant update (postal_code) on public.profiles to authenticated;
create or replace function public.seller_summary(p_seller uuid)
returns table (display_name text, zone text, sales int, rating numeric, reviews int, since date)
language sql stable security definer set search_path = public as $$
  select
    coalesce(split_part(p.full_name, ' ', 1) || coalesce(' ' || left(nullif(split_part(p.full_name, ' ', 2), ''), 1) || '.', ''), 'Vendedor'),
    case when p.postal_code between '37000' and '37699' then 'León' else null end,
    (select count(*)::int from public.orders o where o.seller_id = p.id and o.status = 'conforme'),
    (select round(avg(r.rating)::numeric, 1) from public.reviews r where r.seller_id = p.id),
    (select count(*)::int from public.reviews r where r.seller_id = p.id),
    p.created_at::date
  from public.profiles p where p.id = p_seller;
$$;
