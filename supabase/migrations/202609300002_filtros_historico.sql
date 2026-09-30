begin;

-- Filtros aplicados antes da agregacao/paginacao. RPCs anteriores permanecem intactas.
create or replace function public.filtrar_historico(
  p_token text, p_tipo text default 'registro', p_periodo text default 'week',
  p_campo_data text default 'created_at', p_data_de date default null, p_data_ate date default null,
  p_motorista_id bigint default null, p_veiculo_id bigint default null,
  p_contrato_id bigint default null, p_autor_id uuid default null,
  p_tipo_manutencao_id bigint default null, p_limite integer default 21, p_offset integer default 0
)
returns table(id uuid,tipo text,data date,contrato text,placas text[],detalhes jsonb,
  custo numeric,created_at timestamptz,autor_nome text)
language plpgsql security definer set search_path='' as $$
declare
  v_uid uuid:=private.validar_sessao(p_token);
  v_admin boolean:=public.e_admin();
  v_de date; v_ate date; v_inicio timestamptz; v_fim timestamptz;
begin
  if p_tipo is null or p_tipo not in ('registro','manutencao')
    or p_periodo is null or p_periodo not in ('week','custom','all')
    or p_campo_data is null or p_campo_data not in ('created_at','data') then
    raise exception 'Filtro inválido.' using errcode='22023';
  end if;
  if p_periodo='week' then
    v_ate:=(statement_timestamp() at time zone 'America/Sao_Paulo')::date;
    v_de:=v_ate-6;
  elsif p_periodo='custom' then
    v_de:=p_data_de; v_ate:=p_data_ate;
    if (v_de is null and v_ate is null) or v_de>v_ate then
      raise exception 'Período inválido. Confira as datas.' using errcode='22023';
    end if;
  end if;
  v_inicio:=v_de::timestamp at time zone 'America/Sao_Paulo';
  v_fim:=(v_ate+1)::timestamp at time zone 'America/Sao_Paulo';
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
      and (p_contrato_id is null or r.contrato_id=p_contrato_id)
      and (p_autor_id is null or r.usuario_id=p_autor_id)
      and ((p_campo_data='data' and (v_de is null or r.data>=v_de) and (v_ate is null or r.data<=v_ate))
        or (p_campo_data='created_at' and (v_inicio is null or r.created_at>=v_inicio) and (v_fim is null or r.created_at<v_fim)))
      and exists(select 1 from public.registro_equipes x where x.registro_frota_id=r.id
        and (p_motorista_id is null or x.responsavel_id=p_motorista_id)
        and (p_veiculo_id is null or x.veiculo_id=p_veiculo_id))
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
      and (p_contrato_id is null or m.contrato_id=p_contrato_id)
      and (p_autor_id is null or m.usuario_id=p_autor_id)
      and (p_veiculo_id is null or m.veiculo_id=p_veiculo_id)
      and (p_motorista_id is null or (p_motorista_id=0 and m.motorista_id is null) or m.motorista_id=p_motorista_id)
      and (p_tipo_manutencao_id is null or m.tipo_manutencao_id=p_tipo_manutencao_id)
      and ((p_campo_data='data' and (v_de is null or m.data>=v_de) and (v_ate is null or m.data<=v_ate))
        or (p_campo_data='created_at' and (v_inicio is null or m.created_at>=v_inicio) and (v_fim is null or m.created_at<v_fim)))
  ) select h.* from historico h order by h.created_at desc,h.id desc
  limit greatest(1,least(coalesce(p_limite,21),101)) offset greatest(0,coalesce(p_offset,0));
end $$;

-- Opcoes de todo o historico visivel, incluindo cadastros hoje inativos.
-- Nao dependem da pagina nem do periodo atual, para permitir achar envios antigos.
create or replace function public.opcoes_filtros_historico(p_token text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=private.validar_sessao(p_token); v_admin boolean:=public.e_admin(); v_result jsonb;
begin
  with r as materialized (select * from public.registros_frota where usuario_id=v_uid or v_admin),
    m as materialized (select * from public.manutencoes where usuario_id=v_uid or v_admin),
    e as materialized (select x.* from public.registro_equipes x join r on r.id=x.registro_frota_id)
  select jsonb_build_object(
    'drivers',coalesce((select jsonb_agg(jsonb_build_object('id',f.id,'nome',f.nome) order by f.nome,f.id)
      from public.funcionarios f where f.id in (select responsavel_id from e union select motorista_id from m)),'[]'::jsonb),
    'vehicles',coalesce((select jsonb_agg(jsonb_build_object('id',v.id,'placa',v.placa,'modelo',v.modelo) order by v.placa,v.id)
      from public.veiculos v where v.id in (select veiculo_id from e union select veiculo_id from m)),'[]'::jsonb),
    'contracts',coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'nome',c.nome) order by c.nome,c.id)
      from public.contratos c where c.id in (select contrato_id from r union select contrato_id from m)),'[]'::jsonb),
    'authors',coalesce((select jsonb_agg(jsonb_build_object('id',u.id,'nome',u.nome,'login',u.login) order by u.nome,u.id)
      from public.usuarios u where u.id in (select usuario_id from r union select usuario_id from m)),'[]'::jsonb),
    'maintenanceTypes',coalesce((select jsonb_agg(jsonb_build_object('id',t.id,'nome',t.nome) order by t.nome,t.id)
      from public.tipos_manutencao t where t.id in (select tipo_manutencao_id from m)),'[]'::jsonb)
  ) into v_result;
  return v_result;
end $$;

revoke all on function public.filtrar_historico(text,text,text,text,date,date,bigint,bigint,bigint,uuid,bigint,integer,integer),
  public.opcoes_filtros_historico(text) from public,anon,authenticated,service_role;
grant execute on function public.filtrar_historico(text,text,text,text,date,date,bigint,bigint,bigint,uuid,bigint,integer,integer),
  public.opcoes_filtros_historico(text) to anon;
notify pgrst, 'reload schema';
commit;
