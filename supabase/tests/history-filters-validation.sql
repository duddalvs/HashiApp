begin;
do $$
declare
  v_login text:='filters_'||substr(replace(gen_random_uuid()::text,'-',''),1,16);
  v_password text:=encode(extensions.gen_random_bytes(24),'hex');
  v_user uuid; v_other uuid; v_admin uuid; v_token text; v_other_token text; v_admin_token text;
  v_contract bigint; v_vehicle bigint; v_vehicle2 bigint; v_driver bigint; v_driver2 bigint; v_type bigint;
  v_reg uuid:=gen_random_uuid(); v_old uuid:=gen_random_uuid(); v_back uuid:=gen_random_uuid();
  v_pairs uuid:=gen_random_uuid(); v_maint uuid:=gen_random_uuid(); v_old_m uuid:=gen_random_uuid(); v_other_m uuid:=gen_random_uuid();
  v_today date:=(statement_timestamp() at time zone 'America/Sao_Paulo')::date;
  v_start timestamptz; v_options jsonb;
begin
  v_start:=(v_today-6)::timestamp at time zone 'America/Sao_Paulo';
  v_user:=public.cadastrar_usuario(v_login,v_password,'funcionario','Maria Eduarda','Teste');
  v_other:=public.cadastrar_usuario(v_login||'_o',v_password,'funcionario','Outro','Teste');
  v_admin:=public.cadastrar_usuario(v_login||'_a',v_password,'admin','Admin','Teste');
  v_token:=public.autenticar_usuario(v_login,v_password)->>'token';
  v_other_token:=public.autenticar_usuario(v_login||'_o',v_password)->>'token';
  v_admin_token:=public.autenticar_usuario(v_login||'_a',v_password)->>'token';
  insert into public.funcionarios(nome) values(v_login||' motorista A') returning id into v_driver;
  insert into public.funcionarios(nome) values(v_login||' motorista B') returning id into v_driver2;
  insert into public.veiculos(placa,modelo) values(v_login||'1','Teste') returning id into v_vehicle;
  insert into public.veiculos(placa,modelo) values(v_login||'2','Teste') returning id into v_vehicle2;
  insert into public.contratos(nome) values(v_login) returning id into v_contract;
  insert into public.tipos_manutencao(nome) values(v_login) returning id into v_type;
  insert into public.registros_frota(id,data,contrato_id,usuario_id,created_at,numero_equipes) values
    (v_reg,v_today-6,v_contract,v_user,v_start,1),
    (v_old,v_today-7,v_contract,v_user,v_start-interval '1 microsecond',1),
    (v_back,v_today-40,v_contract,v_user,now(),1),
    (v_pairs,v_today,v_contract,v_user,now(),2);
  insert into public.registro_equipes(registro_frota_id,numero_equipe,responsavel_id,veiculo_id) values
    (v_reg,1,v_driver,v_vehicle),(v_old,1,v_driver,v_vehicle),(v_back,1,v_driver,v_vehicle),
    (v_pairs,1,v_driver,v_vehicle),(v_pairs,2,v_driver2,v_vehicle2);
  insert into public.manutencoes(id,data,tipo_manutencao_id,motorista_id,contrato_id,veiculo_id,custo,usuario_id,created_at,observacao) values
    (v_maint,v_today,v_type,null,v_contract,v_vehicle,10,v_user,now(),'Observação preservada'),
    (v_old_m,v_today-60,v_type,v_driver,v_contract,v_vehicle2,20,v_user,now()-interval '60 days',null),
    (v_other_m,v_today,v_type,v_driver2,v_contract,v_vehicle2,30,v_other,now(),null);
  insert into public.manutencoes(data,tipo_manutencao_id,motorista_id,contrato_id,veiculo_id,custo,usuario_id,created_at)
    select v_today-30,v_type,v_driver,v_contract,v_vehicle,10,v_user,now()-interval '30 days' from generate_series(1,24);
  -- Cadastros inativos tambem devem ser encontrados em lancamentos antigos.
  update public.funcionarios set ativo=false where id=v_driver;
  update public.veiculos set ativo=false where id=v_vehicle2;
  set local role anon;
  if (select count(*) from public.filtrar_historico(v_token))<>3
    or exists(select 1 from public.filtrar_historico(v_token) where id=v_old)
    or not exists(select 1 from public.filtrar_historico(v_token) where id=v_reg) then
    raise exception 'Limites dos sete dias incorretos';
  end if;
  if exists(select 1 from public.filtrar_historico(v_token,p_campo_data=>'data') where id=v_back)
    or not exists(select 1 from public.filtrar_historico(v_token) where id=v_back) then
    raise exception 'Data informada confundida com data do lancamento';
  end if;
  if (select count(*) from public.filtrar_historico(v_token,p_periodo=>'all'))<>4
    or (select count(*) from public.filtrar_historico(v_token,p_periodo=>'custom',p_data_de=>v_today-6,p_data_ate=>v_today-6))<>1
    or (select count(*) from public.filtrar_historico(v_token,p_periodo=>'custom',p_data_ate=>v_today-7))<>1
    or (select count(*) from public.filtrar_historico(v_token,p_periodo=>'custom',p_data_de=>v_today-6))<>3 then
    raise exception 'Periodo personalizado ou aberto incorreto';
  end if;
  if exists(select 1 from public.filtrar_historico(v_token,p_motorista_id=>v_driver,p_veiculo_id=>v_vehicle2)) then
    raise exception 'Combinacao entre equipes diferentes aceita';
  end if;
  if not exists(select 1 from public.filtrar_historico(v_token,p_motorista_id=>v_driver2,p_veiculo_id=>v_vehicle2)
    where id=v_pairs and jsonb_array_length(detalhes)=2 and autor_nome='Maria Eduarda') then
    raise exception 'Equipe combinada ou detalhes completos ausentes';
  end if;
  if not exists(select 1 from public.filtrar_historico(v_token,p_tipo=>'manutencao',p_motorista_id=>0)
    where id=v_maint and detalhes->0->>'observacao'='Observação preservada') then
    raise exception 'Motorista nulo ou observacao ausente';
  end if;
  if (select count(*) from public.filtrar_historico(v_token,p_tipo=>'manutencao',p_periodo=>'all',
    p_motorista_id=>v_driver,p_veiculo_id=>v_vehicle2,p_contrato_id=>v_contract,p_autor_id=>v_user,p_tipo_manutencao_id=>v_type))<>1 then
    raise exception 'Filtros combinados aplicados depois da pagina';
  end if;
  if (select count(*) from public.filtrar_historico(v_token,p_tipo=>'manutencao',p_periodo=>'all',p_limite=>21,p_offset=>21))<>5 then
    raise exception 'Paginacao incorreta';
  end if;
  if exists(select 1 from public.filtrar_historico(v_other_token,p_periodo=>'all'))
    or exists(select 1 from public.filtrar_historico(v_other_token,p_tipo=>'manutencao',p_periodo=>'all',p_autor_id=>v_user))
    or not exists(select 1 from public.filtrar_historico(v_admin_token,p_tipo=>'manutencao',p_autor_id=>v_other) where id=v_other_m) then
    raise exception 'Visibilidade alterada';
  end if;
  v_options:=public.opcoes_filtros_historico(v_token);
  if not (v_options->'drivers' @> jsonb_build_array(jsonb_build_object('id',v_driver)))
    or not (v_options->'vehicles' @> jsonb_build_array(jsonb_build_object('id',v_vehicle2)))
    or not (v_options->'authors' @> jsonb_build_array(jsonb_build_object('id',v_user,'nome','Maria Eduarda')))
    or v_options->'authors' @> jsonb_build_array(jsonb_build_object('id',v_other)) then
    raise exception 'Opcoes inativas ausentes ou autor alheio exposto';
  end if;
  if not exists(select 1 from public.buscar_historico_com_autor(v_token,'',101) where id=v_old_m) then
    raise exception 'Contrato de APK antigo alterado';
  end if;
  begin
    perform * from public.filtrar_historico(v_token,p_periodo=>'custom',p_data_de=>v_today,p_data_ate=>v_today-1);
    raise exception 'Intervalo invertido aceito' using errcode='XX000';
  exception when invalid_parameter_value then null; end;
  begin
    perform * from public.filtrar_historico(v_token,p_periodo=>'custom');
    raise exception 'Intervalo vazio aceito' using errcode='XX000';
  exception when invalid_parameter_value then null; end;
  begin
    perform * from public.filtrar_historico(null);
    raise exception 'Sessao ausente aceita' using errcode='XX000';
  exception when invalid_authorization_specification then null; end;
  begin
    perform public.opcoes_filtros_historico(null);
    raise exception 'Opcoes sem sessao aceitas' using errcode='XX000';
  exception when invalid_authorization_specification then null; end;
  reset role;
  if has_table_privilege('anon','public.usuarios','SELECT')
    or has_function_privilege('authenticated','public.opcoes_filtros_historico(text)','EXECUTE') then
    raise exception 'Grant indevido';
  end if;
end $$;
rollback;
select 'OK: sete dias, datas inclusivas/abertas, combinacoes, mesma equipe, filtros antes da pagina, opcoes inativas, autoria, permissoes e compatibilidade; rollback concluido' as resultado;
