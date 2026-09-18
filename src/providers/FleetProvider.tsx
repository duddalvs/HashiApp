import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';
import { randomUUID } from 'expo-crypto';
import type {
  Catalogs,
  HistoryFilter,
  HistoryItem,
  Maintenance,
  Registration,
} from '@/types/models';
import * as api from '@/lib/api';
import { costFromDigits, friendlyError, localDate, normalize } from '@/lib/format';
import { demoCatalogs } from '@/data/demo';
import { useAuth } from './AuthProvider';
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
});
type FleetContextValue = {
  catalogs: Catalogs;
  loading: boolean;
  error: string;
  reload: () => void;
  registration: Registration;
  setRegistration: React.Dispatch<React.SetStateAction<Registration>>;
  maintenance: Maintenance;
  setMaintenance: React.Dispatch<React.SetStateAction<Maintenance>>;
  saveRegistration: (data: Registration) => Promise<void>;
  saveMaintenance: (data: Maintenance) => Promise<void>;
  history: (query: string, offset: number, type: HistoryFilter) => Promise<HistoryItem[]>;
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
      created_at: demoHistory.find((r) => r.id === data.id)?.created_at ?? new Date().toISOString(),
    };
    setDemoHistory((rows) => [item, ...rows.filter((r) => r.id !== data.id)]);
  }
  async function saveMaintenance(data: Maintenance) {
    if (!demo) return api.saveMaintenance(data);
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
          responsavel: catalogs.employees.find((e) => e.id === data.driverId)?.nome ?? null,
          placa: vehicle.placa,
          modelo: vehicle.modelo,
        },
      ],
      custo: costFromDigits(data.costDigits),
      created_at: demoHistory.find((r) => r.id === data.id)?.created_at ?? new Date().toISOString(),
    };
    setDemoHistory((rows) => [item, ...rows.filter((r) => r.id !== data.id)]);
  }
  const history = useCallback(
    async (query: string, offset: number, type: HistoryFilter) => {
      if (!demo) return api.getHistory(query, offset, type);
      const normal = (text: string) => normalize(text).replace(/-/g, '');
      return demoHistory
        .filter(
          (h) =>
            h.tipo === type &&
            normal(`${h.contrato} ${h.placas.join(' ')}`).includes(normal(query)),
        )
        .slice(offset, offset + 21);
    },
    [demo, demoHistory],
  );
  return (
    <FleetContext.Provider
      value={{
        catalogs,
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
