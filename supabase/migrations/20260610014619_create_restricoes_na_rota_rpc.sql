-- Avaliação de rota: restrições de altura IMPEDITIVAS dentro de um corredor
-- (buffer em metros) ao longo da geometria da rota. Usado para escolher, entre
-- as rotas alternativas do Mapbox, a que evita pontes baixas para o veículo.
create or replace function public.restricoes_na_rota(
  rota_geojson  jsonb,
  altura_veiculo numeric,
  buffer_m      integer default 60
)
returns table (
  id          bigint,
  type        text,
  value       numeric,
  street_name text,
  status      text,
  distancia_m double precision
)
language sql
stable
set search_path = public, extensions
as $$
  select
    r.id, r.type, r.value, r.street_name, r.status,
    ST_Distance(
      r.geom::geography,
      ST_GeomFromGeoJSON(rota_geojson::text)::geography
    ) as distancia_m
  from public.restrictions r
  where r.type = 'altura'
    and r.value is not null
    and r.value <= altura_veiculo
    and ST_DWithin(
      r.geom::geography,
      ST_GeomFromGeoJSON(rota_geojson::text)::geography,
      buffer_m
    )
  order by distancia_m asc;
$$;
