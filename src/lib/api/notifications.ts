import api from "./client";
import { ENDPOINTS } from "./endpoints";
import type {
  NotificationConfig,
  ConfigureNotificationDto,
  TestNotificationDto,
} from "@/types";

export const notificationsApi = {
  configure: async (
    dto: ConfigureNotificationDto,
  ): Promise<NotificationConfig> => {
    const { data } = await api.post<NotificationConfig>(
      ENDPOINTS.NOTIFICATIONS_CONFIGURE,
      dto,
    );
    return data;
  },

  test: async (
    dto: TestNotificationDto,
  ): Promise<{ success: boolean; message: string }> => {
    const { data } = await api.post<{ success: boolean; message: string }>(
      ENDPOINTS.NOTIFICATIONS_TEST,
      dto,
    );
    return data;
  },
};
