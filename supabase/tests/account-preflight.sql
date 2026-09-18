select u.id,u.login,u.perfil,u.ativo,
 (select count(*) from public.registros_frota r where r.usuario_id=u.id) as registros,
 (select count(*) from public.manutencoes m where m.usuario_id=u.id) as manutencoes
from public.usuarios u where u.login in ('user_admin','user_pessoa1');
