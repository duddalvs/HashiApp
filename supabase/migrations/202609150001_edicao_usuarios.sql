begin;

alter table public.usuarios add column login text unique
  check (login is null or login ~ '^[a-z][a-z0-9_]{2,39}$');
alter table public.registros_frota add column versao integer not null default 1;
alter table public.manutencoes add column versao integer not null default 1;

-- Uma única consulta retorna o formulário e suas equipes sob as políticas RLS existentes.
create function public.obter_envio(p_id uuid,p_tipo text) returns jsonb
language sql stable security invoker set search_path='' as $$
  select jsonb_build_object('id',r.id,'date',r.data,'contractId',r.contrato_id,'version',r.versao,
    'teams',(select jsonb_agg(jsonb_build_object('responsavel_id',e.responsavel_id,'veiculo_id',e.veiculo_id) order by e.numero_equipe)
      from public.registro_equipes e where e.registro_frota_id=r.id))
  from public.registros_frota r where r.id=p_id and p_tipo='registro'
  union all
  select jsonb_build_object('id',m.id,'date',m.data,'contractId',m.contrato_id,'version',m.versao,
    'typeId',m.tipo_manutencao_id,'driverId',m.motorista_id,'vehicleId',m.veiculo_id,
    'costDigits',(m.custo*100)::bigint::text)
  from public.manutencoes m where m.id=p_id and p_tipo='manutencao';
$$;

create function public.editar_registro(p_id uuid,p_data date,p_contrato_id bigint,p_equipes jsonb,p_versao integer)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_existing public.registros_frota; v_equipes jsonb; v_count integer;
begin
  if not public.usuario_ativo() then raise exception 'Usuário sem acesso ativo.' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
  select * into v_existing from public.registros_frota where id=p_id for update;
  if not found or (v_existing.usuario_id<>auth.uid() and not public.e_admin()) then
    raise exception 'Registro não encontrado ou sem permissão.' using errcode='42501';
  end if;
  if p_data is null or jsonb_typeof(p_equipes) is distinct from 'array' then raise exception 'Dados inválidos.'; end if;
  v_count:=jsonb_array_length(p_equipes);
  if v_count not between 1 and 50 then raise exception 'Adicione de 1 a 50 equipes.'; end if;
  select jsonb_agg(jsonb_build_object('responsavel_id',responsavel_id,'veiculo_id',veiculo_id) order by numero_equipe)
    into v_equipes from public.registro_equipes where registro_frota_id=p_id;
  -- Repetir uma edição já concluída é seguro em caso de perda da resposta da rede.
  if v_existing.data=p_data and v_existing.contrato_id=p_contrato_id and v_equipes=p_equipes then return p_id; end if;
  if p_versao is distinct from v_existing.versao then
    raise exception 'Este registro foi alterado. Volte ao histórico e abra a edição novamente.' using errcode='40001';
  end if;
  if not exists(select 1 from public.contratos where id=p_contrato_id and ativo) then raise exception 'Selecione um contrato ativo.'; end if;
  if exists(select 1 from jsonb_array_elements(p_equipes) e where
    not exists(select 1 from public.funcionarios f where f.id=(e->>'responsavel_id')::bigint and f.ativo and not f.is_status)
    or not exists(select 1 from public.veiculos v where v.id=(e->>'veiculo_id')::bigint and v.ativo)) then
    raise exception 'Selecione um responsável e um veículo ativos para cada equipe.';
  end if;
  update public.registros_frota set data=p_data,contrato_id=p_contrato_id,numero_equipes=v_count,versao=versao+1 where id=p_id;
  delete from public.registro_equipes where registro_frota_id=p_id;
  insert into public.registro_equipes(registro_frota_id,numero_equipe,responsavel_id,veiculo_id)
    select p_id,ordinality,(value->>'responsavel_id')::bigint,(value->>'veiculo_id')::bigint
    from jsonb_array_elements(p_equipes) with ordinality;
  return p_id;
end;
$$;

create function public.editar_manutencao(p_id uuid,p_data date,p_tipo_id bigint,p_motorista_id bigint,p_contrato_id bigint,p_veiculo_id bigint,p_custo numeric,p_versao integer)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_existing public.manutencoes;
begin
  if not public.usuario_ativo() then raise exception 'Usuário sem acesso ativo.' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
  select * into v_existing from public.manutencoes where id=p_id for update;
  if not found or (v_existing.usuario_id<>auth.uid() and not public.e_admin()) then
    raise exception 'Registro não encontrado ou sem permissão.' using errcode='42501';
  end if;
  if p_data is null or p_custo is null or p_custo < 0 or p_custo > 9999999999.99 or p_custo <> round(p_custo,2) then
    raise exception 'Data ou custo inválido.';
  end if;
  if v_existing.data=p_data and v_existing.tipo_manutencao_id=p_tipo_id and v_existing.motorista_id=p_motorista_id
    and v_existing.contrato_id=p_contrato_id and v_existing.veiculo_id=p_veiculo_id and v_existing.custo=p_custo then return p_id; end if;
  if p_versao is distinct from v_existing.versao then
    raise exception 'Este registro foi alterado. Volte ao histórico e abra a edição novamente.' using errcode='40001';
  end if;
  if not exists(select 1 from public.tipos_manutencao where id=p_tipo_id and ativo)
    or not exists(select 1 from public.funcionarios where id=p_motorista_id and ativo and not is_status)
    or not exists(select 1 from public.contratos where id=p_contrato_id and ativo)
    or not exists(select 1 from public.veiculos where id=p_veiculo_id and ativo) then raise exception 'Selecione opções ativas da lista.'; end if;
  update public.manutencoes set data=p_data,tipo_manutencao_id=p_tipo_id,motorista_id=p_motorista_id,
    contrato_id=p_contrato_id,veiculo_id=p_veiculo_id,custo=p_custo,versao=versao+1 where id=p_id;
  return p_id;
end;
$$;

create function public.apagar_envio(p_id uuid,p_tipo text) returns void
language plpgsql security definer set search_path='' as $$
begin
  if not public.e_admin() then raise exception 'Somente administradores podem apagar registros.' using errcode='42501'; end if;
  if p_id is null or p_tipo is null or p_tipo not in ('registro','manutencao') then raise exception 'Registro inválido.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
  if p_tipo='registro' then
    delete from public.registros_frota where id=p_id; -- Equipes excluídas pela FK em cascata.
  else
    delete from public.manutencoes where id=p_id;
  end if;
end;
$$;

revoke all on function public.obter_envio(uuid,text), public.editar_registro(uuid,date,bigint,jsonb,integer),
 public.editar_manutencao(uuid,date,bigint,bigint,bigint,bigint,numeric,integer), public.apagar_envio(uuid,text) from public,anon;
grant execute on function public.obter_envio(uuid,text), public.editar_registro(uuid,date,bigint,jsonb,integer),
 public.editar_manutencao(uuid,date,bigint,bigint,bigint,bigint,numeric,integer), public.apagar_envio(uuid,text) to authenticated;
commit;
