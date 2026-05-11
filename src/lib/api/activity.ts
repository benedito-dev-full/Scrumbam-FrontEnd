import api from "./client";
import { ENDPOINTS } from "./endpoints";

export interface ActivityQueryParams {
  cursor?: string;
  limit?: number;
}

interface V2ActivityItem {
  id: string;
  tipo: string;
  metaDados: Record<string, unknown> | null;
  criadoEm: string;
}

interface V2ActivityResponse {
  items: V2ActivityItem[];
  pagination: {
    hasMore: boolean;
    nextCursor: string | null;
  };
}

/**
 * Categoria amigavel do evento — usada pra filtrar e estilizar.
 */
export type ActivityCategory = "created" | "status" | "deleted" | "other";

/**
 * Evento de atividade enriquecido para a UI.
 */
export interface ProjectActivity {
  id: string;
  /** Tipo bruto do V2 (ex: "task.created", "task.status.changed"). */
  rawTipo: string;
  /** Categoria amigavel (created/status/deleted/other) — para filtros e icone. */
  category: ActivityCategory;
  /** Mensagem humanizada em PT pronta para render. */
  message: string;
  /** ID da task vinculada quando aplicavel. */
  taskId: string | null;
  /** Identifier publico (ex: "DEV-7") quando disponivel. */
  identifier: string | null;
  /** Nome curto da task quando disponivel. */
  taskNome: string | null;
  /** ID do ator (DEntidade.chave). */
  actorId: string | null;
  /** Nome do ator quando V2 hidrata via `userName` no metaDados. */
  actorName: string | null;
  /** Status anterior em transicoes (ex: "INBOX"). */
  fromStatus: string | null;
  /** Status novo em transicoes (ex: "READY"). */
  toStatus: string | null;
  /** Timestamp ISO 8601. */
  timestamp: string;
}

const STATUS_PT: Record<string, string> = {
  INBOX: "Inbox",
  READY: "Pronto",
  EXECUTING: "Em execucao",
  VALIDATING: "Validando",
  VALIDATED: "Validado",
  DONE: "Concluido",
  FAILED: "Falhou",
  CANCELLED: "Cancelado",
  DISCARDED: "Descartado",
};

function statusLabel(s: string | null | undefined): string {
  if (!s) return "";
  return STATUS_PT[s] ?? s;
}

function pickStr(meta: Record<string, unknown>, key: string): string | null {
  const v = meta[key];
  return v !== undefined && v !== null ? String(v) : null;
}

function categorize(tipo: string): ActivityCategory {
  if (tipo === "task.created") return "created";
  if (tipo.startsWith("task.status")) return "status";
  if (
    tipo === "task.deleted" ||
    tipo === "project.deleted" ||
    tipo === "org.deleted"
  )
    return "deleted";
  return "other";
}

function buildMessage(
  rawTipo: string,
  category: ActivityCategory,
  meta: Record<string, unknown>,
): string {
  const identifier = pickStr(meta, "identifier");
  const taskNome = pickStr(meta, "nome") ?? pickStr(meta, "taskNome");
  const from = pickStr(meta, "from");
  const to = pickStr(meta, "to");
  const tag = identifier ? `[${identifier}] ` : "";

  switch (category) {
    case "created":
      return `${tag}Task criada${taskNome ? `: ${taskNome}` : ""}`;
    case "status":
      if (from && to) {
        return `${tag}Movida de ${statusLabel(from)} para ${statusLabel(to)}`;
      }
      if (to) return `${tag}Movida para ${statusLabel(to)}`;
      return `${tag}Status atualizado`;
    case "deleted":
      if (rawTipo === "project.deleted") return "Projeto excluido";
      if (rawTipo === "org.deleted") return "Organizacao excluida";
      return `${tag}Task excluida`;
    default:
      return `${tag}${rawTipo}`;
  }
}

function mapEvent(raw: V2ActivityItem): ProjectActivity {
  const meta = raw.metaDados ?? {};
  const category = categorize(raw.tipo);
  return {
    id: String(raw.id),
    rawTipo: raw.tipo,
    category,
    message: buildMessage(raw.tipo, category, meta),
    taskId: pickStr(meta, "taskId"),
    identifier: pickStr(meta, "identifier"),
    taskNome: pickStr(meta, "nome") ?? pickStr(meta, "taskNome"),
    actorId: pickStr(meta, "userId") ?? pickStr(meta, "movedBy"),
    actorName: pickStr(meta, "userName"),
    fromStatus: pickStr(meta, "from"),
    toStatus: pickStr(meta, "to"),
    timestamp: raw.criadoEm,
  };
}

export const activityApi = {
  /**
   * Busca timeline de atividade de um projeto (V2 /projects/:id/activity).
   *
   * V2 filtra automaticamente por `idEntidade=projectId`, retornando
   * DEventos das classes -497 (task.created), -498 (status.changed),
   * -499 (project.deleted), -500 (org.deleted).
   */
  getProjectActivity: async (
    projectId: string,
    params?: ActivityQueryParams,
  ): Promise<{
    events: ProjectActivity[];
    hasMore: boolean;
    nextCursor: string | null;
    projectId: string;
  }> => {
    const { data } = await api.get<V2ActivityResponse>(
      ENDPOINTS.PROJECT_ACTIVITY(projectId),
      { params },
    );

    return {
      events: (data.items ?? []).map(mapEvent),
      hasMore: data.pagination?.hasMore ?? false,
      nextCursor: data.pagination?.nextCursor ?? null,
      projectId,
    };
  },
};
