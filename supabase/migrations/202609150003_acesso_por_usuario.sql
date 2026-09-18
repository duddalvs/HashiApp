begin;
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;
revoke all on schema private from public,anon,authenticated;

create table private.credenciais (
  usuario_id uuid primary key references public.usuarios(id) on delete cascade,
  senha_hash text not null,
  updated_at timestamptz not null default now()
);
create table private.sessoes (
  token_hash bytea primary key,
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index sessoes_usuario on private.sessoes(usuario_id,created_at desc);
create index sessoes_expiracao on private.sessoes(expires_at);
-- Buckets fixos limitam tentativas inclusive para logins inexistentes sem crescimento ilimitado.
create table private.tentativas_login (
  bucket integer primary key,
  falhas integer not null default 0,
  inicio timestamptz not null default now()
);
insert into private.tentativas_login(bucket) select generate_series(0,1023);
create table private.config_login (id boolean primary key default true check(id), hash_ficticio text not null);
insert into private.config_login(hash_ficticio)
values(extensions.crypt(encode(extensions.gen_random_bytes(32),'hex'),extensions.gen_salt('bf',12)));
alter table private.credenciais enable row level security;
alter table private.sessoes enable row level security;
alter table private.tentativas_login enable row level security;
alter table private.config_login enable row level security;
revoke all on all tables in schema private from public,anon,authenticated,service_role;

-- Migra hashes dentro do servidor, sem revelar ou redefinir as senhas.
insert into private.credenciais(usuario_id,senha_hash)
select u.id,a.encrypted_password from public.usuarios u join auth.users a on a.id=u.id
where a.encrypted_password ~ '^\$2[aby]\$';
do $$ begin
  if exists(select 1 from public.usuarios u where not exists(select 1 from private.credenciais c where c.usuario_id=u.id)) then
    raise exception 'Ha contas sem senha compativel. Migracao cancelada sem remover contas.';
  end if;
end $$;
alter table public.usuarios drop constraint usuarios_id_fkey;
alter table public.usuarios alter column id set default gen_random_uuid();
drop trigger ao_criar_usuario on auth.users;
drop function public.criar_perfil();
-- Remove somente as antigas contas Auth correspondentes aos perfis migrados.
delete from auth.users a using public.usuarios u where a.id=u.id;

create function private.usuario_id() returns uuid language sql stable set search_path='' as $$
  select nullif(current_setting('hashi.usuario_id',true),'')::uuid;
$$;
create or replace function public.usuario_ativo() returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.usuarios where id=private.usuario_id() and ativo);
$$;
create or replace function public.e_admin() returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.usuarios where id=private.usuario_id() and ativo and perfil='admin');
$$;

create function private.validar_sessao(p_token text) returns uuid
language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
  if p_token is null or p_token !~ '^[a-f0-9]{64}$' then
    raise exception 'Sessão expirada. Entre novamente.' using errcode='28000';
  end if;
  select s.usuario_id into v_id from private.sessoes s join public.usuarios u on u.id=s.usuario_id
  where s.token_hash=extensions.digest(p_token,'sha256') and s.expires_at>now() and u.ativo;
  if v_id is null then raise exception 'Sessão expirada. Entre novamente.' using errcode='28000'; end if;
  perform set_config('hashi.usuario_id',v_id::text,true);
  return v_id;
end;
$$;

create function public.autenticar_usuario(p_usuario text,p_senha text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
  v_login text:=lower(btrim(coalesce(p_usuario,'')));
  v_bucket integer;
  v_limite private.tentativas_login;
  v_user public.usuarios;
  v_hash text;
  v_ok boolean;
  v_token text;
  v_expira timestamptz:=now()+interval '7 days';
begin
  if length(v_login)>40 or p_senha is null or octet_length(p_senha)>72 or length(p_senha)<1 then
    return jsonb_build_object('error','Usuário ou senha incorretos.');
  end if;
  v_bucket:=((hashtextextended(v_login,0) & 2147483647) % 1024)::integer;
  select * into v_limite from private.tentativas_login where bucket=v_bucket for update;
  if v_limite.inicio<=now()-interval '15 minutes' then
    update private.tentativas_login set falhas=0,inicio=now() where bucket=v_bucket;
    v_limite.falhas:=0;
  end if;
  if v_limite.falhas>=10 then
    return jsonb_build_object('error','Muitas tentativas. Aguarde 15 minutos e tente novamente.');
  end if;
  select * into v_user from public.usuarios where login=v_login for share;
  select senha_hash into v_hash from private.credenciais where usuario_id=v_user.id;
  if v_hash is null then select hash_ficticio into v_hash from private.config_login; end if;
  v_ok:=extensions.crypt(p_senha,v_hash)=v_hash;
  if not coalesce(v_ok and v_user.ativo,false) then
    update private.tentativas_login set falhas=falhas+1 where bucket=v_bucket;
    -- Retorna erro como dado: uma excecao desfaria a contagem de tentativas.
    return jsonb_build_object('error','Usuário ou senha incorretos.');
  end if;
  update private.tentativas_login set falhas=0,inicio=now() where bucket=v_bucket;
  delete from private.sessoes where expires_at<=now();
  delete from private.sessoes where token_hash in (
    select token_hash from private.sessoes where usuario_id=v_user.id order by created_at desc offset 9
  );
  v_token:=encode(extensions.gen_random_bytes(32),'hex');
  insert into private.sessoes(token_hash,usuario_id,expires_at)
  values(extensions.digest(v_token,'sha256'),v_user.id,v_expira);
  return jsonb_build_object('token',v_token,'expiresAt',v_expira,'user',jsonb_build_object('id',v_user.id),'profile',to_jsonb(v_user));
end;
$$;

create function public.encerrar_sessao(p_token text) returns void
language sql security definer set search_path='' as $$
  delete from private.sessoes where token_hash=extensions.digest(p_token,'sha256');
$$;
create function private.revogar_ao_desativar() returns trigger
language plpgsql security definer set search_path='' as $$ begin
  if not new.ativo then delete from private.sessoes where usuario_id=new.id; end if;
  return new;
end $$;
create trigger revogar_sessoes after update of ativo on public.usuarios
for each row execute function private.revogar_ao_desativar();
create function public.meu_perfil(p_token text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_id uuid:=private.validar_sessao(p_token);
begin return (select to_jsonb(u) from public.usuarios u where id=v_id); end;
$$;
create function public.listar_catalogos(p_token text) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
  perform private.validar_sessao(p_token);
  return jsonb_build_object(
    'employees',(select coalesce(jsonb_agg(f order by nome),'[]') from public.funcionarios f where ativo and not is_status),
    'vehicles',(select coalesce(jsonb_agg(v order by placa),'[]') from public.veiculos v where ativo),
    'contracts',(select coalesce(jsonb_agg(c order by nome),'[]') from public.contratos c where ativo),
    'maintenanceTypes',(select coalesce(jsonb_agg(t order by id),'[]') from public.tipos_manutencao t where ativo));
end;
$$;

-- Cadastro administrativo transacional: nenhum e-mail ou chave administrativa externa.
create function public.cadastrar_usuario(p_usuario text,p_senha text,p_perfil text default 'funcionario',p_nome text default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_login text:=lower(btrim(p_usuario)); v_id uuid;
begin
  if v_login is null or v_login !~ '^[a-z][a-z0-9_]{2,39}$' then raise exception 'Usuário inválido: use de 3 a 40 letras, números ou _, começando por letra.'; end if;
  if p_senha is null or length(p_senha)<12 or octet_length(p_senha)>72 then raise exception 'Use uma senha de pelo menos 12 caracteres e no máximo 72 bytes.'; end if;
  if p_perfil is null or p_perfil not in ('funcionario','admin') then raise exception 'Perfil inválido: funcionario ou admin.'; end if;
  if exists(select 1 from public.usuarios where login=v_login) then raise exception 'Esse usuário já existe. Nenhuma senha foi alterada.'; end if;
  insert into public.usuarios(login,nome,perfil,ativo) values(v_login,coalesce(nullif(btrim(p_nome),''),v_login),p_perfil,true) returning id into v_id;
  insert into private.credenciais(usuario_id,senha_hash) values(v_id,extensions.crypt(p_senha,extensions.gen_salt('bf',12)));
  return v_id;
end;
$$;
create function public.definir_senha_usuario(p_usuario text,p_senha text) returns void
language plpgsql security definer set search_path='' as $$
declare v_id uuid; v_bucket integer;
begin
  if p_senha is null or length(p_senha)<12 or octet_length(p_senha)>72 then raise exception 'Use uma senha de pelo menos 12 caracteres e no máximo 72 bytes.'; end if;
  v_bucket:=((hashtextextended(lower(btrim(p_usuario)),0) & 2147483647) % 1024)::integer;
  perform 1 from private.tentativas_login where bucket=v_bucket for update;
  select id into v_id from public.usuarios where login=lower(btrim(p_usuario)) for update;
  if v_id is null then raise exception 'Usuário não encontrado.'; end if;
  insert into private.credenciais(usuario_id,senha_hash) values(v_id,extensions.crypt(p_senha,extensions.gen_salt('bf',12)))
  on conflict(usuario_id) do update set senha_hash=excluded.senha_hash,updated_at=now();
  delete from private.sessoes where usuario_id=v_id;
  update private.tentativas_login set falhas=0,inicio=now() where bucket=v_bucket;
end;
$$;

-- Reutiliza regras transacionais existentes, mas sem depender de auth.uid/JWT.
alter function public.salvar_registro(uuid,date,bigint,jsonb) set schema private;
alter function public.salvar_manutencao(uuid,date,bigint,bigint,bigint,bigint,numeric) set schema private;
alter function public.editar_registro(uuid,date,bigint,jsonb,integer) set schema private;
alter function public.editar_manutencao(uuid,date,bigint,bigint,bigint,bigint,numeric,integer) set schema private;
alter function public.apagar_envio(uuid,text) set schema private;
alter function public.obter_envio(uuid,text) set schema private;
alter function public.buscar_historico(text,integer,integer,text) set schema private;
do $$ declare f record; begin
  for f in select p.oid from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='private' and p.proname in ('salvar_registro','salvar_manutencao','editar_registro','editar_manutencao')
  loop execute replace(pg_get_functiondef(f.oid),'auth.uid()','private.usuario_id()'); end loop;
end $$;

create function public.salvar_registro(p_token text,p_id uuid,p_data date,p_contrato_id bigint,p_equipes jsonb) returns uuid
language plpgsql security definer set search_path='' as $$ begin
  perform private.validar_sessao(p_token); return private.salvar_registro(p_id,p_data,p_contrato_id,p_equipes); end $$;
create function public.salvar_manutencao(p_token text,p_id uuid,p_data date,p_tipo_id bigint,p_motorista_id bigint,p_contrato_id bigint,p_veiculo_id bigint,p_custo numeric) returns uuid
language plpgsql security definer set search_path='' as $$ begin
  perform private.validar_sessao(p_token); return private.salvar_manutencao(p_id,p_data,p_tipo_id,p_motorista_id,p_contrato_id,p_veiculo_id,p_custo); end $$;
create function public.editar_registro(p_token text,p_id uuid,p_data date,p_contrato_id bigint,p_equipes jsonb,p_versao integer) returns uuid
language plpgsql security definer set search_path='' as $$ begin
  perform private.validar_sessao(p_token); return private.editar_registro(p_id,p_data,p_contrato_id,p_equipes,p_versao); end $$;
create function public.editar_manutencao(p_token text,p_id uuid,p_data date,p_tipo_id bigint,p_motorista_id bigint,p_contrato_id bigint,p_veiculo_id bigint,p_custo numeric,p_versao integer) returns uuid
language plpgsql security definer set search_path='' as $$ begin
  perform private.validar_sessao(p_token); return private.editar_manutencao(p_id,p_data,p_tipo_id,p_motorista_id,p_contrato_id,p_veiculo_id,p_custo,p_versao); end $$;
create function public.apagar_envio(p_token text,p_id uuid,p_tipo text) returns void
language plpgsql security definer set search_path='' as $$ begin
  perform private.validar_sessao(p_token); perform private.apagar_envio(p_id,p_tipo); end $$;
create function public.obter_envio(p_token text,p_id uuid,p_tipo text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=private.validar_sessao(p_token);
begin
  if (p_tipo='registro' and exists(select 1 from public.registros_frota where id=p_id and (usuario_id=v_uid or public.e_admin())))
    or (p_tipo='manutencao' and exists(select 1 from public.manutencoes where id=p_id and (usuario_id=v_uid or public.e_admin()))) then
    return private.obter_envio(p_id,p_tipo);
  end if;
  return null;
end $$;
create function public.buscar_historico(p_token text,p_busca text default '',p_limite integer default 21,p_offset integer default 0,p_tipo text default 'todos')
returns table(id uuid,tipo text,data date,contrato text,placas text[],detalhes jsonb,custo numeric,created_at timestamptz)
language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=private.validar_sessao(p_token); v_admin boolean:=public.e_admin();
begin
  return query
  with historico as (
    select r.id,'registro'::text as tipo,r.data,c.nome as contrato,array_agg(v.placa order by e.numero_equipe) as placas,
      jsonb_agg(jsonb_build_object('equipe',e.numero_equipe,'responsavel',f.nome,'placa',v.placa,'modelo',v.modelo) order by e.numero_equipe) as detalhes,
      null::numeric as custo,r.created_at
    from public.registros_frota r join public.contratos c on c.id=r.contrato_id
    join public.registro_equipes e on e.registro_frota_id=r.id join public.veiculos v on v.id=e.veiculo_id join public.funcionarios f on f.id=e.responsavel_id
    where r.usuario_id=v_uid or v_admin group by r.id,c.nome
    union all
    select m.id,'manutencao',m.data,c.nome,array[v.placa],jsonb_build_array(jsonb_build_object('servico',t.nome,'responsavel',f.nome,'placa',v.placa,'modelo',v.modelo)),m.custo,m.created_at
    from public.manutencoes m join public.contratos c on c.id=m.contrato_id join public.veiculos v on v.id=m.veiculo_id
    join public.funcionarios f on f.id=m.motorista_id join public.tipos_manutencao t on t.id=m.tipo_manutencao_id
    where m.usuario_id=v_uid or v_admin
  ) select h.* from historico h where (p_tipo='todos' or h.tipo=p_tipo)
    and position(public.normalizar(trim(p_busca)) in public.normalizar(h.contrato||' '||array_to_string(h.placas,' ')))>0
  order by h.created_at desc,h.id desc limit greatest(1,least(coalesce(p_limite,21),101)) offset greatest(0,coalesce(p_offset,0));
end $$;

-- Nenhuma tabela ou rotina interna pode ser acessada com a chave publica ou JWT antigo.
revoke all on public.usuarios,public.funcionarios,public.veiculos,public.contratos,public.tipos_manutencao,
  public.registros_frota,public.registro_equipes,public.manutencoes from public,anon,authenticated;
revoke all on all sequences in schema public from anon,authenticated;
revoke all on all functions in schema private from public,anon,authenticated,service_role;
revoke all on function public.usuario_ativo(),public.e_admin(),public.normalizar(text),
  public.cadastrar_usuario(text,text,text,text),public.definir_senha_usuario(text,text) from public,anon,authenticated,service_role;
grant execute on function public.cadastrar_usuario(text,text,text,text),public.definir_senha_usuario(text,text) to postgres;
revoke all on function public.autenticar_usuario(text,text),public.encerrar_sessao(text),public.meu_perfil(text),public.listar_catalogos(text),
  public.salvar_registro(text,uuid,date,bigint,jsonb),public.salvar_manutencao(text,uuid,date,bigint,bigint,bigint,bigint,numeric),
  public.editar_registro(text,uuid,date,bigint,jsonb,integer),public.editar_manutencao(text,uuid,date,bigint,bigint,bigint,bigint,numeric,integer),
  public.apagar_envio(text,uuid,text),public.obter_envio(text,uuid,text),public.buscar_historico(text,text,integer,integer,text) from public,authenticated;
grant execute on function public.autenticar_usuario(text,text),public.encerrar_sessao(text),public.meu_perfil(text),public.listar_catalogos(text),
  public.salvar_registro(text,uuid,date,bigint,jsonb),public.salvar_manutencao(text,uuid,date,bigint,bigint,bigint,bigint,numeric),
  public.editar_registro(text,uuid,date,bigint,jsonb,integer),public.editar_manutencao(text,uuid,date,bigint,bigint,bigint,bigint,numeric,integer),
  public.apagar_envio(text,uuid,text),public.obter_envio(text,uuid,text),public.buscar_historico(text,text,integer,integer,text) to anon;
commit;
