-- Contas e envios temporarios; todas as alteracoes sao desfeitas.
begin;
do $$
declare
  v_login text:='author_'||substr(replace(gen_random_uuid()::text,'-',''),1,16);
  v_password text:=encode(extensions.gen_random_bytes(24),'hex');
  v_user uuid; v_admin uuid; v_token text; v_other_token text; v_admin_token text;
  v_reg uuid:=gen_random_uuid(); v_maint uuid:=gen_random_uuid();
  v_today date:=(statement_timestamp() at time zone 'America/Sao_Paulo')::date;
  v_contract bigint; v_vehicle bigint; v_type bigint; v_driver bigint;
  v_teams jsonb; v_old jsonb; v_new jsonb;
begin
  v_user:=public.cadastrar_usuario(v_login,v_password,'funcionario','Maria Eduarda','Alves');
  perform public.cadastrar_usuario(v_login||'_o',v_password,'funcionario','Outro','Teste');
  v_admin:=public.cadastrar_usuario(v_login||'_a',v_password,'admin','Lucas','Teste');
  v_token:=public.autenticar_usuario(v_login,v_password)->>'token';
  v_other_token:=public.autenticar_usuario(v_login||'_o',v_password)->>'token';
  v_admin_token:=public.autenticar_usuario(v_login||'_a',v_password)->>'token';
  select id into strict v_contract from public.contratos where ativo order by id limit 1;
  select id into strict v_vehicle from public.veiculos where ativo order by id limit 1;
  select id into strict v_type from public.tipos_manutencao where ativo order by id limit 1;
  select id into strict v_driver from public.funcionarios where ativo and not is_status order by id limit 1;
  v_teams:=jsonb_build_array(jsonb_build_object('responsavel_id',v_driver,'veiculo_id',v_vehicle));
  if not has_function_privilege('anon','public.buscar_historico_com_autor(text,text,integer,integer,text)','EXECUTE')
    or has_function_privilege('authenticated','public.buscar_historico_com_autor(text,text,integer,integer,text)','EXECUTE')
    or has_table_privilege('anon','public.usuarios','SELECT') then
    raise exception 'Permissoes incorretas';
  end if;
  set local role anon;
  perform public.salvar_registro(v_token,v_reg,v_today,v_contract,v_teams);
  perform public.salvar_manutencao(v_token,v_maint,v_today,v_type,null,v_contract,v_vehicle,10,'Teste de autoria');
  if (select count(*) from public.buscar_historico_com_autor(v_token)
    where id in(v_reg,v_maint) and autor_nome='Maria Eduarda')<>2 then
    raise exception 'Nome composto ausente ou substituido pelo login/sobrenome/motorista';
  end if;
  if exists(select 1 from public.buscar_historico_com_autor(v_other_token) where id in(v_reg,v_maint)) then
    raise exception 'Envio exposto a outro funcionario';
  end if;
  begin
    perform * from public.buscar_historico_com_autor(null);
    raise exception 'Consulta sem sessao aceita' using errcode='XX000';
  exception when invalid_authorization_specification then null; end;
  -- Compara o conteudo antigo, os filtros e a pagina, removendo apenas o campo novo.
  select jsonb_agg(to_jsonb(h) order by h.created_at desc,h.id desc) into v_old
    from public.buscar_historico(v_token,'',1,1,'todos') h;
  select jsonb_agg(to_jsonb(h)-'autor_nome' order by h.created_at desc,h.id desc) into v_new
    from public.buscar_historico_com_autor(v_token,'',1,1,'todos') h;
  if v_old is distinct from v_new then raise exception 'Conteudo ou pagina alterados'; end if;
  if (select count(*) from public.buscar_historico_com_autor(v_token,'',21,0,'registro'))<>1
    or (select count(*) from public.buscar_historico_com_autor(v_token,'',21,0,'manutencao'))<>1
    or exists(select 1 from public.buscar_historico_com_autor(v_token,v_login)) then
    raise exception 'Filtro alterado';
  end if;
  -- O administrador altera ambos; o nome continua pertencendo ao criador.
  perform public.editar_registro(v_admin_token,v_reg,v_today-1,v_contract,v_teams,1);
  perform public.editar_manutencao(v_admin_token,v_maint,v_today,v_type,null,v_contract,v_vehicle,20,1,'Editado pelo admin');
  if (select count(*) from public.buscar_historico_com_autor(v_admin_token,'',101)
    where id in(v_reg,v_maint) and autor_nome='Maria Eduarda')<>2 then
    raise exception 'Edicao trocou autor pelo administrador';
  end if;
  reset role;
  -- O nome exibido acompanha a celula nome da mesma conta, inclusive se inativa.
  update public.usuarios set nome='Maria Eduarda Cristina',ativo=false where id=v_user;
  set local role anon;
  if (select count(*) from public.buscar_historico_com_autor(v_admin_token,'',101)
    where id in(v_reg,v_maint) and autor_nome='Maria Eduarda Cristina')<>2 then
    raise exception 'Nome atual ou autor inativo nao preservado';
  end if;
  reset role;
end $$;
rollback;
select 'OK: autor original, nome composto, dois tipos, edicao, filtros, pagina, permissoes e contrato antigo; rollback concluido' as resultado;
