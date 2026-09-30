-- Observacao opcional. As assinaturas antigas continuam disponiveis aos APKs instalados.
begin;

alter table public.manutencoes add column observacao text
  constraint manutencoes_observacao_limite check (char_length(observacao) <= 40);

-- Sem DEFAULT no novo argumento: PostgREST distingue clientes pelo conjunto de parametros.
create function public.salvar_manutencao(p_token text,p_id uuid,p_data date,p_tipo_id bigint,p_motorista_id bigint,p_contrato_id bigint,p_veiculo_id bigint,p_custo numeric,p_observacao text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_existing public.manutencoes; v_exists boolean; v_note text:=nullif(btrim(p_observacao),'');
begin
  perform private.validar_sessao(p_token);
  perform private.validar_data_operacao(p_data);
  if char_length(p_observacao)>40 then
    raise exception 'A observação deve ter no máximo 40 caracteres.' using errcode='22001';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
  select * into v_existing from public.manutencoes where id=p_id;
  v_exists:=found;
  if v_exists and v_existing.observacao is distinct from v_note then
    raise exception 'Este envio já existe com outros dados.' using errcode='23505';
  end if;
  perform private.salvar_manutencao(p_id,p_data,p_tipo_id,p_motorista_id,p_contrato_id,p_veiculo_id,p_custo);
  if not v_exists then
    update public.manutencoes set observacao=v_note where id=p_id;
  end if;
  return p_id;
end $$;

create function public.editar_manutencao(p_token text,p_id uuid,p_data date,p_tipo_id bigint,p_motorista_id bigint,p_contrato_id bigint,p_veiculo_id bigint,p_custo numeric,p_versao integer,p_observacao text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_existing public.manutencoes; v_uid uuid:=private.validar_sessao(p_token);
  v_note text:=nullif(btrim(p_observacao),''); v_changed boolean;
begin
  perform private.validar_data_operacao(p_data);
  if char_length(p_observacao)>40 then
    raise exception 'A observação deve ter no máximo 40 caracteres.' using errcode='22001';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
  select * into v_existing from public.manutencoes where id=p_id for update;
  if not found or (v_existing.usuario_id<>v_uid and not public.e_admin()) then
    raise exception 'Registro não encontrado ou sem permissão.' using errcode='42501';
  end if;
  v_changed:=v_existing.observacao is distinct from v_note;
  if v_changed and p_versao is distinct from v_existing.versao then
    raise exception 'Este registro foi alterado. Volte ao histórico e abra a edição novamente.' using errcode='40001';
  end if;
  perform private.editar_manutencao(p_id,p_data,p_tipo_id,p_motorista_id,p_contrato_id,p_veiculo_id,p_custo,p_versao);
  if v_changed then
    -- Editar apenas a observacao tambem avanca a versao; editar ambos avanca uma unica vez.
    update public.manutencoes set observacao=v_note,
      versao=case when versao=v_existing.versao then versao+1 else versao end where id=p_id;
  end if;
  return p_id;
end $$;

revoke all on function public.salvar_manutencao(text,uuid,date,bigint,bigint,bigint,bigint,numeric,text),
  public.editar_manutencao(text,uuid,date,bigint,bigint,bigint,bigint,numeric,integer,text)
  from public,anon,authenticated,service_role;
grant execute on function public.salvar_manutencao(text,uuid,date,bigint,bigint,bigint,bigint,numeric,text),
  public.editar_manutencao(text,uuid,date,bigint,bigint,bigint,bigint,numeric,integer,text) to anon;

create or replace function private.obter_envio(p_id uuid,p_tipo text) returns jsonb
language sql stable security invoker set search_path='' as $$
  select jsonb_build_object('id',r.id,'date',r.data,'contractId',r.contrato_id,'version',r.versao,
    'teams',(select jsonb_agg(jsonb_build_object('responsavel_id',e.responsavel_id,'veiculo_id',e.veiculo_id) order by e.numero_equipe)
      from public.registro_equipes e where e.registro_frota_id=r.id))
  from public.registros_frota r where r.id=p_id and p_tipo='registro'
  union all
  select jsonb_build_object('id',m.id,'date',m.data,'contractId',m.contrato_id,'version',m.versao,
    'typeId',m.tipo_manutencao_id,'driverId',m.motorista_id,'vehicleId',m.veiculo_id,
    'costDigits',(m.custo*100)::bigint::text,'note',coalesce(m.observacao,''))
  from public.manutencoes m where m.id=p_id and p_tipo='manutencao';
$$;

create or replace function public.buscar_historico(p_token text,p_busca text default '',p_limite integer default 21,p_offset integer default 0,p_tipo text default 'todos')
returns table(id uuid,tipo text,data date,contrato text,placas text[],detalhes jsonb,custo numeric,created_at timestamptz)
language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=private.validar_sessao(p_token); v_admin boolean:=public.e_admin();
begin
  return query
  with historico as (
    select r.id,'registro'::text as tipo,r.data,c.nome as contrato,array_agg(v.placa order by e.numero_equipe) as placas,
      jsonb_agg(jsonb_build_object('equipe',e.numero_equipe,'responsavel',f.nome,'placa',v.placa,'modelo',v.modelo) order by e.numero_equipe) as detalhes,
      null::numeric as custo,r.created_at
    from public.registros_frota r join public.contratos c on c.id=r.contrato_id
    join public.registro_equipes e on e.registro_frota_id=r.id join public.veiculos v on v.id=e.veiculo_id join public.funcionarios f on f.id=e.responsavel_id
    where r.usuario_id=v_uid or v_admin group by r.id,c.nome
    union all
    select m.id,'manutencao',m.data,c.nome,array[v.placa],jsonb_build_array(jsonb_build_object('servico',t.nome,'responsavel',f.nome,'placa',v.placa,'modelo',v.modelo,'observacao',m.observacao)),m.custo,m.created_at
    from public.manutencoes m join public.contratos c on c.id=m.contrato_id join public.veiculos v on v.id=m.veiculo_id
    left join public.funcionarios f on f.id=m.motorista_id join public.tipos_manutencao t on t.id=m.tipo_manutencao_id
    where m.usuario_id=v_uid or v_admin
  ) select h.* from historico h where (p_tipo='todos' or h.tipo=p_tipo)
    and position(public.normalizar(trim(p_busca)) in public.normalizar(h.contrato||' '||array_to_string(h.placas,' ')))>0
  order by h.created_at desc,h.id desc limit greatest(1,least(coalesce(p_limite,21),101)) offset greatest(0,coalesce(p_offset,0));
end $$;
-- CREATE OR REPLACE preserva as permissoes das duas rotinas de leitura.
notify pgrst, 'reload schema';
commit;
