export interface ProjectResponsavel {
  chave: string;
  nome: string;
}

export interface Project {
  chave: string;
  nome: string;
  descricao: string | null;
  dataInicio: string | null;
  dataFim: string | null;
  criadoEm: string;
  taskCount: number;
  responsavel: ProjectResponsavel | null;
  /** ID do time (DEntidade idClasse=-460). null quando projeto nao esta vinculado a team. */
  teamId?: string | null;
}

export interface ProjectDetail {
  chave: string;
  nome: string;
  descricao: string | null;
  dataInicio: string | null;
  dataFim: string | null;
  criadoEm: string;
  idResponsavel: string | null;
  responsavel: ProjectResponsavel | null;
}

export interface CreateProjectDto {
  nome: string;
  descricao?: string;
  /** ID do time (DEntidade idClasse=-460) ao qual o projeto sera vinculado. */
  idTeam?: string;
  /** IDs (DEntidade.chave) dos membros iniciais. Caller sempre vira MANAGER. */
  memberIds?: string[];
}

/**
 * DTO para edicao de projeto via PATCH /projects/:id.
 *
 * Todos os campos sao opcionais. Apenas os enviados serao atualizados.
 *
 * - `idTeam: null` desvincula explicitamente o projeto do time atual.
 * - `idTeam: undefined` (omitido) preserva o vinculo atual.
 * - axios envia `null` no body (vs `undefined`, que omite).
 */
export interface UpdateProjectDto {
  nome?: string;
  descricao?: string;
  idTeam?: string | null;
  startDate?: string;
}

export interface ProjectLastActivity {
  timestamp: string;
  eventType: string;
  intentionTitle: string;
}

export interface ProjectSummary {
  projectId: string;
  projectName: string;
  taskCount: number;
  weeklyThroughput: number;
  lastActivity: ProjectLastActivity | null;
  connectionStatus: "active" | "idle" | "inactive";
}

export interface DeleteProjectResponse {
  deleted: boolean;
  id: string;
  projectName: string;
  counts: {
    tasks: number;
    members: number;
    webhooks: number;
    notifications: number;
  };
  agentUnlinked: boolean;
  message: string;
}
