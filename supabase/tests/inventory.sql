select 'usuarios' as tabela,count(*) as quantidade from public.usuarios
union all select 'funcionarios',count(*) from public.funcionarios
union all select 'funcionarios_ativos',count(*) from public.funcionarios where ativo and not is_status
union all select 'veiculos',count(*) from public.veiculos
union all select 'equipamentos',count(*) from public.veiculos where tipo='equipamento'
union all select 'modelos_pendentes',count(*) from public.veiculos where modelo like 'PENDENTE - ALTERAR %'
union all select 'contratos',count(*) from public.contratos
union all select 'tipos_manutencao',count(*) from public.tipos_manutencao
union all select 'registros_frota',count(*) from public.registros_frota
union all select 'registro_equipes',count(*) from public.registro_equipes
union all select 'manutencoes',count(*) from public.manutencoes;
