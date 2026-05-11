import type {
  Column,
  CreateColumnDto,
  UpdateColumnDto,
  ReorderColumnsDto,
} from "@/types";

// Stub V2: V2 nao tem CRUD de colunas — estados V3 sao fixos.
// `list` retorna os 9 estados V3 como Columns para o UI funcionar
// (ex: dropdown "Mover para" no card-details-form).
// Outros metodos sao no-op.

const V3_STATES: Array<{
  chave: string;
  nome: string;
  codigo: string;
  cor: string;
}> = [
  { chave: "INBOX", nome: "Inbox", codigo: "INBOX", cor: "#94a3b8" },
  { chave: "READY", nome: "Pronto", codigo: "READY", cor: "#3b82f6" },
  {
    chave: "EXECUTING",
    nome: "Em execucao",
    codigo: "EXECUTING",
    cor: "#f59e0b",
  },
  {
    chave: "VALIDATING",
    nome: "Validando",
    codigo: "VALIDATING",
    cor: "#a855f7",
  },
  { chave: "VALIDATED", nome: "Validado", codigo: "VALIDATED", cor: "#8b5cf6" },
  { chave: "DONE", nome: "Concluido", codigo: "DONE", cor: "#22c55e" },
  { chave: "FAILED", nome: "Falhou", codigo: "FAILED", cor: "#ef4444" },
  {
    chave: "CANCELLED",
    nome: "Cancelado",
    codigo: "CANCELLED",
    cor: "#6b7280",
  },
  {
    chave: "DISCARDED",
    nome: "Descartado",
    codigo: "DISCARDED",
    cor: "#6b7280",
  },
];

export const columnsApi = {
  list: async (projectId: string): Promise<Column[]> => {
    const criadoEm = new Date(0).toISOString();
    return V3_STATES.map((s, i) => ({
      chave: s.chave,
      nome: s.nome,
      codigo: s.codigo,
      wipLimit: null,
      wipBlocking: false,
      ordem: i,
      cor: s.cor,
      projectId,
      criadoEm,
    }));
  },

  // V2 nao suporta CRUD de colunas — estados V3 sao fixos.
  create: async (
    _projectId: string,
    _dto: CreateColumnDto,
  ): Promise<Column> => {
    throw new Error(
      "Criar coluna nao disponivel no V2 — estados V3 sao fixos.",
    );
  },

  update: async (
    _projectId: string,
    _columnId: string,
    _dto: UpdateColumnDto,
  ): Promise<Column> => {
    throw new Error(
      "Editar coluna nao disponivel no V2 — estados V3 sao fixos.",
    );
  },

  reorder: async (
    _projectId: string,
    _dto: ReorderColumnsDto,
  ): Promise<void> => {
    return; // no-op silencioso
  },

  delete: async (
    _projectId: string,
    _columnId: string,
    _targetColumnId: string,
  ): Promise<void> => {
    throw new Error(
      "Remover coluna nao disponivel no V2 — estados V3 sao fixos.",
    );
  },
};
