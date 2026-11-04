alter table public.profiles add column if not exists onboarded_at timestamptz;
alter table public.profiles add column if not exists style jsonb not null default '{}';
grant update (onboarded_at, style) on public.profiles to authenticated;
