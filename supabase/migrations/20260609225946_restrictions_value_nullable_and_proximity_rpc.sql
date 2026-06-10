-- Reports rápidos (1 toque) podem não ter medida — value passa a ser opcional.
alter table public.restrictions alter column value drop not null;

-- Fase 3 — Motor de alerta de proximidade (PostGIS / ST_DWithin).
-- Dada a posição do motorista e a altura do caminhão, retorna restrições
-- num raio (default 500 m), priorizando as perigosas para o veículo
-- (pontes/viadutos cuja altura <= altura do caminhão).
create or replace function public.restricoes_proximas(
  lat            double precision,
  lng            double precision,
  altura_veiculo numeric default null,
  raio_m         integer default 500
)
returns table (
  id           bigint,
  type         text,
  value        numeric,
  street_name  text,
  status       text,
  distancia_m  double precision,
  longitude    double precision,
  latitude     double precision
)
language sql
stable
as $$
  select
    r.id,
    r.type,
    r.value,
    r.street_name,
    r.status,
    ST_Distance(
      r.geom::geography,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    ) as distancia_m,
    ST_X(r.geom) as longitude,
    ST_Y(r.geom) as latitude
  from public.restrictions r
  where ST_DWithin(
          r.geom::geography,
          ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
          raio_m
        )
    and (
      altura_veiculo is null
      or r.type <> 'altura'
      or r.value is null              -- restrição pendente sem medida: ainda avisa
      or r.value <= altura_veiculo    -- ponte mais baixa que o caminhão: perigo
    )
  order by distancia_m asc;
$$;
