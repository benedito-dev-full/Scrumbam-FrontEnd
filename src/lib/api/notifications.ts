import type {
  NotificationConfig,
  ConfigureNotificationDto,
  TestNotificationDto,
} from "@/types";

/**
 * Stub — V2 nao implementa endpoints /integrations/notifications/{configure,test}.
 */
export const notificationsApi = {
  configure: async (
    dto: ConfigureNotificationDto,
  ): Promise<NotificationConfig> => {
    return {
      chave: `stub-${Date.now()}`,
      type: dto.type,
      configured: false,
      atualizadoEm: new Date().toISOString(),
    };
  },

  test: async (
    _dto: TestNotificationDto,
  ): Promise<{ success: boolean; message: string }> => {
    return {
      success: false,
      message: "Integração de notificações ainda não disponível no V2.",
    };
  },
};
