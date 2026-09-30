import type {
  Catalogs,
  HistoryFilter,
  HistoryFilters,
  HistoryFilterOptions,
  HistoryItem,
  Maintenance,
  Profile,
  Registration,
  LastDriverVehicle,
} from '@/types/models';
import { sessionRpc } from './session';
import { costFromDigits } from './format';

export async function getLastDriverVehicle(
  driverId: number,
  excludeId: string,
): Promise<LastDriverVehicle | null> {
  const { data, error } = await sessionRpc('ultimo_veiculo_motorista', {
    p_motorista_id: driverId,
    p_excluir_registro: excludeId,
  });
  if (error) throw error;
  return data as LastDriverVehicle | null;
}

export async function getProfile(): Promise<Profile> {
  const { data, error } = await sessionRpc('meu_perfil');
  if (error) throw error;
  return data as Profile;
}
export async function getCatalogs(): Promise<Catalogs> {
  const { data, error } = await sessionRpc('listar_catalogos');
  if (error) throw error;
  const { employees, vehicles, contracts, maintenanceTypes } = data as Catalogs;
  return {
    employees: employees
      .filter((e) => !e.is_status)
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    vehicles: vehicles.sort((a, b) => a.placa.localeCompare(b.placa)),
    contracts: contracts.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    maintenanceTypes,
  };
}
export async function saveRegistration(value: Registration) {
  const { error } = await sessionRpc(value.version ? 'editar_registro' : 'salvar_registro', {
    p_id: value.id,
    p_data: value.date,
    p_contrato_id: value.contractId,
    p_equipes: value.teams,
    ...(value.version ? { p_versao: value.version } : {}),
  });
  if (error) throw error;
}
export async function saveMaintenance(value: Maintenance) {
  const { error } = await sessionRpc(value.version ? 'editar_manutencao' : 'salvar_manutencao', {
    p_id: value.id,
    p_data: value.date,
    p_tipo_id: value.typeId,
    p_motorista_id: value.driverUnidentified ? null : value.driverId,
    p_contrato_id: value.contractId,
    p_veiculo_id: value.vehicleId,
    p_custo: costFromDigits(value.costDigits),
    p_observacao: value.note ?? '',
    ...(value.version ? { p_versao: value.version } : {}),
  });
  if (error) throw error;
}
export async function getEntry(
  id: string,
  type: HistoryItem['tipo'],
): Promise<Registration | Maintenance> {
  const { data, error } = await sessionRpc('obter_envio', { p_id: id, p_tipo: type });
  if (error) throw error;
  if (!data) throw new Error('Registro não encontrado ou sem permissão.');
  return type === 'manutencao'
    ? { ...data, note: data.note ?? '', driverUnidentified: data.driverId === null }
    : data;
}
export async function deleteEntry(id: string, type: HistoryItem['tipo']) {
  const { error } = await sessionRpc('apagar_envio', { p_id: id, p_tipo: type });
  if (error) throw error;
}
export async function getHistoryFilterOptions(): Promise<HistoryFilterOptions> {
  const { data, error } = await sessionRpc('opcoes_filtros_historico_completas');
  if (error) throw error;
  return data as HistoryFilterOptions;
}
export async function getHistory(
  filters: HistoryFilters,
  offset: number,
  type: HistoryFilter,
): Promise<HistoryItem[]> {
  const { data, error } = await sessionRpc('filtrar_historico_multiplos', {
    p_data_de: filters.from || null,
    p_data_ate: filters.to || null,
    p_motorista_ids: filters.driverIds,
    p_veiculo_ids: filters.vehicleIds,
    p_contrato_ids: filters.contractIds,
    p_autor_ids: filters.authorIds,
    p_tipo_manutencao_ids: type === 'manutencao' ? filters.maintenanceTypeIds : [],
    p_limite: 21,
    p_offset: offset,
    p_tipo: type,
  });
  if (error) throw error;
  return data as HistoryItem[];
}
