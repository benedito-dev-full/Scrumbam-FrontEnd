// Notification integration types -- aligned with backend DTOs

export type NotificationType = "slack" | "discord" | "whatsapp";

export interface NotificationConfig {
  chave: string;
  type: string;
  configured: boolean;
  atualizadoEm: string;
}

export interface ConfigureNotificationDto {
  type: NotificationType;
  webhookUrl?: string;
  apiKey?: string;
}

export interface TestNotificationDto {
  type: NotificationType;
  message?: string;
}
