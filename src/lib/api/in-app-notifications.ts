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

    const { data } = await api.get<InAppNotification[]>(url);
    return data;
  },

  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    const { data } = await api.get<UnreadCountResponse>(
      ENDPOINTS.IN_APP_NOTIFICATIONS_UNREAD_COUNT,
    );
    return data;
  },

  markAsRead: async (ids: string[]): Promise<MarkReadResponse> => {
    const { data } = await api.put<MarkReadResponse>(
      ENDPOINTS.IN_APP_NOTIFICATIONS_READ,
      { ids },
    );
    return data;
  },

  markAllAsRead: async (): Promise<MarkReadResponse> => {
    const { data } = await api.put<MarkReadResponse>(
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
