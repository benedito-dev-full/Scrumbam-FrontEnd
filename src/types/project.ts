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
