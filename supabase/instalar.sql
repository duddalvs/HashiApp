-- INSTALAÇÃO INICIAL EM PROJETO SUPABASE NOVO. Executar uma vez.

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


-- Cadastros do pedido original. Não substitui modelos corrigidos posteriormente.

begin;

insert into public.veiculos (placa, modelo, tipo) values
('BBE9E35', 'PENDENTE - ALTERAR 1', 'veiculo'),
('BBE9E90', 'M.BENZ/ACCELO 815 CE', 'veiculo'),
('BBH1E97', 'M.BENZ/ACCELO 815 CE', 'veiculo'),
('BBH1E99', 'M.BENZ/ACCELO 815', 'veiculo'),
('BDU9C81', 'M.BENZ/ACCELO 815 CE', 'veiculo'),
('BDX3B59', 'Ford K 1.0 SE/SE PLUS Tivct flex 5P', 'veiculo'),
('BDY9I58', 'M.BENZ/ACCELO 815 CE', 'veiculo'),
('BEA5H11', 'VW/9. 170 DRC 4X2', 'veiculo'),
('BEY3F01', 'VW/9. 170 DRC 4X2', 'veiculo'),
('CZA1C09', 'GMC/16.220', 'veiculo'),
('ELW7J98', 'FIAT/STRADA FREEDOM CC', 'veiculo'),
('FHB8H95', 'VW/8. 160 DRC 4X2', 'veiculo'),
('FJT9I54', 'PENDENTE - ALTERAR 2', 'veiculo'),
('FOW2B35', 'PENDENTE - ALTERAR 3', 'veiculo'),
('GBQ9366', 'VW/8. 160 DRC 4X2', 'veiculo'),
('GEI8C98', 'VW/NOVA SAVEIRO RB MBVS', 'veiculo'),
('GIG9B72', 'PENDENTE - ALTERAR 4', 'veiculo'),
('JAJ1C55', 'VW/9. 170 DRC 4X2', 'veiculo'),
('KNC1076', 'PENDENTE - ALTERAR 5', 'veiculo'),
('KNH7B51', 'PENDENTE - ALTERAR 6', 'veiculo'),
('KQS8B71', 'M. BENZ/ATEGO 2430', 'veiculo'),
('KRK8F40', 'PENDENTE - ALTERAR 7', 'veiculo'),
('KRL8G19', 'M.BENZ/ACCELO 815 CE', 'veiculo'),
('KRN6A41', 'M.BENZ/ACCELO 815 CE', 'veiculo'),
('KRN6J98', 'PENDENTE - ALTERAR 8', 'veiculo'),
('KTV1201', 'PENDENTE - ALTERAR 9', 'veiculo'),
('KWM9F69', 'VW/17.190 WORKER', 'veiculo'),
('KXA6H28', 'M.BENZ/ACCELO 815 CE', 'veiculo'),
('KXC7C13', 'M.BENZ/ACCELO 815 CE', 'veiculo'),
('KXL9F47', 'VW/8. 160 DRC 4X2', 'veiculo'),
('KXU6H41', 'VW/8. 160 DRC 4X2', 'veiculo'),
('KYH5D78', 'PENDENTE - ALTERAR 10', 'veiculo'),
('KYX8A58', 'VW/17 . 190 CRM 4X2 EP', 'veiculo'),
('KZF4D30', 'FIAT/STRADA ADVENTURE CD', 'veiculo'),
('LMH3C97', 'M.BENZ/ACCELO 815 CE', 'veiculo'),
('LMH3G88', 'M.BENZ/ACCELO 815 CE', 'veiculo'),
('LMO7B21', 'VW/9. 170 DRC 4X2', 'veiculo'),
('LMP9H12', 'FORD', 'veiculo'),
('LMP9H23', 'FORD', 'veiculo'),
('LQK3B38', 'M.BENZ/1718', 'veiculo'),
('LQN6C18', 'RENAULT/SANDERO EXP1016V', 'veiculo'),
('LRB4716', 'I/KIA UK2500 HD SC', 'veiculo'),
('LRJ7G35', 'FORD', 'veiculo'),
('LRJ7G95', 'FORD', 'veiculo'),
('LRJ9B37', 'FORD', 'veiculo'),
('LSG7222', 'M.BENZ/ATEGO 1719', 'veiculo'),
('LSG7C27', 'M.BENZ/ATEGO 1719', 'veiculo'),
('LSJ9C70', 'M.BENZ/ACCELO 815 CE', 'veiculo'),
('LSK7B48', 'M.BENZ/ACCELO 815 CE', 'veiculo'),
('LSK7J36', 'M.BENZ/ACCELO 815 CE', 'veiculo'),
('LSK8E20', 'M.BENZ/ACCELO 815 CE', 'veiculo'),
('LSM9J59', 'M.BENZ/ACCELO 815 CE', 'veiculo'),
('LSN8D43', 'M.BENZ/ACCELO 815 CE', 'veiculo'),
('LSP7F42', 'M.BENZ/ACCELO 815 CE', 'veiculo'),
('LSV7340', 'HYUNDAI/HR HDB', 'veiculo'),
('LTD6433', 'HYUNDAI/HR HDB', 'veiculo'),
('LTQ7F95', 'VW 15.190', 'veiculo'),
('LTV8D48', 'M.BENZ/ACCELO 815 CE', 'veiculo'),
('LTX9J56', 'M.BENZ/ACCELO 815 CE', 'veiculo'),
('LUE3B62', 'M.BENZ/ACCELO 815 CE', 'veiculo'),
('LUH8E33', 'M.BENZ/ACCELO 815 CE', 'veiculo'),
('LUL8A32', 'PENDENTE - ALTERAR 11', 'veiculo'),
('LUL9I66', 'M.BENZ/ACCELO 815 CE', 'veiculo'),
('LUM3D11', 'M.BENZ/ACCELO 815 CE', 'veiculo'),
('LUO1G86', 'M.BENZ/ACCELO 815 CE', 'veiculo'),
('LUT7G94', 'M.BENZ/ACCELO 815 CE', 'veiculo'),
('QUJ3E09', 'SAVEIRO', 'veiculo'),
('RFY4C30', 'PENDENTE - ALTERAR 12', 'veiculo'),
('RIX1J87', 'M.BENZ/ACCELO 815 CE', 'veiculo'),
('RJA0I50', 'M.BENZ/ACCELO 815 CE', 'veiculo'),
('RJF4J47', 'M.BENZ/ACCELO 815 CE', 'veiculo'),
('RJG0F36', 'M.BENZ/ACCELO 815 CE', 'veiculo'),
('RJO0I33', 'M.BENZ/ACCELO 815 CE', 'veiculo'),
('RJP3C12', 'VW/9. 170 DRC 4X2', 'veiculo'),
('RJW0J69', 'M.BENZ/ACCELO 815 CE', 'veiculo'),
('RKB0A29', 'M.BENZ/ACCELO 815 CE', 'veiculo'),
('RKE3H26', 'M.BENZ/ACCELO 815 CE', 'veiculo'),
('RKI3I58', 'M.BENZ/ACCELO 815 CE', 'veiculo'),
('RKK0A22', 'M.BENZ/ACCELO 815 CE', 'veiculo'),
('SP-6539', 'RETROESCAVADEIRA', 'equipamento'),
('SP-7188', 'MINI RETROESCAVADEIRA', 'equipamento'),
('SSD8A74', 'VW/26.260 CRM 6X2', 'veiculo')
on conflict (placa) do nothing;

insert into public.funcionarios (nome, is_status, ativo) values
('Parado na Base', true, false),
('Ademilson Cezar de Mendonça', false, true),
('Ademir Jorge Barbosa da Silva', false, true),
('Adriano Firmino da Silva', false, true),
('Adriana da Silva Santos', false, true),
('Afonso Alves de Almeida', false, true),
('Alberto da Silva Rodrigues', false, true),
('Anderson da Conceição Fonseca', false, true),
('Anderson Donato Costa', false, true),
('André Luiz da Silva Pereira', false, true),
('Antonio Vanderleiz da Paz', false, true),
('Auricélio Andrade Oliveira', false, true),
('Carlos de Oliveira Barreto', false, true),
('Carlos Eduardo Alves Germano', false, true),
('Carlos Renato Dantas do Nascimento', false, true),
('Carlos Vinicius Polito Rodrigues', false, true),
('Claudio Cordeiro de Sousa', false, true),
('Clebisom de Azevedo Vieira', false, true),
('Daniel Gomes da Silva', false, true),
('Davi Bezerra Félix', false, true),
('David Decroix Viana', false, true),
('Davi Venancio Rodrigues', false, true),
('Djavan Henrique Vieira Grilo', false, true),
('Edilberto Sá Vianna da Silva Junior', false, true),
('Edreque Feliciano da Silva Santos', false, true),
('Edy Carlos Abreu Barreto', false, true),
('Erick Moraes Muniz', false, true),
('Eumir Silva da Gama Junior', false, true),
('Fabiano Suguiyama Vieira', false, true),
('Fabio Lima de Amorim', false, true),
('Fernando Junior Abreu do Nascimento', false, true),
('Fernando Pereira dos Prazeres', false, true),
('Fernando Ribeiro da Silva', false, true),
('Gabriel Álvaro Moreira', false, true),
('Gabriel Henrique da Silva Neves', false, true),
('Gilberto Bastos', false, true),
('Gilmar Miguel Rodrigues Soares', false, true),
('Gustavo Martins Gomes da Silva', false, true),
('Israel Rodrigues de Oliveira', false, true),
('Jean de Souza Silva', false, true),
('Jhoenis Lima Nunes', false, true),
('Jocimar de Araújo Eufrásio', false, true),
('Jocimar Lino Castro Areas', false, true),
('Joel Guilherme de Souza Junior', false, true),
('Johnatan Luiz Gomes de França', false, true),
('Jonhcklem Barreto da Cruz', false, true),
('José Baia da Silva', false, true),
('José Edvanio da Silva', false, true),
('Julio Cesar Duarte Pereira', false, true),
('Juraci Martins de Araújo', false, true),
('Leandro Franciscus Azeredo Alves da Silva', false, true),
('Leandro Teixeira Santos', false, true),
('Lucas Cordeiro Pereira', false, true),
('Lucas Melgaço da Silva', false, true),
('Lucas Severiano de Oliveira Caldas', false, true),
('Luis Henrique Nascimento dos Santos', false, true),
('Luis Jose Pereira', false, true),
('Luiz Felipe Costa Soares Rocha', false, true),
('Luiz Fernando de Souza Rabello', false, true),
('Luiz Ricardo Mazzucchelli Ferreira', false, true),
('Marcio Flores dos Santos', false, true),
('Marcos Alexandre Souza da Silva', false, true),
('Marcos Antonio Cordeiro Felismino', false, true),
('Marcos Antonio Garcez Serqueira', false, true),
('Mauro Cesar Alves Ferreira de Souza', false, true),
('Max Sandro da Costa Figueredo', false, true),
('Maximiliano da Silva Pereira', false, true),
('Paulo Ricardo Tito', false, true),
('Pedro Paulo Mendes Baldez', false, true),
('Ramon Lopes do Livramento da Silva', false, true),
('Reinaldo da Silva Barros Junior', false, true),
('Roberto David Silva', false, true),
('Rodrigo Melo', false, true),
('Robson Luiz Ribeiro Pimentel', false, true),
('Robson Pargas Novaes', false, true),
('Rodrigo dos Santos Dias', false, true),
('Rodrigo Eduardo Carvalho de Oliveira', false, true),
('Rogerio Rangel Rosa', false, true),
('Severino Alves Barreto', false, true),
('Sérgio Reis de Jesus Bittencourt', false, true),
('Sidnei Carvalho da Silva', false, true),
('Silvanio Madureira Campos', false, true),
('Thiago Alexandre Frutuoso de Lima', false, true),
('Thiago Barcello Alves', false, true),
('Thomaz da Silva', false, true),
('Túlio da Silva Mariano', false, true),
('Uilliam Simões Fernandes', false, true),
('Vagner Soares Marinho', false, true),
('Valter Pereira da Silva', false, true),
('Valdinei Machado De Laia', false, true),
('Vitor Cesar Silva Domingos Oliveira', false, true),
('Wagner Souza de Oliveira', false, true),
('Wagner José da Silva', false, true),
('Wellington Tavares', false, true),
('Wallace Felizardo de Queiroz', false, true),
('Walter Cardoso Gonzaga', false, true),
('Wanderson Sabino Cabral', false, true),
('William de Souza Campos Chagas', false, true),
('Willis Martins Ferreira', false, true),
('Willye Cristiano Pessanha Ramos', false, true),
('Wilson da Silva Ramos', false, true),
('Wilson Vieira Mendes', false, true),
('Wislley Costa Santos', false, true)
on conflict (nome) do nothing;

insert into public.contratos (nome) values
('Belford Roxo'),
('Buri'),
('Campos dos Goytacazes'),
('Duque de Caxias'),
('Magé'),
('Natal'),
('Paty do Alferes'),
('São Gonçalo'),
('Saquarema')
on conflict (nome) do nothing;

insert into public.tipos_manutencao (nome) values
('Preventiva'),
('Corretiva'),
('Revisão'),
('Pneus'),
('Elétrica'),
('Mecânica'),
('Funilaria'),
('Outros')
on conflict (nome) do nothing;

commit;
