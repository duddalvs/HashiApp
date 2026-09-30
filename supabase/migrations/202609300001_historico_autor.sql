begin;

-- Acrescenta o nome da conta que criou o envio, sem alterar o contrato antigo.
-- A consulta base continua responsavel por sessao, visibilidade, filtros e pagina.
create or replace function public.buscar_historico_com_autor(
  p_token text, p_busca text default '', p_limite integer default 21,
  p_offset integer default 0, p_tipo text default 'todos'
)
returns table(
  id uuid, tipo text, data date, contrato text, placas text[], detalhes jsonb,
  custo numeric, created_at timestamptz, autor_nome text
)
language plpgsql security definer set search_path='' as $$
begin
  return query
  select h.id,h.tipo,h.data,h.contrato,h.placas,h.detalhes,h.custo,h.created_at,u.nome
  from public.buscar_historico(p_token,p_busca,p_limite,p_offset,p_tipo) h
  left join public.registros_frota r on h.tipo='registro' and r.id=h.id
  left join public.manutencoes m on h.tipo='manutencao' and m.id=h.id
  join public.usuarios u on u.id=coalesce(r.usuario_id,m.usuario_id)
  order by h.created_at desc,h.id desc;
end $$;

revoke all on function public.buscar_historico_com_autor(text,text,integer,integer,text)
  from public,anon,authenticated,service_role;
grant execute on function public.buscar_historico_com_autor(text,text,integer,integer,text) to anon;
notify pgrst, 'reload schema';
commit;
