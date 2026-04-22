import api from "./client";
import { ENDPOINTS } from "./endpoints";

export interface TelegramPairingResponse {
  pairingCode: string;
  expiresAt: string;
  botUsername: string;
}

export interface TelegramStatusResponse {
  linked: boolean;
  telegramUsername?: string | null;
  linkedAt?: string | null;
}

export const telegramApi = {
  /** Gera novo codigo de pareamento (6 chars, TTL 10 min). */
  generatePairing: async (): Promise<TelegramPairingResponse> => {
    const { data } = await api.post(ENDPOINTS.TELEGRAM_PAIRING, {});
    return data;
  },

  /** Retorna status de vinculacao do usuario. */
  getStatus: async (): Promise<TelegramStatusResponse> => {
    const { data } = await api.get(ENDPOINTS.TELEGRAM_STATUS);
    return data;
  },

  /** Desvincula Telegram da conta. */
  unlink: async (): Promise<void> => {
    await api.delete(ENDPOINTS.TELEGRAM_UNLINK);
  },
};
