-- Hardening: fixa o search_path das funções (evita search_path injection).
-- Inclui 'extensions' porque as funções usam PostGIS (ST_*) sem qualificar schema.
alter function public.restricoes_proximas(double precision, double precision, numeric, integer)
  set search_path = public, extensions;

alter function public.reportar_perigo(double precision, double precision, text, numeric, text)
  set search_path = public, extensions;
