-- Ajuste solicitado em 16/09/2026. Preserva IDs, acessos, senhas e autoria dos envios.
begin;
do $$
begin
  perform 1 from public.usuarios
    where id in ('1520389d-6884-4ea3-a896-afd080443a98','921b8720-7b8c-4437-bcd4-6e00521a84e0')
    order by id for update;
  if not exists(select 1 from public.usuarios where id='1520389d-6884-4ea3-a896-afd080443a98' and login='user_admin' and perfil='admin')
    or not exists(select 1 from public.usuarios where id='921b8720-7b8c-4437-bcd4-6e00521a84e0' and login='user_pessoa1' and perfil='funcionario') then
    raise exception 'As contas esperadas foram alteradas. Nenhum perfil foi atualizado.';
  end if;
  update public.usuarios set nome='Lucas',sobrenome='Melgaço'
    where id='1520389d-6884-4ea3-a896-afd080443a98';
  update public.usuarios set nome='Maria Eduarda',sobrenome='Alves'
    where id='921b8720-7b8c-4437-bcd4-6e00521a84e0';
end $$;
commit;
select u.id,u.login,u.nome,u.sobrenome,u.perfil,u.ativo,
  (select count(*) from public.registros_frota r where r.usuario_id=u.id) registros,
  (select count(*) from public.manutencoes m where m.usuario_id=u.id) manutencoes
from public.usuarios u where login in ('user_admin','user_pessoa1') order by login;
