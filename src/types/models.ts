export type Reference = { id: number; nome: string; ativo: boolean };
export type Employee = Reference & { is_status: boolean };
export type Vehicle = {
  id: number;
  placa: string;
  modelo: string;
  tipo: 'veiculo' | 'equipamento';
  ativo: boolean;
};
export type Profile = {
  id: string;
  nome: string;
  sobrenome: string;
  login: string;
  ativo: boolean;
  perfil: 'funcionario' | 'admin';
};
export type Catalogs = {
  employees: Employee[];
  vehicles: Vehicle[];
  contracts: Reference[];
  maintenanceTypes: Reference[];
};
export type Team = { responsavel_id: number | null; veiculo_id: number | null };
export type Registration = {
  id: string;
  date: string;
  contractId: number | null;
  teams: Team[];
  version?: number;
};
export type Maintenance = {
  id: string;
  date: string;
  typeId: number | null;
  driverId: number | null;
  driverUnidentified?: boolean;
  contractId: number | null;
  vehicleId: number | null;
  costDigits: string;
  note?: string;
  version?: number;
};
export type HistoryDetail = {
  equipe?: number;
  servico?: string;
  observacao?: string | null;
  responsavel: string | null;
  placa: string;
  modelo: string;
};
export type HistoryItem = {
  id: string;
  tipo: 'registro' | 'manutencao';
  data: string;
  contrato: string;
  placas: string[];
  detalhes: HistoryDetail[];
  custo: number | null;
  created_at: string;
  autor_nome: string;
};
export type HistoryFilter = 'registro' | 'manutencao';
export type HistoryFilters = {
  from: string;
  to: string;
  driverIds: number[];
  vehicleIds: number[];
  contractIds: number[];
  authorIds: string[];
  maintenanceTypeIds: number[];
};
export type HistoryFilterOptions = {
  drivers: { id: number; nome: string }[];
  vehicles: { id: number; placa: string; modelo: string }[];
  contracts: { id: number; nome: string }[];
  authors: { id: string; nome: string; sobrenome: string; login: string }[];
  maintenanceTypes: { id: number; nome: string }[];
};
export type LastDriverVehicle = { vehicleId: number; date: string };
