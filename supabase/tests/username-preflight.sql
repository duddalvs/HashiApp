select
  (select jsonb_agg(jsonb_build_object('id',u.id,'login',u.login,'perfil',u.perfil,'ativo',u.ativo,
    'senha_compativel',a.encrypted_password ~ '^\$2[aby]\$',
    'registros',(select count(*) from public.registros_frota r where r.usuario_id=u.id),
    'manutencoes',(select count(*) from public.manutencoes m where m.usuario_id=u.id)))
   from public.usuarios u left join auth.users a on a.id=u.id) as usuarios,
  (select count(*) from auth.users) as contas_auth,
  (select n.nspname from pg_extension e join pg_namespace n on n.oid=e.extnamespace where e.extname='pgcrypto') as schema_crypto;
