import type { Catalogs } from '@/types/models';
// Dados ilustrativos: só usados ao entrar explicitamente na demonstração de desenvolvimento.
export const demoCatalogs: Catalogs = {
  employees: [
    { id: 1, nome: 'João — exemplo', ativo: true, is_status: false },
    { id: 2, nome: 'Maria — exemplo', ativo: true, is_status: false },
  ],
  vehicles: [
    { id: 1, placa: 'BBE9E90', modelo: 'M.BENZ/ACCELO 815 CE', tipo: 'veiculo', ativo: true },
    { id: 2, placa: 'BBE9E35', modelo: 'PENDENTE - ALTERAR 1', tipo: 'veiculo', ativo: true },
    { id: 3, placa: 'SP-6539', modelo: 'RETROESCAVADEIRA', tipo: 'equipamento', ativo: true },
  ],
  contracts: [
    { id: 1, nome: 'Belford Roxo', ativo: true },
    { id: 2, nome: 'São Gonçalo', ativo: true },
    { id: 3, nome: 'Magé', ativo: true },
  ],
  maintenanceTypes: [
    'Preventiva',
    'Corretiva',
    'Revisão',
    'Pneus',
    'Elétrica',
    'Mecânica',
    'Funilaria',
    'Outros',
  ].map((nome, index) => ({ id: index + 1, nome, ativo: true })),
};
