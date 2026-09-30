import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { randomUUID } from 'expo-crypto';
import type {
  Catalogs,
  HistoryFilter,
  HistoryFilters,
  HistoryFilterOptions,
  HistoryItem,
  Maintenance,
  Registration,
  LastDriverVehicle,
} from '@/types/models';
import * as api from '@/lib/api';
import { costFromDigits, friendlyError, localDate } from '@/lib/format';
import { matchesHistoryFilters } from '@/lib/historyFilters';
import { demoCatalogs } from '@/data/demo';
import { useAuth } from './AuthProvider';
import type { Option } from '@/lib/searchOptions';
const emptyCatalogs: Catalogs = {
  employees: [],
  vehicles: [],
  contracts: [],
  maintenanceTypes: [],
};
export const newRegistration = (): Registration => ({
  id: randomUUID(),
  date: localDate(),
  contractId: null,
  teams: [{ responsavel_id: null, veiculo_id: null }],
});
export const newMaintenance = (): Maintenance => ({
  id: randomUUID(),
  date: localDate(),
  typeId: null,
  driverId: null,
  driverUnidentified: false,
  contractId: null,
  vehicleId: null,
  costDigits: '',
  note: '',
});
type FleetContextValue = {
  catalogs: Catalogs;
  employeeOptions: Option[];
  vehicleOptions: Option[];
  getLastDriverVehicle: (driverId: number, excludeId: string) => Promise<LastDriverVehicle | null>;
  loading: boolean;
  error: string;
  reload: () => void;
  registration: Registration;
  setRegistration: React.Dispatch<React.SetStateAction<Registration>>;
  maintenance: Maintenance;
  setMaintenance: React.Dispatch<React.SetStateAction<Maintenance>>;
  saveRegistration: (data: Registration) => Promise<void>;
  saveMaintenance: (data: Maintenance) => Promise<void>;
  history: (filters: HistoryFilters, offset: number, type: HistoryFilter) => Promise<HistoryItem[]>;
  getHistoryFilterOptions: () => Promise<HistoryFilterOptions>;
  getEntry: (id: string, type: HistoryItem['tipo']) => Promise<Registration | Maintenance>;
  deleteEntry: (id: string, type: HistoryItem['tipo']) => Promise<void>;
};
const FleetContext = createContext<FleetContextValue | null>(null);
export function FleetProvider({ children }: PropsWithChildren) {
  const { demo, profile } = useAuth();
  const [catalogs, setCatalogs] = useState<Catalogs>(emptyCatalogs);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [registration, setRegistration] = useState(newRegistration);
  const [maintenance, setMaintenance] = useState(newMaintenance);
  const [demoHistory, setDemoHistory] = useState<HistoryItem[]>([]);
  const [demoEntries, setDemoEntries] = useState<Record<string, Registration | Maintenance>>({});
  const employeeOptions = useMemo(
    () => catalogs.employees.map((e) => ({ id: e.id, label: e.nome })),
    [catalogs.employees],
  );
  const vehicleOptions = useMemo(
    () => catalogs.vehicles.map((v) => ({ id: v.id, label: v.placa, description: v.modelo })),
    [catalogs.vehicles],
  );
  const getLastDriverVehicle = useCallback(
    async (driverId: number, excludeId: string) => {
      if (!demo) return api.getLastDriverVehicle(driverId, excludeId);
      const candidates = demoHistory
        .filter((item) => item.tipo === 'registro' && item.id !== excludeId)
        .sort(
          (a, b) =>
            b.data.localeCompare(a.data) ||
            b.created_at.localeCompare(a.created_at) ||
            b.id.localeCompare(a.id),
        );
      for (const item of candidates) {
        const entry = demoEntries[`registro-${item.id}`] as Registration | undefined;
        const team = entry?.teams.find((t) => t.responsavel_id === driverId);
        if (team?.veiculo_id != null) {
          return catalogs.vehicles.some((v) => v.id === team.veiculo_id && v.ativo)
            ? { vehicleId: team.veiculo_id, date: item.data }
            : null;
        }
      }
      return null;
    },
    [demo, demoHistory, demoEntries, catalogs.vehicles],
  );
  async function getEntry(id: string, type: HistoryItem['tipo']) {
    if (!demo) return api.getEntry(id, type);
    const entry = demoEntries[`${type}-${id}`];
    if (!entry) throw new Error('Registro não encontrado.');
    return { ...entry, version: entry.version ?? 1 };
  }
  async function deleteEntry(id: string, type: HistoryItem['tipo']) {
    if (!demo) return api.deleteEntry(id, type);
    throw new Error('Somente administradores podem apagar registros.');
  }
  useEffect(() => {
    if (demo) {
      setCatalogs(demoCatalogs);
      setLoading(false);
      return;
    }
    if (!profile?.ativo) {
      setCatalogs(emptyCatalogs);
      setLoading(false);
      return;
    }
    let mounted = true;
    setLoading(true);
    setError('');
    api
      .getCatalogs()
      .then((data) => {
        if (mounted) setCatalogs(data);
      })
      .catch((err) => {
        if (mounted) setError(friendlyError(err));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [demo, profile?.id, profile?.ativo, revision]);
  async function saveRegistration(data: Registration) {
    if (!demo) return api.saveRegistration(data);
    const previous = demoHistory.find((r) => r.id === data.id && r.tipo === 'registro');
    setDemoEntries((entries) => ({
      ...entries,
      [`registro-${data.id}`]: { ...data, version: (data.version ?? 0) + 1 },
    }));
    const item: HistoryItem = {
      id: data.id,
      tipo: 'registro',
      data: data.date,
      contrato: catalogs.contracts.find((c) => c.id === data.contractId)!.nome,
      placas: data.teams.map((t) => catalogs.vehicles.find((v) => v.id === t.veiculo_id)!.placa),
      detalhes: data.teams.map((t, i) => ({
        equipe: i + 1,
        responsavel: catalogs.employees.find((e) => e.id === t.responsavel_id)!.nome,
        placa: catalogs.vehicles.find((v) => v.id === t.veiculo_id)!.placa,
        modelo: catalogs.vehicles.find((v) => v.id === t.veiculo_id)!.modelo,
      })),
      custo: null,
      created_at: previous?.created_at ?? new Date().toISOString(),
      autor_nome: previous?.autor_nome ?? profile?.nome ?? 'Usuário de demonstração',
    };
    setDemoHistory((rows) => [item, ...rows.filter((r) => r.id !== data.id)]);
  }
  async function saveMaintenance(data: Maintenance) {
    if (!demo) return api.saveMaintenance(data);
    const previous = demoHistory.find((r) => r.id === data.id && r.tipo === 'manutencao');
    setDemoEntries((entries) => ({
      ...entries,
      [`manutencao-${data.id}`]: { ...data, version: (data.version ?? 0) + 1 },
    }));
    const vehicle = catalogs.vehicles.find((v) => v.id === data.vehicleId)!;
    const item: HistoryItem = {
      id: data.id,
      tipo: 'manutencao',
      data: data.date,
      contrato: catalogs.contracts.find((c) => c.id === data.contractId)!.nome,
      placas: [vehicle.placa],
      detalhes: [
        {
          servico: catalogs.maintenanceTypes.find((t) => t.id === data.typeId)!.nome,
          observacao: data.note?.trim() || null,
          responsavel: catalogs.employees.find((e) => e.id === data.driverId)?.nome ?? null,
          placa: vehicle.placa,
          modelo: vehicle.modelo,
        },
      ],
      custo: costFromDigits(data.costDigits),
      created_at: previous?.created_at ?? new Date().toISOString(),
      autor_nome: previous?.autor_nome ?? profile?.nome ?? 'Usuário de demonstração',
    };
    setDemoHistory((rows) => [item, ...rows.filter((r) => r.id !== data.id)]);
  }
  const history = useCallback(
    async (filters: HistoryFilters, offset: number, type: HistoryFilter) => {
      if (!demo) return api.getHistory(filters, offset, type);
      return demoHistory
        .filter(
          (h) =>
            h.tipo === type && matchesHistoryFilters(h, demoEntries[`${h.tipo}-${h.id}`], filters),
        )
        .sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id.localeCompare(a.id))
        .slice(offset, offset + 21);
    },
    [demo, demoHistory, demoEntries],
  );
  const getHistoryFilterOptions = useCallback(async (): Promise<HistoryFilterOptions> => {
    if (!demo) return api.getHistoryFilterOptions();
    return {
      drivers: catalogs.employees,
      vehicles: catalogs.vehicles,
      contracts: catalogs.contracts,
      authors: demoHistory.length
        ? [{ id: 'demo', nome: 'Usuário de demonstração', sobrenome: '', login: 'Demonstração' }]
        : [],
      maintenanceTypes: catalogs.maintenanceTypes,
    };
  }, [demo, catalogs, demoHistory]);
  return (
    <FleetContext.Provider
      value={{
        catalogs,
        employeeOptions,
        vehicleOptions,
        getLastDriverVehicle,
        loading,
        error,
        reload: () => setRevision((r) => r + 1),
        registration,
        setRegistration,
        maintenance,
        setMaintenance,
        saveRegistration,
        saveMaintenance,
        history,
        getHistoryFilterOptions,
        getEntry,
        deleteEntry,
      }}
    >
      {children}
    </FleetContext.Provider>
  );
}
export function useFleet() {
  const value = useContext(FleetContext);
  if (!value) throw new Error('FleetProvider ausente');
  return value;
}
