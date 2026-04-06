/** Notificacao in-app (status changes, assignments, etc.) */
export interface InAppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  dados: {
    intentionId?: string;
    projectId?: string;
    fromStatus?: string;
    toStatus?: string;
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
