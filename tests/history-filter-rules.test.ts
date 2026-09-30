import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  defaultHistoryFilters,
  isDefaultHistoryPeriod,
  historyDay,
  historyDateErrors,
  matchesHistoryFilters,
} from '../src/lib/historyFilters';
import type { HistoryItem, Registration } from '../src/types/models';

test('periodo semanal usa sete dias de Brasilia e exige as duas datas do filtro', () => {
  const now = new Date('2026-10-01T02:59:59Z');
  const filters = defaultHistoryFilters(now);
  assert.equal(historyDay('2026-10-01T02:59:59Z'), '2026-09-30');
  assert.deepEqual(
    { from: filters.from, to: filters.to },
    {
      from: '2026-09-24',
      to: '2026-09-30',
    },
  );
  assert.equal(isDefaultHistoryPeriod(filters, now), true);
  assert.deepEqual(historyDateErrors(filters), { from: '', to: '' });
  assert.deepEqual(historyDateErrors({ ...filters, from: '', to: '' }), {
    from: 'Informe a data inicial.',
    to: 'Informe a data final.',
  });
  assert.deepEqual(historyDateErrors({ ...filters, from: '2026-01-01', to: '' }), {
    from: '',
    to: 'Informe a data final.',
  });
  assert.deepEqual(historyDateErrors({ ...filters, from: '', to: '2026-09-30' }), {
    from: 'Informe a data inicial.',
    to: '',
  });
  assert.ok(historyDateErrors({ ...filters, from: '2026-02-30' }).from);
  assert.ok(historyDateErrors({ ...filters, to: '2026-02-30' }).to);
  assert.ok(historyDateErrors({ ...filters, from: '2026-09-30', to: '2026-09-01' }).from);
});

test('demonstracao combina motorista e placa na mesma equipe e separa data de envio', () => {
  const item: HistoryItem = {
    id: 'test',
    tipo: 'registro',
    data: '2026-01-01',
    contrato: 'Teste',
    placas: [],
    detalhes: [],
    custo: null,
    created_at: '2026-09-30T12:00:00Z',
    autor_nome: 'Demonstração',
  };
  const entry: Registration = {
    id: 'test',
    date: item.data,
    contractId: 1,
    teams: [
      { responsavel_id: 1, veiculo_id: 10 },
      { responsavel_id: 2, veiculo_id: 20 },
    ],
  };
  const filters = defaultHistoryFilters(new Date('2026-09-30T15:00:00Z'));
  assert.equal(matchesHistoryFilters(item, entry, filters), false);
  const allDates = { ...filters, from: '2026-01-01', to: '2026-09-30' };
  assert.equal(
    matchesHistoryFilters(item, entry, { ...allDates, driverIds: [1], vehicleIds: [20] }),
    false,
  );
  assert.equal(
    matchesHistoryFilters(item, entry, {
      ...allDates,
      driverIds: [2, 3],
      vehicleIds: [20, 30],
      contractIds: [1, 2],
    }),
    true,
  );
  assert.equal(
    matchesHistoryFilters(item, entry, { ...filters, from: item.data, to: item.data }),
    true,
  );
});
