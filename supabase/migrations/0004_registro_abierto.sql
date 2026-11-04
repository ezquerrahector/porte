-- Registro abierto: el código de invitación pasa a ser opcional (sirve para medir de dónde llega cada usuario).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_code text := nullif(upper(trim(coalesce(new.raw_user_meta_data->>'invite_code', ''))), '');
  v_inv public.invites;
begin
  if v_code is not null then
    select * into v_inv from public.invites where code = v_code for update;
    if v_inv.code is null or v_inv.uses >= v_inv.max_uses then
      v_code := null; -- código inválido: se registra igual, sin código
    else
      update public.invites set uses = uses + 1 where code = v_code;
    end if;
  end if;
  insert into public.profiles (id, full_name, invite_code)
  values (new.id, new.raw_user_meta_data->>'full_name', v_code);
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
