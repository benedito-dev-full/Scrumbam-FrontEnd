import api from "./client";
import { ENDPOINTS } from "./endpoints";
import type {
  InAppNotification,
  UnreadCountResponse,
  MarkReadResponse,
} from "@/types";

export const inAppNotificationsApi = {
  list: async (params?: {
    onlyUnread?: boolean;
    limit?: number;
    cursor?: string;
  }): Promise<InAppNotification[]> => {
    const query = new URLSearchParams();
    if (params?.onlyUnread) query.set("onlyUnread", "true");
    if (params?.limit) query.set("limit", params.limit.toString());
    if (params?.cursor) query.set("cursor", params.cursor);

    const url = query.toString()
      ? `${ENDPOINTS.IN_APP_NOTIFICATIONS}?${query.toString()}`
      : ENDPOINTS.IN_APP_NOTIFICATIONS;

    // V2 retorna { items, pagination } — legacy retornava array
    const { data } = await api.get(url);
    if (Array.isArray(data)) return data as InAppNotification[];
    return (data?.items ?? []) as InAppNotification[];
  },

  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    const { data } = await api.get<UnreadCountResponse>(
      ENDPOINTS.IN_APP_NOTIFICATIONS_UNREAD_COUNT,
    );
    return data;
  },

  /**
   * Marca varias notificacoes como lidas.
   *
   * V2 nao tem bulk endpoint — emulamos chamando PATCH /notifications/:id/read
   * em paralelo para cada id.
   */
  markAsRead: async (ids: string[]): Promise<MarkReadResponse> => {
    if (!ids?.length) {
      return { updated: 0 } as MarkReadResponse;
    }
    const results = await Promise.allSettled(
      ids.map((id) =>
        api.patch(`${ENDPOINTS.IN_APP_NOTIFICATIONS}/${id}/read`),
      ),
    );
    const updated = results.filter((r) => r.status === "fulfilled").length;
    return { updated } as MarkReadResponse;
  },

  /** V2 usa PATCH (legacy era PUT). */
  markAllAsRead: async (): Promise<MarkReadResponse> => {
    const { data } = await api.patch<MarkReadResponse>(
      ENDPOINTS.IN_APP_NOTIFICATIONS_READ_ALL,
    );
    return data;
  },

  remove: async (id: string): Promise<{ deleted: boolean }> => {
    const { data } = await api.delete<{ deleted: boolean }>(
      ENDPOINTS.IN_APP_NOTIFICATION(id),
    );
    return data;
  },
};
