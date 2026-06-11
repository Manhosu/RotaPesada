-- Histórico de viagens / rotas recentes do motorista.
create table if not exists public.trips (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  dest_label  text not null,
  dest_lat    numeric not null,
  dest_lng    numeric not null,
  distance_m  numeric,
  duration_s  integer,
  created_at  timestamptz not null default now()
);

create index if not exists trips_user_id_created_idx
  on public.trips (user_id, created_at desc);

alter table public.trips enable row level security;

drop policy if exists "Usuarios gerenciam suas viagens" on public.trips;
create policy "Usuarios gerenciam suas viagens"
  on public.trips for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
