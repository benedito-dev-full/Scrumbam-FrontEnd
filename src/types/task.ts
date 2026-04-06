import type { Lookup } from "./common";

export interface Task {
  chave: string;
  titulo: string;
  descricao: string | null;
  idProject: string;
  assignee: { chave: string; nome: string; isAIAgent?: boolean } | null;
  status: Lookup;
  prioridade: Lookup | null;
  tipoTask: Lookup | null;
  sprint: Lookup | null;
  ordem: number;
  estimativaHoras: number | null;
  estimativaIA: number | null;
  apetiteDias: number | null;
  apetiteInicio: string | null;
  idParentTask: string | null;
  tagIds: string | null;
  tags: TaskTag[];
  problema: string | null;
  contexto: string | null;
  solucaoProposta: string | null;
  criteriosAceite: string | null;
  naoObjetivos: string | null;
  riscos: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

export interface TaskTag {
  chave: string;
  nome: string;
  cor: string | null;
}

export interface CreateTaskDto {
  titulo: string;
  descricao?: string;
  idProject: string;
  idStatus?: string;
  idAssignee?: string;
  idPrioridade?: string;
  idTipoTask?: string;
  idSprint?: string;
}

export interface UpdateTaskDto {
  titulo?: string;
  descricao?: string;
  idAssignee?: string;
  idPrioridade?: string;
  idTipoTask?: string;
  idSprint?: string;
  estimativaHoras?: number;
  problema?: string;
  contexto?: string;
  solucaoProposta?: string;
  criteriosAceite?: string;
  naoObjetivos?: string;
  riscos?: string;
}

export interface MoveTaskStatusDto {
  idStatus: string;
}

export interface ReorderTasksDto {
  items: Array<{ chave: string; ordem: number }>;
}
