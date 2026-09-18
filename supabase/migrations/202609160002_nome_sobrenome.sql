-- Perfis anteriores permanecem válidos; novos cadastros exigem os dois campos.
alter table public.usuarios add column sobrenome text not null default '';
alter table public.usuarios add constraint usuarios_sobrenome_tamanho
  check (length(sobrenome) <= 100);

drop function public.cadastrar_usuario(text,text,text,text);
create function public.cadastrar_usuario(
  p_usuario text,
  p_senha text,
  p_perfil text default 'funcionario',
  p_nome text default null,
  p_sobrenome text default null
) returns uuid language plpgsql security definer set search_path='' as $$
declare
  v_login text:=lower(btrim(p_usuario));
  v_nome text:=btrim(p_nome);
  v_sobrenome text:=btrim(p_sobrenome);
  v_id uuid;
begin
  if v_login is null or v_login !~ '^[a-z][a-z0-9_]{2,39}$' then
    raise exception 'Usuário inválido: use de 3 a 40 letras, números ou _, começando por letra.';
  end if;
  if p_senha is null or length(p_senha)<12 or octet_length(p_senha)>72 then
    raise exception 'Use uma senha de pelo menos 12 caracteres e no máximo 72 bytes.';
  end if;
  if p_perfil is null or p_perfil not in ('funcionario','admin') then
    raise exception 'Perfil inválido: funcionario ou admin.';
  end if;
  if v_nome is null or length(v_nome) not between 1 and 100 then
    raise exception 'Informe o nome, com até 100 caracteres.';
  end if;
  if v_sobrenome is null or length(v_sobrenome) not between 1 and 100 then
    raise exception 'Informe o sobrenome, com até 100 caracteres.';
  end if;
  if exists(select 1 from public.usuarios where login=v_login) then
    raise exception 'Esse usuário já existe. Nenhuma senha foi alterada.';
  end if;
  insert into public.usuarios(login,nome,sobrenome,perfil,ativo)
  values(v_login,v_nome,v_sobrenome,p_perfil,true) returning id into v_id;
  insert into private.credenciais(usuario_id,senha_hash)
  values(v_id,extensions.crypt(p_senha,extensions.gen_salt('bf',12)));
  return v_id;
end;
$$;
revoke all on function public.cadastrar_usuario(text,text,text,text,text)
  from public,anon,authenticated,service_role;
grant execute on function public.cadastrar_usuario(text,text,text,text,text) to postgres;
