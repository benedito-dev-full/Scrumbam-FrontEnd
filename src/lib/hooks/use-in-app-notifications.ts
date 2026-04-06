"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { inAppNotificationsApi } from "@/lib/api/in-app-notifications";

const QUERY_KEY_NOTIFICATIONS = ["in-app-notifications"] as const;
const QUERY_KEY_UNREAD_COUNT = [
  "in-app-notifications",
  "unread-count",
] as const;

/** Lista as ultimas notificacoes do usuario logado */
export function useInAppNotifications(limit = 20) {
  return useQuery({
    queryKey: [...QUERY_KEY_NOTIFICATIONS, limit],
    queryFn: () => inAppNotificationsApi.list({ limit }),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

/** Contagem de notificacoes nao lidas com polling a cada 30s */
export function useUnreadCount() {
  return useQuery({
    queryKey: [...QUERY_KEY_UNREAD_COUNT],
    queryFn: () => inAppNotificationsApi.getUnreadCount(),
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
}

/** Marca notificacoes especificas como lidas */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => inAppNotificationsApi.markAsRead(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_NOTIFICATIONS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_UNREAD_COUNT });
    },
    onError: () => {
      toast.error("Erro ao marcar notificacao como lida");
    },
  });
}

/** Marca todas as notificacoes como lidas */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => inAppNotificationsApi.markAllAsRead(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_NOTIFICATIONS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_UNREAD_COUNT });
      if (data.updated > 0) {
        toast.success(
          `${data.updated} notificacao(oes) marcada(s) como lida(s)`,
        );
      }
    },
    onError: () => {
      toast.error("Erro ao marcar notificacoes como lidas");
    },
  });
}
