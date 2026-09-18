import type { Catalogs, Maintenance, Registration } from '@/types/models';
import { localDate, validDate } from './format';
export type Errors = Record<string, string>;
export function validateRegistration(value: Registration, catalogs: Catalogs): Errors {
  const errors: Errors = {};
  if (!validDate(value.date)) errors.date = 'Escolha uma data válida.';
  else if (value.date > localDate()) errors.date = 'A data não pode ser posterior a hoje.';
  if (!catalogs.contracts.some((c) => c.id === value.contractId && c.ativo))
    errors.contract = 'Escolha um contrato da lista.';
  if (value.teams.length < 1 || value.teams.length > 50)
    errors.count = 'Adicione de 1 a 50 equipes.';
  value.teams.forEach((team, index) => {
    if (!catalogs.employees.some((e) => e.id === team.responsavel_id && e.ativo && !e.is_status))
      errors[`employee-${index}`] = 'Escolha um responsável da lista.';
    if (!catalogs.vehicles.some((v) => v.id === team.veiculo_id && v.ativo))
      errors[`vehicle-${index}`] = 'Escolha uma placa da lista.';
  });
  const duplicates: string[] = [];
  for (const field of ['responsavel_id', 'veiculo_id'] as const) {
    const groups = new Map<number, number[]>();
    value.teams.forEach((team, index) => {
      const id = team[field];
      if (id !== null) groups.set(id, [...(groups.get(id) ?? []), index]);
    });
    for (const [id, indexes] of groups) {
      if (indexes.length < 2) continue;
      const employee = field === 'responsavel_id';
      const prefix = employee ? 'employee' : 'vehicle';
      if (indexes.some((index) => errors[`${prefix}-${index}`])) continue;
      const teams = indexes.map((index) => index + 1).join(', ');
      const label = employee
        ? catalogs.employees.find((item) => item.id === id)!.nome
        : catalogs.vehicles.find((item) => item.id === id)!.placa;
      duplicates.push(`${employee ? 'Funcionário' : 'Veículo'}: ${label}. Equipes: ${teams}.`);
      for (const index of indexes) {
        errors[`${prefix}-${index}`] =
          `${employee ? 'Funcionário repetido' : 'Veículo repetido'} nas equipes ${teams}. Escolha outro.`;
      }
    }
  }
  if (duplicates.length) errors.duplicates = duplicates.join('\n\n');
  return errors;
}
export function validateMaintenance(value: Maintenance, catalogs: Catalogs): Errors {
  const errors: Errors = {};
  if (!validDate(value.date)) errors.date = 'Escolha uma data válida.';
  else if (value.date > localDate()) errors.date = 'A data não pode ser posterior a hoje.';
  if (!catalogs.contracts.some((c) => c.id === value.contractId && c.ativo))
    errors.contract = 'Escolha um contrato da lista.';
  if (!catalogs.maintenanceTypes.some((c) => c.id === value.typeId && c.ativo))
    errors.type = 'Escolha o tipo da lista.';
  if (value.driverUnidentified) {
    if (value.driverId !== null) errors.driver = 'Confira a identificação do motorista.';
  } else if (!catalogs.employees.some((e) => e.id === value.driverId && e.ativo && !e.is_status))
    errors.driver = 'Escolha um motorista ou marque Motorista não identificado.';
  if (!catalogs.vehicles.some((v) => v.id === value.vehicleId && v.ativo))
    errors.vehicle = 'Escolha uma placa da lista.';
  if (!/^\d{1,12}$/.test(value.costDigits))
    errors.cost = 'Informe o custo. Para custo zero, digite 0.';
  return errors;
}
