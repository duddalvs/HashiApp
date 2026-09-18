begin;
do $$
declare
  v_login text:='rec_'||substr(replace(gen_random_uuid()::text,'-',''),1,16);
  v_senha text:=encode(extensions.gen_random_bytes(24),'hex');
  v_id uuid; v_codigo text; v_token text; v_session text;
begin
  v_id:=public.cadastrar_usuario(v_login,v_senha,'funcionario','Teste','Recuperacao');
  v_session:=public.autenticar_usuario(v_login,v_senha)->>'token';
  if has_function_privilege('anon','public.gerar_codigo_recuperacao(text)','EXECUTE')
    or has_function_privilege('authenticated','public.gerar_codigo_recuperacao(text)','EXECUTE') then
    raise exception 'Geracao de codigo exposta ao aplicativo';
  end if;
  v_codigo:=public.gerar_codigo_recuperacao(v_login);
  if public.validar_codigo_recuperacao(v_login,'errado')->>'error' is null then raise exception 'Codigo incorreto aceito'; end if;
  v_token:=public.validar_codigo_recuperacao(v_login,v_codigo)->>'token';
  if v_token is null then raise exception 'Codigo valido recusado'; end if;
  if public.validar_codigo_recuperacao(v_login,v_codigo)->>'error' is null then raise exception 'Codigo reutilizado'; end if;
  if public.recuperar_senha(v_token,'curta')->>'error' is null then raise exception 'Senha curta aceita'; end if;
  if public.recuperar_senha(v_token,v_senha||'X')->>'success'<>'true' then raise exception 'Recuperacao falhou'; end if;
  if public.recuperar_senha(v_token,v_senha||'Y')->>'error' is null then raise exception 'Autorizacao reutilizada'; end if;
  if public.autenticar_usuario(v_login,v_senha)->>'error' is null then raise exception 'Senha antiga ainda funciona'; end if;
  if public.autenticar_usuario(v_login,v_senha||'X')->>'token' is null then raise exception 'Nova senha nao funciona'; end if;
  begin
    perform public.meu_perfil(v_session);
    raise exception 'Sessao antiga nao revogada';
  exception when invalid_authorization_specification then null; end;
  v_codigo:=public.gerar_codigo_recuperacao(v_login);
  update private.recuperacoes_senha set expira_em=now()-interval '1 second' where usuario_id=v_id;
  if public.validar_codigo_recuperacao(v_login,v_codigo)->>'error' is null then raise exception 'Codigo expirado aceito'; end if;
end $$;
rollback;
select 'OK: recuperacao, codigo unico/expirado, senha nova e sessoes revogadas; dados temporarios desfeitos' as resultado;
