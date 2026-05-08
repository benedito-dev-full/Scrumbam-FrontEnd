/**
 * Tipos discriminados de notificacao in-app suportados.
 *
 * O backend usa strings livres em DNotification.type, mas estes literais
 * representam os contratos atualmente conhecidos e renderizados.
 */
export type InAppNotificationType =
  | "status_changed"
  | "team.member.added"
  | "team.member.removed"
  | "team.member.role_changed"
  // fallback para tipos legados/futuros nao tratados explicitamente
  | (string & {});

/** Notificacao in-app (status changes, team membership, etc.) */
export interface InAppNotification {
  id: string;
  type: InAppNotificationType;
  title: string;
  message: string;
  isRead: boolean;
  dados: {
    // status_changed
    intentionId?: string;
    projectId?: string;
    fromStatus?: string;
    toStatus?: string;
    // team.member.* (Times + Convites Fase 1)
    teamId?: string;
    teamName?: string;
    actorUserId?: string;
    cargo?: string;
    previousCargo?: string;
    newCargo?: string;
  } | null;
  criadoEm: string;
  projectId: string | null;
  taskId: string | null;
}

export interface UnreadCountResponse {
  count: number;
}

export interface MarkReadResponse {
  updated: number;
}
