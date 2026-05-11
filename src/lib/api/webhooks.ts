import api from "./client";
import type {
  Webhook,
  ConfigureWebhookDto,
  ConfigureWebhookResponse,
} from "@/types";

// V2 supported events
const V2_EVENTS = [
  "task.created",
  "task.status_changed",
  "task.assigned",
  "task.deleted",
  "task.commented",
  "task.priority_changed",
  "project.created",
  "project.member_added",
  "project.deleted",
] as const;

// Map legacy frontend events to V2 events (best-effort).
const EVENT_LEGACY_TO_V2: Record<string, string> = {
  "task.updated": "task.status_changed",
  "task.moved": "task.status_changed",
  "project.updated": "project.member_added",
  "comment.created": "task.commented",
};

function mapEvents(events: string[]): string[] {
  const allowed = new Set<string>(V2_EVENTS);
  const mapped = events.map((e) => EVENT_LEGACY_TO_V2[e] ?? e);
  return Array.from(new Set(mapped.filter((e) => allowed.has(e))));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function unwrapList(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapWebhook(raw: any): Webhook {
  return {
    chave: raw.id ?? raw.chave,
    url: raw.url,
    events: raw.events ?? [],
    isActive: raw.disabled === undefined ? true : !raw.disabled,
    createdAt: raw.createdAt ?? raw.criadoEm,
  };
}

/**
 * Cliente Webhooks (V2 /webhooks/*).
 *
 * V2 requer `projectId` em list e create. O contrato legado do frontend
 * nao recebia projectId — aceitamos como parametro opcional adicional.
 * Quando nao fornecido, retorna lista vazia (UI deve passar projectId).
 */
export const webhooksApi = {
  list: async (projectId?: string): Promise<Webhook[]> => {
    if (!projectId) return [];
    const { data } = await api.get("/webhooks", { params: { projectId } });
    return unwrapList(data).map(mapWebhook);
  },

  configure: async (
    dto: ConfigureWebhookDto,
    projectId?: string,
  ): Promise<ConfigureWebhookResponse> => {
    if (!projectId) {
      throw new Error("projectId required to configure webhook");
    }
    const body = {
      projectId,
      url: dto.url,
      events: mapEvents(dto.events),
    };
    const { data } = await api.post("/webhooks", body);
    return {
      ...mapWebhook(data),
      secret: data.secret ?? "",
    };
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/webhooks/${id}`);
  },

  /** V2-only: testa webhook (envia evento dummy). */
  test: async (
    id: string,
    eventType?: string,
  ): Promise<{ success: boolean; deliveryId: string }> => {
    const body: Record<string, unknown> = {};
    if (eventType) body.eventType = eventType;
    const { data } = await api.post(`/webhooks/${id}/test`, body);
    return { success: data.success, deliveryId: data.deliveryId };
  },

  /** V2-only: reabilita webhook desativado por falhas. */
  redrive: async (id: string): Promise<void> => {
    await api.post(`/webhooks/${id}/redrive`);
  },

  /** V2-only: lista tentativas de entrega. */
  listAttempts: async (
    id: string,
    params?: { cursor?: string; limit?: number },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<{
    items: any[];
    pagination: { hasMore: boolean; nextCursor: string | null };
  }> => {
    const { data } = await api.get(`/webhooks/${id}/attempts`, { params });
    return data;
  },
};
