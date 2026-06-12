-- Áreas a evitar para o roteamento: une buffers (~40 m) ao redor das restrições
-- de altura impeditivas (verificadas + pendentes) dentro do bbox do corredor da
-- rota e devolve um MultiPolygon GeoJSON (para o avoid_polygons do ORS).
create or replace function public.restricoes_evitar_geojson(
  min_lng double precision,
  min_lat double precision,
  max_lng double precision,
  max_lat double precision,
  altura_veiculo numeric,
  buffer_m integer default 40,
  limite integer default 30
)
returns jsonb
language sql
stable
set search_path = public, extensions
as $$
  select ST_AsGeoJSON(
           ST_Multi(ST_Union(ST_Buffer(r.geom::geography, buffer_m)::geometry))
         )::jsonb
  from (
    select geom
    from public.restrictions
    where type = 'altura'
      and value is not null
      and value <= altura_veiculo
      and geom && ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)
    limit limite
  ) r;
$$;
