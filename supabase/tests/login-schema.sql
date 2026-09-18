select
  (select jsonb_agg(jsonb_build_object('coluna',column_name,'aceita_null',is_nullable) order by ordinal_position)
   from information_schema.columns where table_schema='public' and table_name='usuarios') as colunas,
  (select jsonb_agg(jsonb_build_object('login',u.login,'perfil',u.perfil,'ativo',u.ativo,
    'registros',(select count(*) from public.registros_frota r where r.usuario_id=u.id),
    'manutencoes',(select count(*) from public.manutencoes m where m.usuario_id=u.id)) order by u.login)
   from public.usuarios u) as usuarios,
  to_regprocedure('public.cadastrar_usuario(text,text,text,text,text)') is not null as cadastro_sql_instalado,
  (select count(*) from auth.users) as contas_auth,
  (select count(*) from information_schema.columns where table_schema in ('public','private') and column_name='email') as colunas_email,
  (select count(*) from private.credenciais) as credenciais_protegidas;
