revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.advance_order(uuid, text, text, text) from public, anon;
revoke execute on function public.confirm_order(uuid) from public, anon;
revoke execute on function public.reserve_listing(uuid, text, text) from public, anon;
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.wear_outfit(uuid[], text, numeric) from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.wear_outfit(uuid[], text, numeric) to authenticated;
