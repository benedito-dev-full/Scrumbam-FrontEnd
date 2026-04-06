import api from "./client";
import { ENDPOINTS } from "./endpoints";
import type {
  Webhook,
  ConfigureWebhookDto,
  ConfigureWebhookResponse,
} from "@/types";

export const webhooksApi = {
  list: async (): Promise<Webhook[]> => {
    const { data } = await api.get<Webhook[]>(ENDPOINTS.WEBHOOKS);
    return data;
  },

  configure: async (
    dto: ConfigureWebhookDto,
  ): Promise<ConfigureWebhookResponse> => {
    const { data } = await api.post<ConfigureWebhookResponse>(
      ENDPOINTS.WEBHOOKS_CONFIGURE,
      dto,
    );
    return data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(ENDPOINTS.WEBHOOK(id));
  },
};
