-- Diagnostico transacional: somente conta aleatoria; todas as mudancas sofrem rollback.
-- As idades sao simuladas nos timestamps. Nao representa uma espera real de dias.
begin;
set local statement_timeout = '30s';
do $$
declare
  v_login text := 'persist_' || substr(replace(gen_random_uuid()::text,'-',''),1,16);
  v_initial text := encode(extensions.gen_random_bytes(24),'hex');
  v_sql_password text := encode(extensions.gen_random_bytes(24),'hex');
  v_app_password text := encode(extensions.gen_random_bytes(24),'hex');
  v_id uuid;
  v_code text;
  v_authorization text;
  v_session text;
  v_hash text;
begin
  v_id := public.cadastrar_usuario(v_login,v_initial,'funcionario','Teste','Persistencia');
  perform public.definir_senha_usuario(v_login,v_sql_password);
  v_code := public.gerar_codigo_recuperacao(v_login);
  v_session := public.autenticar_usuario(v_login,v_sql_password)->>'token';
  if v_session is null then raise exception 'Gerar codigo alterou a senha atual'; end if;
  v_authorization := public.validar_codigo_recuperacao(v_login,v_code)->>'token';
  if v_authorization is null then raise exception 'Codigo valido recusado'; end if;
  if public.recuperar_senha(v_authorization,v_app_password)->>'success' is distinct from 'true' then
    raise exception 'Troca pelo fluxo do aplicativo falhou';
  end if;
  begin
    perform public.meu_perfil(v_session);
    raise exception 'Sessao anterior a troca foi preservada';
  exception when invalid_authorization_specification then null;
  end;
  if public.autenticar_usuario(v_login,v_sql_password)->>'error' is null then
    raise exception 'Senha anterior a recuperacao ainda aceita';
  end if;
  select senha_hash into strict v_hash from private.credenciais where usuario_id=v_id;
  update private.credenciais set updated_at=now()-interval '3 days' where usuario_id=v_id;
  v_session := public.autenticar_usuario(v_login,v_app_password)->>'token';
  if v_session is null then raise exception 'Senha recuperada recusada com idade simulada de tres dias'; end if;
  perform public.encerrar_sessao(v_session);
  v_session := public.autenticar_usuario(v_login,v_app_password)->>'token';
  if v_session is null then raise exception 'Senha recusada apos logout e novo login'; end if;
  update private.credenciais set updated_at=now()-interval '30 days' where usuario_id=v_id;
  update private.sessoes set created_at=now()-interval '8 days',expires_at=now()-interval '1 day'
    where usuario_id=v_id;
  begin
    perform public.meu_perfil(v_session);
    raise exception 'Sessao vencida aceita';
  exception when invalid_authorization_specification then null;
  end;
  v_session := public.autenticar_usuario(v_login,v_app_password)->>'token';
  if v_session is null then raise exception 'Senha recusada depois da expiracao de sessao'; end if;
  if (public.meu_perfil(v_session)->>'id')::uuid is distinct from v_id then
    raise exception 'Novo login nao retornou o perfil correto';
  end if;
  v_code := public.gerar_codigo_recuperacao(v_login);
  update private.recuperacoes_senha set expira_em=now()-interval '1 second' where usuario_id=v_id;
  if public.validar_codigo_recuperacao(v_login,v_code)->>'error' is null then
    raise exception 'Codigo expirado aceito';
  end if;
  if public.autenticar_usuario(v_login,v_app_password)->>'token' is null then
    raise exception 'Expiracao do codigo afetou a senha atual';
  end if;
  if (select senha_hash from private.credenciais where usuario_id=v_id) is distinct from v_hash then
    raise exception 'Hash foi alterado sem nova redefinicao';
  end if;
end $$;
rollback;
select 'OK: troca SQL e recuperacao; login apos logout; idades simuladas de 3/30 dias; sessao/codigo expirados nao invalidam senha; rollback completo' as resultado;
