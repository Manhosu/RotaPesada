-- Fase 4 — Logs de crowdsourcing (reports de motoristas)
create table if not exists public.user_reports (
  id             bigint generated always as identity primary key,
  user_id        uuid not null references auth.users (id) on delete cascade,
  restriction_id bigint not null references public.restrictions (id) on delete cascade,
  photo_url      text,
  created_at     timestamptz not null default now()
);

create index if not exists user_reports_user_id_idx on public.user_reports (user_id);
create index if not exists user_reports_restriction_id_idx on public.user_reports (restriction_id);

alter table public.user_reports enable row level security;

drop policy if exists "Usuarios veem seus reports" on public.user_reports;
create policy "Usuarios veem seus reports"
  on public.user_reports for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Usuarios inserem seus reports" on public.user_reports;
create policy "Usuarios inserem seus reports"
  on public.user_reports for insert to authenticated
  with check (auth.uid() = user_id);
