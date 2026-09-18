begin;

-- Mantem IDs, permissoes e todos os envios existentes.
update public.usuarios set login=lower(split_part(email,'@',1))
where login is null and email ~ '^[a-z][a-z0-9_]{2,39}@hashimoto[.]invalid$';
alter table public.usuarios alter column login set not null;
alter table public.usuarios drop column email;

create or replace function public.criar_perfil() returns trigger
language plpgsql security definer set search_path='' as $$
declare v_login text; v_perfil text; v_ativo boolean;
begin
  if new.email is null or new.email !~ '^[a-z][a-z0-9_]{2,39}@hashimoto[.]invalid$' then
    raise exception 'Cadastre o acesso pelo nome de usuario usando cadastrar_usuario.';
  end if;
  v_login:=split_part(new.email,'@',1);
  -- app_metadata e gravado apenas pela API administrativa do Auth.
  -- user_metadata (editavel pelo usuario) nunca concede permissoes.
  v_perfil:=case when new.raw_app_meta_data->>'hashi_perfil'='admin' then 'admin' else 'funcionario' end;
  v_ativo:=coalesce(new.raw_app_meta_data->>'hashi_ativo','false')='true';
  insert into public.usuarios(id,login,nome,perfil,ativo)
  values(new.id,v_login,coalesce(nullif(btrim(new.raw_user_meta_data->>'nome'),''),v_login),v_perfil,v_ativo);
  return new;
end;
$$;

-- O login identifica a conta Auth; nao deve ser renomeado apenas no perfil.
create function public.proteger_login() returns trigger
language plpgsql set search_path='' as $$
begin
  if new.login is distinct from old.login then
    raise exception 'O nome de usuario nao pode ser alterado. O campo nome pode ser editado.';
  end if;
  return new;
end;
$$;
create trigger preservar_login before update of login on public.usuarios
for each row execute function public.proteger_login();
revoke all on function public.proteger_login() from public,anon,authenticated;

commit;
