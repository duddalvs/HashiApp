-- Datas de operacao limitadas a hoje; motorista desconhecido usa NULL na FK existente.
-- Preserva IDs, referencias, autoria, versoes, permissoes e envios anteriores.
begin;

alter table public.manutencoes alter column motorista_id drop not null;

-- O cadastro inicial ja inclui Outros. Garante a opcao ativa sem duplicar seu ID.
insert into public.tipos_manutencao(nome,ativo) values ('Outros',true)
on conflict (nome) do update set ativo=true;

create function private.validar_data_operacao(p_data date) returns void
language plpgsql set search_path='' as $$
begin
  if p_data is null then raise exception 'Escolha uma data válida.'; end if;
  if p_data > (statement_timestamp() at time zone 'America/Sao_Paulo')::date then
    raise exception 'A data não pode ser posterior a hoje.' using errcode='22007';
  end if;
end $$;
revoke all on function private.validar_data_operacao(date) from public,anon,authenticated,service_role;
create or replace function private.salvar_manutencao(p_id uuid,p_data date,p_tipo_id bigint,p_motorista_id bigint,p_contrato_id bigint,p_veiculo_id bigint,p_custo numeric)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_existing public.manutencoes; v_uid uuid:=private.usuario_id();
begin
  if not public.usuario_ativo() then raise exception 'Usuário sem acesso ativo.' using errcode='42501'; end if;
  if p_id is null or p_data is null or p_custo is null or p_custo < 0 or p_custo > 9999999999.99 or p_custo <> round(p_custo,2) then raise exception 'Data ou custo inválido.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
  select * into v_existing from public.manutencoes where id=p_id;
  if found then
    if v_existing.usuario_id=v_uid and v_existing.data=p_data and v_existing.tipo_manutencao_id=p_tipo_id and (v_existing.motorista_id is not distinct from p_motorista_id) and v_existing.contrato_id=p_contrato_id and v_existing.veiculo_id=p_veiculo_id and v_existing.custo=p_custo then return p_id; end if;
    raise exception 'Este envio já existe com outros dados.' using errcode='23505';
  end if;
  if not exists(select 1 from public.tipos_manutencao where id=p_tipo_id and ativo)
    or (p_motorista_id is not null and not exists(select 1 from public.funcionarios where id=p_motorista_id and ativo and not is_status))
    or not exists(select 1 from public.contratos where id=p_contrato_id and ativo)
    or not exists(select 1 from public.veiculos where id=p_veiculo_id and ativo) then raise exception 'Selecione opções ativas da lista.'; end if;
  insert into public.manutencoes(id,data,tipo_manutencao_id,motorista_id,contrato_id,veiculo_id,custo,usuario_id)
  values(p_id,p_data,p_tipo_id,p_motorista_id,p_contrato_id,p_veiculo_id,p_custo,v_uid);
  return p_id;
end;
$$;

create or replace function private.editar_manutencao(p_id uuid,p_data date,p_tipo_id bigint,p_motorista_id bigint,p_contrato_id bigint,p_veiculo_id bigint,p_custo numeric,p_versao integer)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_existing public.manutencoes;
begin
  if not public.usuario_ativo() then raise exception 'Usuário sem acesso ativo.' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
  select * into v_existing from public.manutencoes where id=p_id for update;
  if not found or (v_existing.usuario_id<>private.usuario_id() and not public.e_admin()) then
    raise exception 'Registro não encontrado ou sem permissão.' using errcode='42501';
  end if;
  if p_data is null or p_custo is null or p_custo < 0 or p_custo > 9999999999.99 or p_custo <> round(p_custo,2) then
    raise exception 'Data ou custo inválido.';
  end if;
  if v_existing.data=p_data and v_existing.tipo_manutencao_id=p_tipo_id and (v_existing.motorista_id is not distinct from p_motorista_id)
    and v_existing.contrato_id=p_contrato_id and v_existing.veiculo_id=p_veiculo_id and v_existing.custo=p_custo then return p_id; end if;
  if p_versao is distinct from v_existing.versao then
    raise exception 'Este registro foi alterado. Volte ao histórico e abra a edição novamente.' using errcode='40001';
  end if;
  if not exists(select 1 from public.tipos_manutencao where id=p_tipo_id and ativo)
    or (p_motorista_id is not null and not exists(select 1 from public.funcionarios where id=p_motorista_id and ativo and not is_status))
    or not exists(select 1 from public.contratos where id=p_contrato_id and ativo)
    or not exists(select 1 from public.veiculos where id=p_veiculo_id and ativo) then raise exception 'Selecione opções ativas da lista.'; end if;
  update public.manutencoes set data=p_data,tipo_manutencao_id=p_tipo_id,motorista_id=p_motorista_id,
    contrato_id=p_contrato_id,veiculo_id=p_veiculo_id,custo=p_custo,versao=versao+1 where id=p_id;
  return p_id;
end;
$$;

create or replace function public.salvar_registro(p_token text,p_id uuid,p_data date,p_contrato_id bigint,p_equipes jsonb) returns uuid
language plpgsql security definer set search_path='' as $$ begin
  perform private.validar_sessao(p_token); perform private.validar_data_operacao(p_data); return private.salvar_registro(p_id,p_data,p_contrato_id,p_equipes); end $$;

create or replace function public.salvar_manutencao(p_token text,p_id uuid,p_data date,p_tipo_id bigint,p_motorista_id bigint,p_contrato_id bigint,p_veiculo_id bigint,p_custo numeric) returns uuid
language plpgsql security definer set search_path='' as $$ begin
  perform private.validar_sessao(p_token); perform private.validar_data_operacao(p_data); return private.salvar_manutencao(p_id,p_data,p_tipo_id,p_motorista_id,p_contrato_id,p_veiculo_id,p_custo); end $$;

create or replace function public.editar_registro(p_token text,p_id uuid,p_data date,p_contrato_id bigint,p_equipes jsonb,p_versao integer) returns uuid
language plpgsql security definer set search_path='' as $$ begin
  perform private.validar_sessao(p_token); perform private.validar_data_operacao(p_data); return private.editar_registro(p_id,p_data,p_contrato_id,p_equipes,p_versao); end $$;

create or replace function public.editar_manutencao(p_token text,p_id uuid,p_data date,p_tipo_id bigint,p_motorista_id bigint,p_contrato_id bigint,p_veiculo_id bigint,p_custo numeric,p_versao integer) returns uuid
language plpgsql security definer set search_path='' as $$ begin
  perform private.validar_sessao(p_token); perform private.validar_data_operacao(p_data); return private.editar_manutencao(p_id,p_data,p_tipo_id,p_motorista_id,p_contrato_id,p_veiculo_id,p_custo,p_versao); end $$;

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
    select m.id,'manutencao',m.data,c.nome,array[v.placa],jsonb_build_array(jsonb_build_object('servico',t.nome,'responsavel',f.nome,'placa',v.placa,'modelo',v.modelo)),m.custo,m.created_at
    from public.manutencoes m join public.contratos c on c.id=m.contrato_id join public.veiculos v on v.id=m.veiculo_id
    left join public.funcionarios f on f.id=m.motorista_id join public.tipos_manutencao t on t.id=m.tipo_manutencao_id
    where m.usuario_id=v_uid or v_admin
  ) select h.* from historico h where (p_tipo='todos' or h.tipo=p_tipo)
    and position(public.normalizar(trim(p_busca)) in public.normalizar(h.contrato||' '||array_to_string(h.placas,' ')))>0
  order by h.created_at desc,h.id desc limit greatest(1,least(coalesce(p_limite,21),101)) offset greatest(0,coalesce(p_offset,0));
end $$;
-- CREATE OR REPLACE conserva os grants existentes; rotinas privadas continuam inacessiveis.
revoke all on function private.salvar_manutencao(uuid,date,bigint,bigint,bigint,bigint,numeric),
  private.editar_manutencao(uuid,date,bigint,bigint,bigint,bigint,numeric,integer)
  from public,anon,authenticated,service_role;
notify pgrst, 'reload schema';
commit;
