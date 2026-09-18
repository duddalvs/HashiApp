-- Valida cadastro e sessoes reais no PostgreSQL; tudo e desfeito por rollback.
begin;
do $$
declare
  v_login text:='teste_'||substr(replace(gen_random_uuid()::text,'-',''),1,16);
  v_senha text:=encode(extensions.gen_random_bytes(24),'hex');
  v_id uuid;
  v_admin uuid;
  v_token text;
  v_admin_token text;
  v_session jsonb;
  v_reg uuid:=gen_random_uuid();
  v_manut uuid:=gen_random_uuid();
  v_teams jsonb;
  v_auth_count bigint;
begin
  select count(*) into v_auth_count from auth.users;
  v_id:=public.cadastrar_usuario(v_login,v_senha,'funcionario','Teste','Temporario');
  v_admin:=public.cadastrar_usuario(v_login||'_adm',v_senha,'admin','Admin','Temporario');
  v_session:=public.autenticar_usuario(v_login,v_senha);
  v_token:=v_session->>'token';
  v_admin_token:=public.autenticar_usuario(v_login||'_adm',v_senha)->>'token';
  if v_token is null or v_admin_token is null or (v_session->'profile'->>'id')::uuid<>v_id then raise exception 'Falha no cadastro/login'; end if;
  if v_session->'profile'->>'nome'<>'Teste' or v_session->'profile'->>'sobrenome'<>'Temporario'
    or public.meu_perfil(v_token)->>'sobrenome'<>'Temporario' then raise exception 'Nome/sobrenome ausentes no perfil'; end if;
  if (select count(*) from auth.users)<>v_auth_count then raise exception 'Cadastro criou relacao com Auth'; end if;
  if exists(select 1 from private.credenciais where usuario_id=v_id and senha_hash=v_senha) then raise exception 'Senha sem hash'; end if;
  if has_function_privilege('anon','public.cadastrar_usuario(text,text,text,text,text)','EXECUTE')
    or has_function_privilege('authenticated','public.definir_senha_usuario(text,text)','EXECUTE')
    or has_schema_privilege('anon','private','USAGE') then raise exception 'Permissoes excessivas'; end if;
  v_teams:=jsonb_build_array(jsonb_build_object('responsavel_id',2,'veiculo_id',2));
  perform public.salvar_registro(v_token,v_reg,current_date,1,v_teams);
  perform public.salvar_registro(v_token,v_reg,current_date,1,v_teams);
  perform public.salvar_manutencao(v_admin_token,v_manut,current_date,1,2,1,2,480);
  if public.obter_envio(v_token,v_manut,'manutencao') is not null then raise exception 'Funcionario acessou envio alheio'; end if;
  if (select count(*) from public.buscar_historico(v_token))<>1 then raise exception 'Falha no isolamento'; end if;
  begin
    perform public.apagar_envio(v_token,v_reg,'registro');
    raise exception 'Funcionario conseguiu excluir';
  exception when insufficient_privilege then null; end;
  perform public.editar_registro(v_token,v_reg,current_date-1,1,v_teams,1);
  perform public.apagar_envio(v_admin_token,v_reg,'registro');
  if exists(select 1 from public.registro_equipes where registro_frota_id=v_reg) then raise exception 'Falha na cascata'; end if;
  perform public.definir_senha_usuario(v_login,v_senha||'X');
  begin
    perform public.meu_perfil(v_token);
    raise exception 'Sessao anterior sobreviveu a troca da senha';
  exception when invalid_authorization_specification then null; end;
  if public.autenticar_usuario(v_login,v_senha)->>'error' is null then raise exception 'Senha anterior ainda aceita'; end if;
  if public.autenticar_usuario(v_login,v_senha||'X')->>'token' is null then raise exception 'Nova senha recusada'; end if;
end;
$$;
rollback;
select 'OK: cadastro por usuario sem Auth, login, hash, permissoes, isolamento, cascata e troca de senha; tudo desfeito' as resultado;
