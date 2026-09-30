-- Executavel no PGlite e no Supabase; dados temporarios integralmente desfeitos.
begin;
do $$
declare
  v_login text:='note_'||substr(replace(gen_random_uuid()::text,'-',''),1,16);
  v_password text:=encode(extensions.gen_random_bytes(24),'hex');
  v_user uuid; v_other uuid; v_admin uuid; v_token text; v_other_token text; v_admin_token text;
  v_id uuid:=gen_random_uuid(); v_old_id uuid:=gen_random_uuid();
  v_today date:=(statement_timestamp() at time zone 'America/Sao_Paulo')::date;
  v_contract bigint; v_vehicle bigint; v_type bigint; v_entry jsonb; v_created timestamptz;
begin
  v_user:=public.cadastrar_usuario(v_login,v_password,'funcionario','Teste','Observacao');
  v_other:=public.cadastrar_usuario(v_login||'_o',v_password,'funcionario','Outro','Teste');
  v_admin:=public.cadastrar_usuario(v_login||'_a',v_password,'admin','Admin','Teste');
  v_token:=public.autenticar_usuario(v_login,v_password)->>'token';
  v_other_token:=public.autenticar_usuario(v_login||'_o',v_password)->>'token';
  v_admin_token:=public.autenticar_usuario(v_login||'_a',v_password)->>'token';
  select id into strict v_contract from public.contratos where ativo order by id limit 1;
  select id into strict v_vehicle from public.veiculos where ativo order by id limit 1;
  select id into strict v_type from public.tipos_manutencao where ativo order by id limit 1;
  if has_table_privilege('anon','public.manutencoes','UPDATE')
    or has_function_privilege('anon','private.obter_envio(uuid,text)','EXECUTE')
    or has_function_privilege('authenticated','public.editar_manutencao(text,uuid,date,bigint,bigint,bigint,bigint,numeric,integer,text)','EXECUTE') then
    raise exception 'Permissao indevida';
  end if;
  set local role anon;
  -- Cliente antigo continua criando sem observacao.
  perform public.salvar_manutencao(v_token,v_old_id,v_today,v_type,null,v_contract,v_vehicle,10);
  v_entry:=public.obter_envio(v_token,v_old_id,'manutencao');
  if v_entry->>'note' is distinct from '' then raise exception 'Leitura do registro antigo'; end if;
  -- Limite exato, acentos e caracteres fora do BMP preservados.
  perform public.salvar_manutencao(v_token,v_id,v_today,v_type,null,v_contract,v_vehicle,10,repeat('🚚',40));
  perform public.salvar_manutencao(v_token,v_id,v_today,v_type,null,v_contract,v_vehicle,10,repeat('🚚',40));
  v_entry:=public.obter_envio(v_token,v_id,'manutencao');
  if v_entry->>'note' is distinct from repeat('🚚',40) or (v_entry->>'version')::integer<>1 then
    raise exception 'Limite exato ou idempotencia na criacao';
  end if;
  begin
    perform public.salvar_manutencao(v_token,v_id,v_today,v_type,null,v_contract,v_vehicle,10,'Outra');
    raise exception 'Duplicidade com observacao diferente aceita' using errcode='XX000';
  exception when unique_violation then null; end;
  begin
    perform public.salvar_manutencao(v_token,gen_random_uuid(),v_today,v_type,null,v_contract,v_vehicle,10,repeat('á',41));
    raise exception '41 caracteres aceitos na criacao' using errcode='XX000';
  exception when string_data_right_truncation then null; end;
  begin
    perform public.editar_manutencao(v_token,v_id,v_today,v_type,null,v_contract,v_vehicle,10,1,repeat('🚚',41));
    raise exception '41 caracteres aceitos na edicao' using errcode='XX000';
  exception when string_data_right_truncation then null; end;
  begin
    perform public.salvar_manutencao(null,gen_random_uuid(),v_today,v_type,null,v_contract,v_vehicle,10,'Sem sessao');
    raise exception 'Gravacao sem sessao aceita' using errcode='XX000';
  exception when invalid_authorization_specification then null; end;
  if public.obter_envio(v_other_token,v_id,'manutencao') is not null
    or exists(select 1 from public.buscar_historico(v_other_token) where id=v_id) then
    raise exception 'Observacao vazou para outro funcionario';
  end if;
  begin
    perform public.editar_manutencao(v_other_token,v_id,v_today,v_type,null,v_contract,v_vehicle,10,1,'Outro');
    raise exception 'Outro funcionario editou' using errcode='XX000';
  exception when insufficient_privilege then null; end;
  -- Alteracao somente da observacao, seguida de repeticao segura.
  perform public.editar_manutencao(v_token,v_id,v_today,v_type,null,v_contract,v_vehicle,10,1,'  Troca de óleo  ');
  perform public.editar_manutencao(v_token,v_id,v_today,v_type,null,v_contract,v_vehicle,10,1,'Troca de óleo');
  v_entry:=public.obter_envio(v_token,v_id,'manutencao');
  if v_entry->>'note' is distinct from 'Troca de óleo' or (v_entry->>'version')::integer<>2 then
    raise exception 'Edicao isolada nao incrementou uma unica versao';
  end if;
  begin
    perform public.editar_manutencao(v_token,v_id,v_today,v_type,null,v_contract,v_vehicle,10,1,'Conflito');
    raise exception 'Versao antiga aceita na observacao' using errcode='XX000';
  exception when serialization_failure then null; end;
  reset role;
  select created_at into v_created from public.manutencoes where id=v_id;
  set local role anon;
  -- APK antigo pode editar custo sem apagar uma observacao que ele nao conhece.
  perform public.editar_manutencao(v_token,v_id,v_today,v_type,null,v_contract,v_vehicle,20,2);
  v_entry:=public.obter_envio(v_token,v_id,'manutencao');
  if v_entry->>'note' is distinct from 'Troca de óleo' or (v_entry->>'version')::integer<>3 then
    raise exception 'Cliente antigo apagou observacao';
  end if;
  perform public.editar_manutencao(v_admin_token,v_id,v_today,v_type,null,v_contract,v_vehicle,30,3,'Revisão concluída');
  v_entry:=public.obter_envio(v_token,v_id,'manutencao');
  if (v_entry->>'version')::integer<>4 then raise exception 'Edicao de ambos incrementou errado'; end if;
  if not exists(select 1 from public.buscar_historico(v_token,'',101,0,'manutencao')
    where id=v_id and detalhes->0->>'observacao'='Revisão concluída') then
    raise exception 'Observacao ausente do historico';
  end if;
  perform public.editar_manutencao(v_token,v_id,v_today,v_type,null,v_contract,v_vehicle,30,4,'   ');
  v_entry:=public.obter_envio(v_token,v_id,'manutencao');
  if v_entry->>'note' is distinct from '' or (v_entry->>'version')::integer<>5 then raise exception 'Limpeza incorreta'; end if;
  reset role;
  if not exists(select 1 from public.manutencoes where id=v_id and observacao is null
    and usuario_id=v_user and created_at=v_created and versao=5) then raise exception 'Autoria/hora/null alterados'; end if;
  begin
    update public.manutencoes set observacao=repeat('a',41) where id=v_id;
    raise exception 'Constraint aceita 41 caracteres' using errcode='XX000';
  exception when check_violation then null; end;
end $$;
rollback;
select 'OK: observacao opcional, 40 caracteres, leitura, historico, edicao, versao, permissoes e APK antigo; rollback concluido' as resultado;
