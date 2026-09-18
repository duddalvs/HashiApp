-- Teste compartilhado entre PGlite e Supabase; contas e envios temporarios desfeitos.
begin;
do $$
declare
  v_login text := 'maint_' || substr(replace(gen_random_uuid()::text,'-',''),1,16);
  v_password text := encode(extensions.gen_random_bytes(24),'hex');
  v_user uuid; v_other uuid; v_admin uuid;
  v_token text; v_other_token text; v_admin_token text;
  v_maint uuid := gen_random_uuid(); v_reg uuid := gen_random_uuid();
  v_today date := (statement_timestamp() at time zone 'America/Sao_Paulo')::date;
  v_driver bigint; v_status bigint; v_vehicle bigint; v_contract bigint; v_type bigint;
  v_entry jsonb; v_teams jsonb; v_count integer;
begin
  v_user := public.cadastrar_usuario(v_login,v_password,'funcionario','Teste','Manutenção');
  v_other := public.cadastrar_usuario(v_login || '_o',v_password,'funcionario','Outro','Teste');
  v_admin := public.cadastrar_usuario(v_login || '_a',v_password,'admin','Admin','Teste');
  v_token := public.autenticar_usuario(v_login,v_password)->>'token';
  v_other_token := public.autenticar_usuario(v_login || '_o',v_password)->>'token';
  v_admin_token := public.autenticar_usuario(v_login || '_a',v_password)->>'token';
  select id into strict v_driver from public.funcionarios where ativo and not is_status order by id limit 1;
  select id into strict v_status from public.funcionarios where is_status order by id limit 1;
  select id into strict v_vehicle from public.veiculos where ativo order by id limit 1;
  select id into strict v_contract from public.contratos where ativo order by id limit 1;
  select id into strict v_type from public.tipos_manutencao where nome='Outros' and ativo;
  v_teams := jsonb_build_array(jsonb_build_object('responsavel_id',v_driver,'veiculo_id',v_vehicle));
  if has_function_privilege('anon','private.salvar_manutencao(uuid,date,bigint,bigint,bigint,bigint,numeric)','EXECUTE')
    or has_function_privilege('anon','private.validar_data_operacao(date)','EXECUTE') then
    raise exception 'Rotina privada exposta';
  end if;

  set local role anon;
  perform public.salvar_manutencao(v_token,v_maint,v_today,v_type,null,v_contract,v_vehicle,123.45);
  perform public.salvar_manutencao(v_token,v_maint,v_today,v_type,null,v_contract,v_vehicle,123.45);
  v_entry := public.obter_envio(v_token,v_maint,'manutencao');
  if v_entry->'driverId' is distinct from 'null'::jsonb or (v_entry->>'version')::integer <> 1 then
    raise exception 'Motorista nulo ou idempotencia incorretos';
  end if;
  select count(*) into v_count from public.buscar_historico(v_token,'',101,0,'manutencao')
    where id=v_maint and detalhes->0->'responsavel'='null'::jsonb and detalhes->0->>'servico'='Outros';
  if v_count<>1 then raise exception 'Manutencao sem motorista ausente ou duplicada no historico'; end if;
  if public.obter_envio(v_other_token,v_maint,'manutencao') is not null
    or exists(select 1 from public.buscar_historico(v_other_token) where id=v_maint) then
    raise exception 'Outro funcionario leu o envio';
  end if;
  if not exists(select 1 from public.buscar_historico(v_admin_token,'',101,0,'manutencao') where id=v_maint) then
    raise exception 'Administrador nao ve manutencao nula';
  end if;
  begin
    perform public.editar_manutencao(v_other_token,v_maint,v_today,v_type,v_driver,v_contract,v_vehicle,1,1);
    raise exception 'Outro funcionario editou o envio' using errcode='XX000';
  exception when insufficient_privilege then null; end;
  begin
    perform public.salvar_manutencao(null,gen_random_uuid(),v_today,v_type,null,v_contract,v_vehicle,1);
    raise exception 'Gravacao sem sessao aceita' using errcode='XX000';
  exception when invalid_authorization_specification then null; end;

  -- Nulo -> pessoa -> nulo; repetir a ultima edicao com a versao antiga e seguro.
  perform public.editar_manutencao(v_token,v_maint,v_today,v_type,v_driver,v_contract,v_vehicle,123.45,1);
  perform public.editar_manutencao(v_token,v_maint,v_today,v_type,null,v_contract,v_vehicle,123.45,2);
  perform public.editar_manutencao(v_token,v_maint,v_today,v_type,null,v_contract,v_vehicle,123.45,2);
  v_entry := public.obter_envio(v_token,v_maint,'manutencao');
  if v_entry->'driverId' is distinct from 'null'::jsonb or (v_entry->>'version')::integer<>3 then
    raise exception 'Edicao com nulo perdeu versao ou idempotencia';
  end if;
  begin
    perform public.editar_manutencao(v_token,v_maint,v_today,v_type,v_driver,v_contract,v_vehicle,1,1);
    raise exception 'Conflito de versao aceito' using errcode='XX000';
  exception when serialization_failure then null; end;
  begin
    perform public.salvar_manutencao(v_token,gen_random_uuid(),v_today,v_type,-1,v_contract,v_vehicle,1);
    raise exception 'Motorista inexistente aceito' using errcode='XX000';
  exception when raise_exception then null; end;
  begin
    perform public.editar_manutencao(v_token,v_maint,v_today,v_type,v_status,v_contract,v_vehicle,1,3);
    raise exception 'Status aceito como motorista' using errcode='XX000';
  exception when raise_exception then null; end;

  perform public.salvar_registro(v_token,v_reg,v_today,v_contract,v_teams);
  -- Amanhã é rejeitado na criação e edição dos dois formulários.
  begin
    perform public.salvar_registro(v_token,gen_random_uuid(),v_today+1,v_contract,v_teams);
    raise exception 'Registro futuro aceito' using errcode='XX000';
  exception when invalid_datetime_format then null; end;
  begin
    perform public.editar_registro(v_token,v_reg,v_today+1,v_contract,v_teams,1);
    raise exception 'Edicao de registro futuro aceita' using errcode='XX000';
  exception when invalid_datetime_format then null; end;
  begin
    perform public.salvar_manutencao(v_token,gen_random_uuid(),v_today+1,v_type,null,v_contract,v_vehicle,1);
    raise exception 'Manutencao futura aceita' using errcode='XX000';
  exception when invalid_datetime_format then null; end;
  begin
    perform public.editar_manutencao(v_token,v_maint,v_today+1,v_type,null,v_contract,v_vehicle,1,3);
    raise exception 'Edicao de manutencao futura aceita' using errcode='XX000';
  exception when invalid_datetime_format then null; end;
  -- Ontem também é aceito, preservando ID, autor e demais dados.
  perform public.editar_registro(v_token,v_reg,v_today-1,v_contract,v_teams,1);
  perform public.editar_manutencao(v_token,v_maint,v_today-1,v_type,null,v_contract,v_vehicle,123.45,3);
  reset role;
  if not exists(select 1 from public.manutencoes where id=v_maint and motorista_id is null and usuario_id=v_user and versao=4)
    or not exists(select 1 from public.registros_frota where id=v_reg and data=v_today-1 and versao=2) then
    raise exception 'Estado final incorreto';
  end if;
end $$;
rollback;
select 'OK: Outros ativo, motorista NULL, edicao, idempotencia, historico, permissoes e datas; rollback concluido' as resultado;
