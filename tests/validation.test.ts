import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  normalize,
  digitsOnly,
  costFromDigits,
  currency,
  validDate,
  localDate,
} from '../src/lib/format';
import { validateMaintenance, validateRegistration } from '../src/lib/validation';
import { demoCatalogs } from '../src/data/demo';
test('pesquisa sem acentos, moeda brasileira e data local válida', () => {
  assert.equal(normalize('  SÃO Gonçalo '), 'sao goncalo');
  assert.equal(digitsOnly('R$ 480,00abc'), '48000');
  assert.equal(costFromDigits('48000'), 480);
  assert.match(currency(480), /480,00/);
  assert.equal(validDate('2026-02-31'), false);
  assert.equal(validDate('2028-02-29'), true);
});
test('formulários exigem IDs selecionados e todos os blocos completos', () => {
  const base = {
    id: 'id',
    date: '2026-09-10',
    contractId: 1,
    teams: [{ responsavel_id: 1, veiculo_id: 1 }],
  };
  assert.deepEqual(validateRegistration(base, demoCatalogs), {});
  assert.ok(
    validateRegistration(
      { ...base, teams: [...base.teams, { responsavel_id: null, veiculo_id: null }] },
      demoCatalogs,
    )['employee-1'],
  );
  assert.ok(validateRegistration({ ...base, contractId: 999 }, demoCatalogs).contract);
  const maintenance = {
    id: 'id',
    date: '2026-09-10',
    typeId: 1,
    driverId: 1,
    contractId: 1,
    vehicleId: 1,
    costDigits: '48000',
  };
  assert.deepEqual(validateMaintenance(maintenance, demoCatalogs), {});
  assert.ok(validateMaintenance({ ...maintenance, vehicleId: null }, demoCatalogs).vehicle);
  assert.ok(validateMaintenance({ ...maintenance, costDigits: 'abc' }, demoCatalogs).cost);
  assert.ok(validateMaintenance({ ...maintenance, costDigits: '' }, demoCatalogs).cost);
  assert.deepEqual(validateMaintenance({ ...maintenance, costDigits: '0' }, demoCatalogs), {});
});
test('registro identifica funcionarios e veiculos repetidos apenas entre equipes preenchidas', () => {
  const base = {
    id: 'id',
    date: '2026-09-17',
    contractId: 1,
    teams: [
      { responsavel_id: 1, veiculo_id: 1 },
      { responsavel_id: 1, veiculo_id: 2 },
      { responsavel_id: 2, veiculo_id: 1 },
    ],
  };
  const errors = validateRegistration(base, demoCatalogs);
  assert.match(errors.duplicates, /Funcionário: João — exemplo\. Equipes: 1, 2\./);
  assert.match(errors.duplicates, /Veículo: BBE9E90\. Equipes: 1, 3\./);
  assert.ok(errors['employee-0'] && errors['employee-1']);
  assert.ok(errors['vehicle-0'] && errors['vehicle-2']);
  assert.equal(errors['employee-2'], undefined);
  assert.equal(errors['vehicle-1'], undefined);
  const vehicleOnly = validateRegistration(
    {
      ...base,
      teams: [
        { responsavel_id: 1, veiculo_id: 1 },
        { responsavel_id: 2, veiculo_id: 1 },
      ],
    },
    demoCatalogs,
  );
  assert.match(vehicleOnly.duplicates, /Veículo:/);
  assert.doesNotMatch(vehicleOnly.duplicates, /Funcionário:/);
  const employeeOnly = validateRegistration(
    { ...base, teams: base.teams.slice(0, 2) },
    demoCatalogs,
  );
  assert.match(employeeOnly.duplicates, /Funcionário:/);
  assert.doesNotMatch(employeeOnly.duplicates, /Veículo:/);
  assert.equal(
    validateRegistration(
      {
        ...base,
        teams: [
          { responsavel_id: null, veiculo_id: null },
          { responsavel_id: null, veiculo_id: null },
        ],
      },
      demoCatalogs,
    ).duplicates,
    undefined,
  );
  const corrected = {
    ...base,
    version: 1,
    teams: [
      { responsavel_id: 1, veiculo_id: 1 },
      { responsavel_id: 2, veiculo_id: 2 },
    ],
  };
  assert.deepEqual(validateRegistration(corrected, demoCatalogs), {});
});

test('cadastros preservam equipamentos, 12 modelos pendentes e todos os nomes', () => {
  const data = JSON.parse(readFileSync('supabase/cadastros.json', 'utf8'));
  assert.equal(data.veiculos.length, 82);
  assert.equal(data.funcionarios.length, 103);
  assert.equal(new Set(data.veiculos.map((v: { placa: string }) => v.placa)).size, 82);
  assert.equal(new Set(data.funcionarios).size, 103);
  assert.equal(data.contratos.length, 9);
  assert.equal(data.tipos_manutencao.length, 8);
  assert.equal(
    data.veiculos.filter((v: { modelo: string }) => v.modelo.startsWith('PENDENTE - ALTERAR'))
      .length,
    12,
  );
  for (const plate of ['SP-6539', 'SP-7188'])
    assert.equal(
      data.veiculos.find((v: { placa: string }) => v.placa === plate).tipo,
      'equipamento',
    );
  assert.ok(data.funcionarios.includes('Parado na Base'));
});

test('datas futuras sao recusadas nos dois formularios, inclusive na edicao', () => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  for (const version of [undefined, 1]) {
    for (const date of [
      localDate(yesterday),
      localDate(today),
      localDate(tomorrow),
      '2026-02-31',
      '',
    ]) {
      const registration = validateRegistration(
        { id: 'id', date, version, contractId: 1, teams: [{ responsavel_id: 1, veiculo_id: 1 }] },
        demoCatalogs,
      );
      const maintenance = validateMaintenance(
        {
          id: 'id',
          date,
          version,
          contractId: 1,
          driverId: 1,
          vehicleId: 1,
          typeId: 1,
          costDigits: '0',
        },
        demoCatalogs,
      );
      const invalid = !validDate(date) || date > localDate(today);
      assert.equal(!!registration.date, invalid);
      assert.equal(!!maintenance.date, invalid);
    }
  }
});

test('motorista nulo exige escolha explicita, e IDs invalidos continuam recusados', () => {
  const base = {
    id: 'id',
    date: localDate(),
    contractId: 1,
    vehicleId: 1,
    typeId: 8,
    costDigits: '0',
    driverId: null,
  };
  assert.ok(validateMaintenance(base, demoCatalogs).driver);
  assert.deepEqual(validateMaintenance({ ...base, driverUnidentified: true }, demoCatalogs), {});
  assert.deepEqual(
    validateMaintenance({ ...base, driverUnidentified: true, version: 1 }, demoCatalogs),
    {},
  );
  assert.ok(validateMaintenance({ ...base, driverId: 999 }, demoCatalogs).driver);
  assert.ok(
    validateMaintenance({ ...base, driverId: 1, driverUnidentified: true }, demoCatalogs).driver,
  );
  assert.deepEqual(
    validateMaintenance({ ...base, driverId: 1, driverUnidentified: false }, demoCatalogs),
    {},
  );
});
