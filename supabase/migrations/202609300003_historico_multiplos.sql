begin;

-- OU entre valores do mesmo campo; E entre campos. Datas sempre operacionais.
-- Parametros de data omitidos usam a semana; NULL explicito remove aquele limite.
create or replace function public.filtrar_historico_multiplos(
  p_token text, p_tipo text default 'registro',
  p_data_de date default ((statement_timestamp() at time zone 'America/Sao_Paulo')::date-6),
  p_data_ate date default ((statement_timestamp() at time zone 'America/Sao_Paulo')::date),
  p_motorista_ids bigint[] default '{}', p_veiculo_ids bigint[] default '{}',
  p_contrato_ids bigint[] default '{}', p_autor_ids uuid[] default '{}',
  p_tipo_manutencao_ids bigint[] default '{}', p_limite integer default 21, p_offset integer default 0
)
returns table(id uuid,tipo text,data date,contrato text,placas text[],detalhes jsonb,
  custo numeric,created_at timestamptz,autor_nome text)
language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=private.validar_sessao(p_token); v_admin boolean:=public.e_admin();
begin
  if p_tipo is null or p_tipo not in ('registro','manutencao') or p_data_de>p_data_ate then
    raise exception 'Filtro inválido. Confira as datas e a categoria.' using errcode='22023';
  end if;
  p_motorista_ids:=coalesce(array_remove(p_motorista_ids,null),'{}');
  p_veiculo_ids:=coalesce(array_remove(p_veiculo_ids,null),'{}');
  p_contrato_ids:=coalesce(array_remove(p_contrato_ids,null),'{}');
  p_autor_ids:=coalesce(array_remove(p_autor_ids,null),'{}');
  p_tipo_manutencao_ids:=coalesce(array_remove(p_tipo_manutencao_ids,null),'{}');
  return query
  with historico as (
    select r.id,'registro'::text as tipo,r.data,c.nome as contrato,
      array_agg(v.placa order by e.numero_equipe) as placas,
      jsonb_agg(jsonb_build_object('equipe',e.numero_equipe,'responsavel',f.nome,
        'placa',v.placa,'modelo',v.modelo) order by e.numero_equipe) as detalhes,
      null::numeric as custo,r.created_at,u.nome as autor_nome
    from public.registros_frota r
    join public.contratos c on c.id=r.contrato_id
    join public.usuarios u on u.id=r.usuario_id
    join public.registro_equipes e on e.registro_frota_id=r.id
    join public.veiculos v on v.id=e.veiculo_id
    join public.funcionarios f on f.id=e.responsavel_id
    where p_tipo='registro' and (r.usuario_id=v_uid or v_admin)
      and (cardinality(p_contrato_ids)=0 or r.contrato_id=any(p_contrato_ids))
      and (cardinality(p_autor_ids)=0 or r.usuario_id=any(p_autor_ids))
      and (p_data_de is null or r.data>=p_data_de) and (p_data_ate is null or r.data<=p_data_ate)
      and exists(select 1 from public.registro_equipes x where x.registro_frota_id=r.id
        and (cardinality(p_motorista_ids)=0 or x.responsavel_id=any(p_motorista_ids))
        and (cardinality(p_veiculo_ids)=0 or x.veiculo_id=any(p_veiculo_ids)))
    group by r.id,c.nome,u.nome
    union all
    select m.id,'manutencao',m.data,c.nome,array[v.placa],
      jsonb_build_array(jsonb_build_object('servico',t.nome,'responsavel',f.nome,
        'placa',v.placa,'modelo',v.modelo,'observacao',m.observacao)),m.custo,m.created_at,u.nome
    from public.manutencoes m
    join public.contratos c on c.id=m.contrato_id
    join public.usuarios u on u.id=m.usuario_id
    join public.veiculos v on v.id=m.veiculo_id
    left join public.funcionarios f on f.id=m.motorista_id
    join public.tipos_manutencao t on t.id=m.tipo_manutencao_id
    where p_tipo='manutencao' and (m.usuario_id=v_uid or v_admin)
      and (cardinality(p_contrato_ids)=0 or m.contrato_id=any(p_contrato_ids))
      and (cardinality(p_autor_ids)=0 or m.usuario_id=any(p_autor_ids))
      and (cardinality(p_veiculo_ids)=0 or m.veiculo_id=any(p_veiculo_ids))
      and (cardinality(p_motorista_ids)=0 or (0=any(p_motorista_ids) and m.motorista_id is null) or m.motorista_id=any(p_motorista_ids))
      and (cardinality(p_tipo_manutencao_ids)=0 or m.tipo_manutencao_id=any(p_tipo_manutencao_ids))
      and (p_data_de is null or m.data>=p_data_de) and (p_data_ate is null or m.data<=p_data_ate)
  ) select h.* from historico h order by h.created_at desc,h.id desc
  limit greatest(1,least(coalesce(p_limite,21),101)) offset greatest(0,coalesce(p_offset,0));
end $$;

-- Acrescenta sobrenome apenas aos autores que a consulta autorizada ja retornou.
create or replace function public.opcoes_filtros_historico_completas(p_token text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_opcoes jsonb:=public.opcoes_filtros_historico(p_token);
begin
  return jsonb_set(v_opcoes,'{authors}',coalesce((
    select jsonb_agg(a.value||jsonb_build_object('sobrenome',u.sobrenome) order by a.ord)
    from jsonb_array_elements(v_opcoes->'authors') with ordinality a(value,ord)
    join public.usuarios u on u.id=(a.value->>'id')::uuid
  ),'[]'::jsonb));
end $$;

revoke all on function public.filtrar_historico_multiplos(text,text,date,date,bigint[],bigint[],bigint[],uuid[],bigint[],integer,integer),
  public.opcoes_filtros_historico_completas(text) from public,anon,authenticated,service_role;
grant execute on function public.filtrar_historico_multiplos(text,text,date,date,bigint[],bigint[],bigint[],uuid[],bigint[],integer,integer),
  public.opcoes_filtros_historico_completas(text) to anon;
notify pgrst, 'reload schema';
commit;
