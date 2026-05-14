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
  /**
   * ID do time (DEntidade idClasse=-180) ao qual o projeto sera vinculado.
   * Backend V2 espera `teamId` (DVincula -182, ADR-V2-029). Campo legacy
   * `idTeam` aceito por compat e mapeado para `teamId` no API client.
   */
  teamId?: string;
  /** @deprecated usar `teamId`. Mantido apenas para compat. */
  idTeam?: string;
  /** IDs (DEntidade.chave) dos membros iniciais. Caller sempre vira MANAGER. */
  memberIds?: string[];
}

/**
 * DTO para edicao de projeto via PATCH /projects/:id.
 *
 * Todos os campos sao opcionais. Apenas os enviados serao atualizados.
 *
 * Convencao do backend V2 (ADR-V2-029):
 * - `teamId: null` desvincula explicitamente o projeto do time atual.
 * - `teamId: undefined` (omitido) preserva o vinculo atual.
 * - axios envia `null` no body (vs `undefined`, que omite).
 *
 * O campo `idTeam` e LEGACY e foi renomeado para `teamId`. O API client
 * faz a traducao quando recebe `idTeam` no DTO, mas novo codigo deve usar
 * `teamId` direto.
 */
export interface UpdateProjectDto {
  nome?: string;
  descricao?: string;
  /** Veja `CreateProjectDto.teamId`. `null` desvincula, omitir preserva. */
  teamId?: string | null;
  /** @deprecated usar `teamId`. Mantido apenas para compat. */
  idTeam?: string | null;
  startDate?: string;
  /**
   * ID do novo responsavel (owner) do projeto. `null` para desvincular,
   * `undefined` (omitido) preserva. O backend espelha o ID do usuario que
   * vira owner — apenas membros do projeto sao candidatos validos.
   */
  ownerId?: string | null;
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
