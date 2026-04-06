export interface Column {
  chave: string;
  nome: string;
  codigo: string;
  wipLimit: number | null;
  wipBlocking: boolean;
  ordem: number;
  cor: string | null;
  projectId: string;
  criadoEm: string;
}

export interface CreateColumnDto {
  nome: string;
  codigo?: string;
  wipLimit?: number;
  wipBlocking?: boolean;
  cor?: string;
}

export interface UpdateColumnDto {
  nome?: string;
  wipLimit?: number | null;
  wipBlocking?: boolean;
  cor?: string | null;
}

export interface ReorderColumnsDto {
  items: Array<{ chave: string; ordem: number }>;
}
