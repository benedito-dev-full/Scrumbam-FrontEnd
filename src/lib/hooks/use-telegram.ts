"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { telegramApi } from "@/lib/api/telegram";

const TELEGRAM_STATUS_KEY = ["telegram", "status"] as const;

export function useTelegramStatus() {
  return useQuery({
    queryKey: TELEGRAM_STATUS_KEY,
    queryFn: () => telegramApi.getStatus(),
    staleTime: 30_000,
  });
}

export function useGenerateTelegramPairing() {
  return useMutation({
    mutationFn: () => telegramApi.generatePairing(),
    onError: () => {
      toast.error("Erro ao gerar codigo de pareamento");
    },
  });
}

export function useUnlinkTelegram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => telegramApi.unlink(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TELEGRAM_STATUS_KEY });
      toast.success("Telegram desvinculado");
    },
    onError: () => {
      toast.error("Erro ao desvincular Telegram");
    },
  });
}
