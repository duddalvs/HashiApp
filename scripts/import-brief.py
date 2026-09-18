"""Importação única dos cadastros fornecidos, preservando grafia e associações."""
import json
import pathlib
import re
import sys

source = pathlib.Path(sys.argv[1]).read_text(encoding='utf-8')
pathlib.Path('docs/solicitacao.md').write_text(source, encoding='utf-8')
vehicles = []
for line in source.split('Placa\tModelo', 1)[1].split('Os registros SP-6539', 1)[0].strip().splitlines():
    plate, model = line.split('\t', 1)
    vehicles.append({'placa': plate, 'modelo': model, 'tipo': 'equipamento' if plate.startswith('SP-') else 'veiculo'})
def names(start, end):
    section = source.split(start, 1)[1].split(end, 1)[0]
    return [line.lstrip('•\t ').rstrip(';.') for line in section.splitlines() if line.startswith('•\t')]
employees = names('16. Dados dos funcionários', '17. Dados dos contratos')
contracts = names('17. Dados dos contratos', '18. Tipos de manutenção iniciais')
types = names('18. Tipos de manutenção iniciais', '19. Variáveis de ambiente')
data = {'veiculos': vehicles, 'funcionarios': employees, 'contratos': contracts, 'tipos_manutencao': types}
pathlib.Path('supabase/cadastros.json').write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
def quote(text):
    return "'"+text.replace("'", "''")+"'"
sql = ['-- Cadastros do pedido original. Não substitui modelos corrigidos posteriormente.', 'begin;']
sql += ['insert into public.veiculos (placa, modelo, tipo) values\n' + ',\n'.join('('+', '.join(quote(v[k]) for k in ['placa','modelo','tipo'])+')' for v in vehicles)+'\non conflict (placa) do nothing;']
sql += ['insert into public.funcionarios (nome, is_status, ativo) values\n' + ',\n'.join('('+quote(n)+(', true, false)' if n == 'Parado na Base' else ', false, true)') for n in employees)+'\non conflict (nome) do nothing;']
for table, items in [('contratos',contracts),('tipos_manutencao',types)]:
    sql += [f'insert into public.{table} (nome) values\n'+',\n'.join('('+quote(n)+')' for n in items)+'\non conflict (nome) do nothing;']
sql += ['commit;']
pathlib.Path('supabase/migrations/202609100002_cadastros.sql').write_text('\n\n'.join(sql)+'\n', encoding='utf-8')
print({k:len(v) for k,v in data.items()})
