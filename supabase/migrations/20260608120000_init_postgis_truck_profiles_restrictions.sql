-- ============================================================================
-- Rota Pesada — Migração inicial (Fase 1 + infraestrutura da Fase 2)
-- ----------------------------------------------------------------------------
-- • Habilita a extensão PostGIS (camada de inteligência espacial).
-- • Cria as tabelas truck_profiles e restrictions conforme o README.md.
-- • Cria índice espacial GIST em restrictions.geom para consultas de
--   proximidade (motor de alerta da Fase 3).
-- • Habilita Row Level Security e políticas vinculadas ao Supabase Auth.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Extensão geográfica
-- ----------------------------------------------------------------------------
-- No Supabase, extensões ficam no schema "extensions". Em um Postgres puro,
-- "create extension if not exists postgis;" também funciona.
create extension if not exists postgis with schema extensions;

-- ----------------------------------------------------------------------------
-- 2. truck_profiles — Perfis de caminhão dos usuários
-- ----------------------------------------------------------------------------
create table if not exists public.truck_profiles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,                          -- Ex: "Minha Carreta Bitrem"
  height      numeric(4, 2) not null,                 -- Altura em metros (ex.: 4.40)
  weight_pbt  numeric(6, 2) not null,                 -- Peso Bruto Total em toneladas
  axles       integer not null,                       -- Nº de eixos (cálculo de pedágio)
  is_active   boolean not null default false,         -- Veículo atualmente em uso
  created_at  timestamptz not null default now()      -- Auditoria (extra ao README)
);

-- Apenas UM veículo ativo por usuário (índice único parcial).
create unique index if not exists truck_profiles_one_active_per_user
  on public.truck_profiles (user_id)
  where is_active;

-- Busca rápida dos veículos de um usuário.
create index if not exists truck_profiles_user_id_idx
  on public.truck_profiles (user_id);

-- ----------------------------------------------------------------------------
-- 3. restrictions — Base geográfica de perigos
-- ----------------------------------------------------------------------------
create table if not exists public.restrictions (
  id          bigint generated always as identity primary key,
  type        text not null
                check (type in ('altura', 'peso', 'largura', 'rodizio')),
  value       numeric not null,                        -- Ex.: 4.20 = altura máx. da ponte
  geom        geometry(Point, 4326) not null,          -- WGS84 (lat/lng)
  street_name text,                                    -- Nome aproximado da via
  status      text not null default 'pendente_validacao'
                check (status in ('verificado', 'pendente_validacao')),
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 4. Índice espacial GIST — consultas de proximidade ultra rápidas
-- ----------------------------------------------------------------------------
create index if not exists restrictions_geom_gist
  on public.restrictions
  using gist (geom);

-- ----------------------------------------------------------------------------
-- 5. Row Level Security (vínculo com o Auth)
-- ----------------------------------------------------------------------------
alter table public.truck_profiles enable row level security;
alter table public.restrictions   enable row level security;

-- Cada usuário só enxerga e manipula os próprios veículos.
drop policy if exists "Usuarios gerenciam seus proprios veiculos" on public.truck_profiles;
create policy "Usuarios gerenciam seus proprios veiculos"
  on public.truck_profiles
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Restrições são lidas por qualquer usuário autenticado (alertas de rota).
drop policy if exists "Restricoes visiveis para autenticados" on public.restrictions;
create policy "Restricoes visiveis para autenticados"
  on public.restrictions
  for select
  to authenticated
  using (true);

-- Qualquer usuário autenticado pode reportar um novo perigo (crowdsourcing).
-- Inserções entram como 'pendente_validacao' até verificação.
drop policy if exists "Autenticados podem reportar restricoes" on public.restrictions;
create policy "Autenticados podem reportar restricoes"
  on public.restrictions
  for insert
  to authenticated
  with check (status = 'pendente_validacao');
