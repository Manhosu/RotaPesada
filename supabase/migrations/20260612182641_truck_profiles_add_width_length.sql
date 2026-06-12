-- Largura e comprimento do veículo — necessários para o roteamento de caminhão
-- (evitar vias estreitas/curtas demais para o gabarito). Em metros.
alter table public.truck_profiles
  add column if not exists width numeric,
  add column if not exists length numeric;
