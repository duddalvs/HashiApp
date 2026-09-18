begin;

create table public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  email text not null,
  perfil text not null default 'funcionario' check (perfil in ('funcionario','admin')),
  ativo boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.funcionarios (
  id bigint generated always as identity primary key,
  nome text not null unique check (length(trim(nome)) > 0),
  is_status boolean not null default false,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.veiculos (
  id bigint generated always as identity primary key,
  placa text not null unique,
  modelo text not null,
  tipo text not null default 'veiculo' check (tipo in ('veiculo','equipamento')),
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.contratos (
  id bigint generated always as identity primary key,
  nome text not null unique,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.tipos_manutencao (
  id bigint generated always as identity primary key,
  nome text not null unique,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.registros_frota (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  contrato_id bigint not null references public.contratos(id),
  numero_equipes integer not null check (numero_equipes between 1 and 50),
  usuario_id uuid not null references public.usuarios(id),
  created_at timestamptz not null default now()
);
create table public.registro_equipes (
  id bigint generated always as identity primary key,
  registro_frota_id uuid not null references public.registros_frota(id) on delete cascade,
  numero_equipe integer not null check (numero_equipe between 1 and 50),
  responsavel_id bigint not null references public.funcionarios(id),
  veiculo_id bigint not null references public.veiculos(id),
  created_at timestamptz not null default now(),
  unique (registro_frota_id, numero_equipe)
);
create table public.manutencoes (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  tipo_manutencao_id bigint not null references public.tipos_manutencao(id),
  motorista_id bigint not null references public.funcionarios(id),
  contrato_id bigint not null references public.contratos(id),
  veiculo_id bigint not null references public.veiculos(id),
  custo numeric(12,2) not null check (custo >= 0 and custo <= 9999999999.99),
  usuario_id uuid not null references public.usuarios(id),
  created_at timestamptz not null default now()
);
create index registros_usuario_data on public.registros_frota(usuario_id, created_at desc);
create index manutencoes_usuario_data on public.manutencoes(usuario_id, created_at desc);
create index equipes_registro on public.registro_equipes(registro_frota_id);
create index equipes_veiculo on public.registro_equipes(veiculo_id);
create index manutencoes_veiculo on public.manutencoes(veiculo_id);

-- Perfis nunca são confiados aos metadados editáveis do usuário.
create function public.criar_perfil() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.usuarios(id, nome, email)
  values (new.id, coalesce(nullif(new.raw_user_meta_data->>'nome',''), split_part(new.email,'@',1), 'Usuário'), coalesce(new.email,''));
  return new;
end;
$$;
create trigger ao_criar_usuario after insert on auth.users for each row execute function public.criar_perfil();
-- Também prepara perfis para contas existentes; ativação é administrativa.
insert into public.usuarios(id,nome,email)
select id, coalesce(nullif(raw_user_meta_data->>'nome',''),split_part(email,'@',1),'Usuário'), coalesce(email,'') from auth.users
on conflict(id) do nothing;

create function public.usuario_ativo() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.usuarios where id = (select auth.uid()) and ativo);
$$;
create function public.e_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.usuarios where id = (select auth.uid()) and ativo and perfil='admin');
$$;

alter table public.usuarios enable row level security;
alter table public.funcionarios enable row level security;
alter table public.veiculos enable row level security;
alter table public.contratos enable row level security;
alter table public.tipos_manutencao enable row level security;
alter table public.registros_frota enable row level security;
alter table public.registro_equipes enable row level security;
alter table public.manutencoes enable row level security;

revoke all on public.usuarios, public.funcionarios, public.veiculos, public.contratos, public.tipos_manutencao, public.registros_frota, public.registro_equipes, public.manutencoes from anon, authenticated;
grant select on public.usuarios, public.funcionarios, public.veiculos, public.contratos, public.tipos_manutencao, public.registros_frota, public.registro_equipes, public.manutencoes to authenticated;
grant insert, update on public.funcionarios, public.veiculos, public.contratos, public.tipos_manutencao to authenticated;
grant usage, select on all sequences in schema public to authenticated;

create policy perfil_proprio on public.usuarios for select to authenticated using (id=(select auth.uid()) or (select public.e_admin()));
create policy funcionarios_leitura on public.funcionarios for select to authenticated using ((select public.usuario_ativo()));
create policy veiculos_leitura on public.veiculos for select to authenticated using ((select public.usuario_ativo()));
create policy contratos_leitura on public.contratos for select to authenticated using ((select public.usuario_ativo()));
create policy tipos_leitura on public.tipos_manutencao for select to authenticated using ((select public.usuario_ativo()));
create policy funcionarios_admin on public.funcionarios for all to authenticated using ((select public.e_admin())) with check ((select public.e_admin()));
create policy veiculos_admin on public.veiculos for all to authenticated using ((select public.e_admin())) with check ((select public.e_admin()));
create policy contratos_admin on public.contratos for all to authenticated using ((select public.e_admin())) with check ((select public.e_admin()));
create policy tipos_admin on public.tipos_manutencao for all to authenticated using ((select public.e_admin())) with check ((select public.e_admin()));
create policy registros_leitura on public.registros_frota for select to authenticated using ((select public.usuario_ativo()) and (usuario_id=(select auth.uid()) or (select public.e_admin())));
create policy manutencoes_leitura on public.manutencoes for select to authenticated using ((select public.usuario_ativo()) and (usuario_id=(select auth.uid()) or (select public.e_admin())));
create policy equipes_leitura on public.registro_equipes for select to authenticated using (exists(select 1 from public.registros_frota r where r.id=registro_frota_id));

-- Escritas de operações somente por funções que validam identidade, atividade e atomicidade.
create function public.salvar_registro(p_id uuid, p_data date, p_contrato_id bigint, p_equipes jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid(); v_count integer; v_existing public.registros_frota; v_equipes jsonb;
begin
  if not public.usuario_ativo() then raise exception 'Usuário sem acesso ativo.' using errcode='42501'; end if;
  if p_id is null or p_data is null or jsonb_typeof(p_equipes) is distinct from 'array' then raise exception 'Dados inválidos.'; end if;
  v_count := jsonb_array_length(p_equipes);
  if v_count not between 1 and 50 then raise exception 'Selecione de 1 a 50 equipes.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
  select * into v_existing from public.registros_frota where id=p_id;
  if found then
    select jsonb_agg(jsonb_build_object('responsavel_id',responsavel_id,'veiculo_id',veiculo_id) order by numero_equipe) into v_equipes from public.registro_equipes where registro_frota_id=p_id;
    if v_existing.usuario_id=v_uid and v_existing.data=p_data and v_existing.contrato_id=p_contrato_id and v_equipes=p_equipes then return p_id; end if;
    raise exception 'Este envio já existe com outros dados.' using errcode='23505';
  end if;
  if not exists(select 1 from public.contratos where id=p_contrato_id and ativo) then raise exception 'Selecione um contrato ativo.'; end if;
  if exists(select 1 from jsonb_array_elements(p_equipes) e where
    not exists(select 1 from public.funcionarios f where f.id=(e->>'responsavel_id')::bigint and f.ativo and not f.is_status)
    or not exists(select 1 from public.veiculos v where v.id=(e->>'veiculo_id')::bigint and v.ativo)) then
    raise exception 'Selecione um responsável e um veículo ativos para cada equipe.';
  end if;
  insert into public.registros_frota(id,data,contrato_id,numero_equipes,usuario_id) values(p_id,p_data,p_contrato_id,v_count,v_uid);
  insert into public.registro_equipes(registro_frota_id,numero_equipe,responsavel_id,veiculo_id)
  select p_id, ordinality, (value->>'responsavel_id')::bigint, (value->>'veiculo_id')::bigint from jsonb_array_elements(p_equipes) with ordinality;
  return p_id;
end;
$$;

create function public.salvar_manutencao(p_id uuid,p_data date,p_tipo_id bigint,p_motorista_id bigint,p_contrato_id bigint,p_veiculo_id bigint,p_custo numeric)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_existing public.manutencoes; v_uid uuid:=auth.uid();
begin
  if not public.usuario_ativo() then raise exception 'Usuário sem acesso ativo.' using errcode='42501'; end if;
  if p_id is null or p_data is null or p_custo is null or p_custo < 0 or p_custo > 9999999999.99 or p_custo <> round(p_custo,2) then raise exception 'Data ou custo inválido.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
  select * into v_existing from public.manutencoes where id=p_id;
  if found then
    if v_existing.usuario_id=v_uid and v_existing.data=p_data and v_existing.tipo_manutencao_id=p_tipo_id and v_existing.motorista_id=p_motorista_id and v_existing.contrato_id=p_contrato_id and v_existing.veiculo_id=p_veiculo_id and v_existing.custo=p_custo then return p_id; end if;
    raise exception 'Este envio já existe com outros dados.' using errcode='23505';
  end if;
  if not exists(select 1 from public.tipos_manutencao where id=p_tipo_id and ativo)
    or not exists(select 1 from public.funcionarios where id=p_motorista_id and ativo and not is_status)
    or not exists(select 1 from public.contratos where id=p_contrato_id and ativo)
    or not exists(select 1 from public.veiculos where id=p_veiculo_id and ativo) then raise exception 'Selecione opções ativas da lista.'; end if;
  insert into public.manutencoes(id,data,tipo_manutencao_id,motorista_id,contrato_id,veiculo_id,custo,usuario_id)
  values(p_id,p_data,p_tipo_id,p_motorista_id,p_contrato_id,p_veiculo_id,p_custo,v_uid);
  return p_id;
end;
$$;

-- Normalização sem extensões adicionais; pesquisa também ignora hífens de placas.
create function public.normalizar(p_texto text) returns text language sql immutable set search_path='' as $$
  select translate(lower(coalesce(p_texto,'')), 'áàâãäéèêëíìîïóòôõöúùûüç-', 'aaaaaeeeeiiiiooooouuuuc');
$$;
create function public.buscar_historico(p_busca text default '',p_limite integer default 21,p_offset integer default 0,p_tipo text default 'todos')
returns table(id uuid,tipo text,data date,contrato text,placas text[],detalhes jsonb,custo numeric,created_at timestamptz)
language sql stable security invoker set search_path='' as $$
  with historico as (
    select r.id, 'registro'::text as tipo,r.data,c.nome as contrato,
      array_agg(v.placa order by e.numero_equipe) as placas,
      jsonb_agg(jsonb_build_object('equipe',e.numero_equipe,'responsavel',f.nome,'placa',v.placa,'modelo',v.modelo) order by e.numero_equipe) as detalhes,
      null::numeric as custo,r.created_at
    from public.registros_frota r join public.contratos c on c.id=r.contrato_id
    join public.registro_equipes e on e.registro_frota_id=r.id join public.veiculos v on v.id=e.veiculo_id join public.funcionarios f on f.id=e.responsavel_id
    group by r.id,c.nome
    union all
    select m.id,'manutencao',m.data,c.nome,array[v.placa],jsonb_build_array(jsonb_build_object('servico',t.nome,'responsavel',f.nome,'placa',v.placa,'modelo',v.modelo)),m.custo,m.created_at
    from public.manutencoes m join public.contratos c on c.id=m.contrato_id join public.veiculos v on v.id=m.veiculo_id
    join public.funcionarios f on f.id=m.motorista_id join public.tipos_manutencao t on t.id=m.tipo_manutencao_id
  )
  select * from historico h where (p_tipo='todos' or h.tipo=p_tipo)
    and position(public.normalizar(trim(p_busca)) in public.normalizar(h.contrato || ' ' || array_to_string(h.placas,' '))) > 0
  order by h.created_at desc,h.id desc limit greatest(1,least(coalesce(p_limite,21),101)) offset greatest(0,coalesce(p_offset,0));
$$;

revoke all on function public.criar_perfil(), public.usuario_ativo(), public.e_admin(), public.normalizar(text), public.salvar_registro(uuid,date,bigint,jsonb), public.salvar_manutencao(uuid,date,bigint,bigint,bigint,bigint,numeric), public.buscar_historico(text,integer,integer,text) from public, anon;
grant execute on function public.usuario_ativo(), public.e_admin(), public.normalizar(text), public.salvar_registro(uuid,date,bigint,jsonb), public.salvar_manutencao(uuid,date,bigint,bigint,bigint,bigint,numeric), public.buscar_historico(text,integer,integer,text) to authenticated;
commit;
