begin;
create table private.recuperacoes_senha (
  usuario_id uuid primary key references public.usuarios(id) on delete cascade,
  codigo_hash bytea,
  expira_em timestamptz not null,
  tentativas integer not null default 0,
  token_hash bytea unique,
  token_expira_em timestamptz
);
alter table private.recuperacoes_senha enable row level security;
revoke all on private.recuperacoes_senha from public,anon,authenticated,service_role;

create function private.invalidar_recuperacao() returns trigger
language plpgsql security definer set search_path='' as $$ begin
  delete from private.recuperacoes_senha where usuario_id=new.usuario_id;
  return new;
end $$;
create trigger invalidar_codigo_ao_trocar_senha after insert or update of senha_hash on private.credenciais
for each row execute function private.invalidar_recuperacao();
create or replace function private.revogar_ao_desativar() returns trigger
language plpgsql security definer set search_path='' as $$ begin
  if not new.ativo then
    delete from private.sessoes where usuario_id=new.id;
    delete from private.recuperacoes_senha where usuario_id=new.id;
  end if;
  return new;
end $$;

-- Somente o administrador do banco gera o codigo, depois de conferir a identidade.
create function public.gerar_codigo_recuperacao(p_usuario text) returns text
language plpgsql security definer set search_path='' as $$
declare v_id uuid; v_codigo text;
begin
  select id into v_id from public.usuarios where login=lower(btrim(p_usuario)) and ativo for update;
  if v_id is null then raise exception 'Usuário ativo não encontrado.'; end if;
  v_codigo:=upper(encode(extensions.gen_random_bytes(8),'hex'));
  insert into private.recuperacoes_senha(usuario_id,codigo_hash,expira_em)
  values(v_id,extensions.digest(v_codigo,'sha256'),now()+interval '30 minutes')
  on conflict(usuario_id) do update set codigo_hash=excluded.codigo_hash,expira_em=excluded.expira_em,
    tentativas=0,token_hash=null,token_expira_em=null;
  return substr(v_codigo,1,4)||'-'||substr(v_codigo,5,4)||'-'||substr(v_codigo,9,4)||'-'||substr(v_codigo,13,4);
end $$;

create function public.validar_codigo_recuperacao(p_usuario text,p_codigo text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_id uuid; v_rec private.recuperacoes_senha; v_codigo text; v_token text;
begin
  if p_usuario is null or length(p_usuario)>80 or p_codigo is null or length(p_codigo)>80 then
    return jsonb_build_object('error','Usuário ou código inválido, expirado ou já utilizado. Peça um novo código ao administrador.');
  end if;
  select id into v_id from public.usuarios where login=lower(btrim(p_usuario)) and ativo for share;
  select * into v_rec from private.recuperacoes_senha where usuario_id=v_id for update;
  v_codigo:=upper(regexp_replace(p_codigo,'[-[:space:]]','','g'));
  if v_rec.usuario_id is null or v_rec.codigo_hash is null or v_rec.expira_em<=now() or v_rec.tentativas>=5 then
    return jsonb_build_object('error','Usuário ou código inválido, expirado ou já utilizado. Peça um novo código ao administrador.');
  end if;
  if v_rec.codigo_hash<>extensions.digest(v_codigo,'sha256') then
    update private.recuperacoes_senha set tentativas=tentativas+1 where usuario_id=v_id;
    return jsonb_build_object('error','Usuário ou código inválido, expirado ou já utilizado. Peça um novo código ao administrador.');
  end if;
  v_token:=encode(extensions.gen_random_bytes(32),'hex');
  update private.recuperacoes_senha set codigo_hash=null,token_hash=extensions.digest(v_token,'sha256'),
    token_expira_em=now()+interval '10 minutes' where usuario_id=v_id;
  return jsonb_build_object('token',v_token);
end $$;

create function public.recuperar_senha(p_token text,p_senha text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_id uuid; v_login text; v_bucket integer; v_rec private.recuperacoes_senha;
begin
  if p_token is null or p_token !~ '^[a-f0-9]{64}$' then
    return jsonb_build_object('error','A autorização expirou ou já foi usada. Peça um novo código ao administrador.','expired',true);
  end if;
  select u.id,u.login into v_id,v_login from private.recuperacoes_senha r join public.usuarios u on u.id=r.usuario_id
  where r.token_hash=extensions.digest(p_token,'sha256') and u.ativo;
  if v_id is null then
    return jsonb_build_object('error','A autorização expirou ou já foi usada. Peça um novo código ao administrador.','expired',true);
  end if;
  -- Mesma ordem de locks usada por definir_senha_usuario: limite, usuario, recuperacao.
  v_bucket:=((hashtextextended(v_login,0) & 2147483647) % 1024)::integer;
  perform 1 from private.tentativas_login where bucket=v_bucket for update;
  perform 1 from public.usuarios where id=v_id and ativo for update;
  if not found then
    return jsonb_build_object('error','A autorização expirou ou já foi usada. Peça um novo código ao administrador.','expired',true);
  end if;
  select * into v_rec from private.recuperacoes_senha where usuario_id=v_id for update;
  if v_rec.token_hash is null or v_rec.token_hash<>extensions.digest(p_token,'sha256') or v_rec.token_expira_em<=now() then
    return jsonb_build_object('error','A autorização expirou ou já foi usada. Peça um novo código ao administrador.','expired',true);
  end if;
  if p_senha is null or length(p_senha)<12 or octet_length(p_senha)>72 then
    return jsonb_build_object('error','Use uma senha com pelo menos 12 caracteres e no máximo 72 bytes.');
  end if;
  perform public.definir_senha_usuario(v_login,p_senha);
  -- A funcao redefine hash, revoga sessoes e o trigger consome a recuperacao.
  return jsonb_build_object('success',true);
end $$;

revoke all on function private.invalidar_recuperacao(),public.gerar_codigo_recuperacao(text),
  public.validar_codigo_recuperacao(text,text),public.recuperar_senha(text,text) from public,anon,authenticated,service_role;
grant execute on function public.gerar_codigo_recuperacao(text) to postgres;
grant execute on function public.validar_codigo_recuperacao(text,text),public.recuperar_senha(text,text) to anon;
commit;
