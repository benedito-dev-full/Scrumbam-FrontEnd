export const WEBHOOK_EVENTS = [
  "task.created",
  "task.updated",
  "task.moved",
  "task.deleted",
  "project.created",
  "project.updated",
  "comment.created",
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export interface Webhook {
  chave: string;
  url: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
}

export interface ConfigureWebhookDto {
  url: string;
  events: WebhookEvent[];
  secret?: string;
}

export interface ConfigureWebhookResponse extends Webhook {
  secret: string;
}
