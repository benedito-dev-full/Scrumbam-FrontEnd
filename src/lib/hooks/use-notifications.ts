"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { notificationsApi } from "@/lib/api/notifications";
import type { ConfigureNotificationDto, TestNotificationDto } from "@/types";

export function useConfigureNotification() {
  return useMutation({
    mutationFn: (dto: ConfigureNotificationDto) =>
      notificationsApi.configure(dto),
    onSuccess: () => {
      toast.success("Notificacao configurada");
    },
    onError: () => {
      toast.error("Erro ao configurar notificacao");
    },
  });
}

export function useTestNotification() {
  return useMutation({
    mutationFn: (dto: TestNotificationDto) => notificationsApi.test(dto),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Mensagem de teste enviada");
      } else {
        toast.warning(result.message || "Falha no envio");
      }
    },
    onError: () => {
      toast.error("Erro ao enviar mensagem de teste");
    },
  });
}
