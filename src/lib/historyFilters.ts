import type { HistoryFilters, HistoryItem, Maintenance, Registration } from '@/types/models';
import { displayDate, validDate } from './format';

export function defaultHistoryFilters(now = new Date()): HistoryFilters {
  const today = historyDay(now);
  const start = new Date(`${today}T12:00:00Z`);
  start.setUTCDate(start.getUTCDate() - 6);
  return {
    from: start.toISOString().slice(0, 10),
    to: today,
    driverIds: [],
    vehicleIds: [],
    contractIds: [],
    authorIds: [],
    maintenanceTypeIds: [],
  };
}

export function isDefaultHistoryPeriod(filters: HistoryFilters, now = new Date()) {
  const defaults = defaultHistoryFilters(now);
  return filters.from === defaults.from && filters.to === defaults.to;
}

export function historyDateErrors(filters: HistoryFilters) {
  const errors = {
    from: !filters.from
      ? 'Informe a data inicial.'
      : !validDate(filters.from)
        ? 'Informe uma data inicial válida.'
        : '',
    to: !filters.to
      ? 'Informe a data final.'
      : !validDate(filters.to)
        ? 'Informe uma data final válida.'
        : '',
  };
  if (!errors.from && !errors.to && filters.from > filters.to) {
    errors.from = 'A data inicial deve ser anterior ou igual à data final.';
    errors.to = 'A data final deve ser posterior ou igual à data inicial.';
  }
  return errors;
}

export function historyPeriodLabel(filters: HistoryFilters) {
  if (isDefaultHistoryPeriod(filters)) return 'Últimos 7 dias';
  if (!filters.from && !filters.to) return 'Sem limite de datas';
  if (filters.from && filters.to)
    return `${displayDate(filters.from)} a ${displayDate(filters.to)}`;
  return filters.from
    ? `A partir de ${displayDate(filters.from)}`
    : `Até ${displayDate(filters.to)}`;
}

export function historyFilterCount(filters: HistoryFilters) {
  return [
    filters.driverIds,
    filters.vehicleIds,
    filters.contractIds,
    filters.authorIds,
    filters.maintenanceTypeIds,
  ].filter((values) => values.length > 0).length;
}

export const historyDay = (value: string | Date) =>
  new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));

export function matchesHistoryFilters(
  item: HistoryItem,
  entry: Registration | Maintenance,
  filters: HistoryFilters,
) {
  const { from, to } = filters;
  const date = item.data;
  if ((from && date < from) || (to && date > to)) return false;
  if (filters.contractIds.length && !filters.contractIds.includes(entry.contractId!)) return false;
  // A demonstracao nao possui contas reais; sua unica autoria e identificada por demo.
  if (filters.authorIds.length && !filters.authorIds.includes('demo')) return false;
  if (item.tipo === 'registro') {
    return (entry as Registration).teams.some(
      (team) =>
        (!filters.driverIds.length || filters.driverIds.includes(team.responsavel_id!)) &&
        (!filters.vehicleIds.length || filters.vehicleIds.includes(team.veiculo_id!)),
    );
  }
  const maintenance = entry as Maintenance;
  return (
    (!filters.driverIds.length || filters.driverIds.includes(maintenance.driverId ?? 0)) &&
    (!filters.vehicleIds.length || filters.vehicleIds.includes(maintenance.vehicleId!)) &&
    (!filters.maintenanceTypeIds.length || filters.maintenanceTypeIds.includes(maintenance.typeId!))
  );
}
