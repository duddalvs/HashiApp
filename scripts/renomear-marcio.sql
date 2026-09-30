-- Alteracao administrativa pontual autorizada em 21/09/2026.
-- O bloqueio de login continua ativo apos a transacao; nao altera senhas.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '20s';
lock table public.usuarios in access exclusive mode;
do $$
declare
  v_id constant uuid := '5072f7f5-a250-4183-8ec8-47f62c535e9f';
  v_before public.usuarios;
  v_after public.usuarios;
  v_credential_before private.credenciais;
  v_credential_after private.credenciais;
  v_registros bigint;
  v_manutencoes bigint;
begin
  select * into strict v_before from public.usuarios where id=v_id;
  if v_before.login <> 'user_mario' then
    raise exception 'Conta de origem diferente da esperada. Nenhuma alteracao realizada.';
  end if;
  if exists(select 1 from public.usuarios where login='user_marcio') then
    raise exception 'Login de destino ja existe. Nenhuma alteracao realizada.';
  end if;
  if not exists(select 1 from pg_trigger where tgrelid='public.usuarios'::regclass
      and tgname='preservar_login' and tgenabled='O') then
    raise exception 'Estado inesperado da protecao de login. Operacao cancelada.';
  end if;
  select * into strict v_credential_before from private.credenciais where usuario_id=v_id for update;
  select count(*) into v_registros from public.registros_frota where usuario_id=v_id;
  select count(*) into v_manutencoes from public.manutencoes where usuario_id=v_id;

  -- ACCESS EXCLUSIVE impede outras escritas enquanto esta excecao esta ativa.
  -- Erro em qualquer etapa desfaz tambem a alteracao do trigger.
  alter table public.usuarios disable trigger preservar_login;
  update public.usuarios set login='user_marcio' where id=v_id and login='user_mario';
  if not found then raise exception 'Conta nao atualizada'; end if;
  alter table public.usuarios enable trigger preservar_login;

  select * into strict v_after from public.usuarios where id=v_id;
  select * into strict v_credential_after from private.credenciais where usuario_id=v_id;
  if v_after.login <> 'user_marcio'
     or (to_jsonb(v_before)-'login') is distinct from (to_jsonb(v_after)-'login')
     or v_credential_before is distinct from v_credential_after
     or v_registros <> (select count(*) from public.registros_frota where usuario_id=v_id)
     or v_manutencoes <> (select count(*) from public.manutencoes where usuario_id=v_id)
     or not exists(select 1 from pg_trigger where tgrelid='public.usuarios'::regclass
       and tgname='preservar_login' and tgenabled='O') then
    raise exception 'Verificacao de preservacao falhou. Transacao cancelada.';
  end if;
end $$;
commit;
select u.id,u.login,u.nome,u.sobrenome,u.perfil,u.ativo,c.updated_at as senha_atualizada_em,
  (select count(*) from public.registros_frota where usuario_id=u.id) registros,
  (select count(*) from public.manutencoes where usuario_id=u.id) manutencoes,
  (select tgenabled from pg_trigger where tgrelid='public.usuarios'::regclass and tgname='preservar_login') protecao_login
from public.usuarios u join private.credenciais c on c.usuario_id=u.id
where u.id='5072f7f5-a250-4183-8ec8-47f62c535e9f';
