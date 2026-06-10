-- Crowdsourcing gamificado — confirmação de restrição pendente por outros
-- motoristas. Idempotente por usuário; com 3+ confirmadores distintos a
-- restrição é promovida a 'verificado'.
--
-- SECURITY DEFINER: precisa AGREGAR reports de TODOS os usuários (o RLS de
-- user_reports só deixa cada um ver os próprios) e atualizar restrictions.
-- Mantemos seguro: valida auth.uid(), search_path fixo, e só toca uma linha.
create or replace function public.confirmar_restricao(restriction_id bigint)
returns table (confirmacoes integer, verificada boolean)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  uid uuid := auth.uid();
  total integer;
  promovida boolean := false;
begin
  if uid is null then
    raise exception 'Usuário não autenticado';
  end if;

  -- registra a confirmação (idempotente: 1 por usuário por restrição)
  insert into public.user_reports (user_id, restriction_id)
  select uid, restriction_id
  where not exists (
    select 1 from public.user_reports ur
    where ur.user_id = uid and ur.restriction_id = confirmar_restricao.restriction_id
  );

  select count(distinct ur.user_id) into total
  from public.user_reports ur
  where ur.restriction_id = confirmar_restricao.restriction_id;

  if total >= 3 then
    update public.restrictions
       set status = 'verificado'
     where id = confirmar_restricao.restriction_id
       and status = 'pendente_validacao';
    promovida := true;
  end if;

  return query select total, promovida;
end;
$$;
