-- Bucket público para fotos de placas/viadutos nos reports de crowdsourcing.
insert into storage.buckets (id, name, public)
values ('reports', 'reports', true)
on conflict (id) do nothing;

drop policy if exists "Reports upload autenticado" on storage.objects;
create policy "Reports upload autenticado"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'reports');

drop policy if exists "Reports leitura publica" on storage.objects;
create policy "Reports leitura publica"
  on storage.objects for select to public
  using (bucket_id = 'reports');
