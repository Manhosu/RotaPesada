-- Fase 4 — Botão "Reportar perigo" (crowdsourcing de 1 toque).
-- Insere a restrição na posição atual (status pendente_validacao) e
-- registra o report do usuário, de forma atômica.
create or replace function public.reportar_perigo(
  lat   double precision,
  lng   double precision,
  tipo  text default 'altura',
  valor numeric default null,
  via   text default null
)
returns bigint
language plpgsql
security invoker
as $$
declare
  nova_id bigint;
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Usuário não autenticado';
  end if;

  if tipo not in ('altura', 'peso', 'largura', 'rodizio') then
    raise exception 'Tipo de restrição inválido: %', tipo;
  end if;

  insert into public.restrictions (type, value, geom, street_name, status)
  values (
    tipo,
    valor,
    ST_SetSRID(ST_MakePoint(lng, lat), 4326),
    via,
    'pendente_validacao'
  )
  returning id into nova_id;

  insert into public.user_reports (user_id, restriction_id)
  values (uid, nova_id);

  return nova_id;
end;
$$;
