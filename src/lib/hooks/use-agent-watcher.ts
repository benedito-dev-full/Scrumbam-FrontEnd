"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { agentsApi, type Agent } from "@/lib/api/agents";

// ============================================================
// Types
// ============================================================

export interface UseAgentWatcherOptions {
  /** ID do install-token a monitorar. Null desativa o polling. */
  installTokenId: string | null;
  /** false = polling parado imediatamente */
  enabled: boolean;
  /** Tempo máximo de espera em ms. Default: 15 min. */
  timeoutMs?: number;
  /** Chamado quando o agente detectado passa para online ou offline. */
  onConnected: (agentId: string) => void;
  /** Chamado quando timeoutMs é atingido sem detecção. */
  onTimeout: () => void;
}

export interface UseAgentWatcherReturn {
  /** true enquanto o polling está ativo (antes de conectar ou estourar timeout). */
  isPolling: boolean;
  /** Segundos decorridos desde que o polling foi iniciado. */
  elapsedSeconds: number;
  /** Agente encontrado (null enquanto aguarda). */
  foundAgent: Agent | null;
}

// ============================================================
// Hook
// ============================================================

const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutos

/**
 * Monitora a lista de agentes a cada 3 segundos procurando pelo agente
 * associado ao `installTokenId` fornecido. Quando o agente aparece com
 * status `online` ou `offline`, chama `onConnected`. Se o timeout
 * expirar primeiro, chama `onTimeout`.
 *
 * Criado especificamente para o VpsInstallWizard Step3 — intervalo de
 * 3s intencional (muito mais agressivo do que o `useAgents` padrão de 15s).
 */
export function useAgentWatcher({
  installTokenId,
  enabled,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  onConnected,
  onTimeout,
}: UseAgentWatcherOptions): UseAgentWatcherReturn {
  // Estado interno de atividade do polling
  const [isPolling, setIsPolling] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [foundAgent, setFoundAgent] = useState<Agent | null>(null);

  // Refs para evitar closures desatualizadas nos callbacks
  const onConnectedRef = useRef(onConnected);
  const onTimeoutRef = useRef(onTimeout);
  onConnectedRef.current = onConnected;
  onTimeoutRef.current = onTimeout;

  // Flag para evitar chamar callbacks após desmontagem ou conexão
  const connectedRef = useRef(false);
  const timedOutRef = useRef(false);

  // Determina se a query deve rodar
  const shouldPoll =
    enabled && !!installTokenId && !connectedRef.current && !timedOutRef.current;

  // ── TanStack Query com intervalo de 3s ────────────────────

  const query = useQuery({
    queryKey: ["agent-watcher", installTokenId],
    queryFn: () => agentsApi.list(),
    enabled: shouldPoll,
    refetchInterval: shouldPoll ? 3000 : false,
    // Não queremos stale-time alto aqui — sempre buscar dado fresco
    staleTime: 0,
  });

  // ── Detectar agente conectado nos dados retornados ────────

  useEffect(() => {
    if (!query.data || !installTokenId) return;
    if (connectedRef.current || timedOutRef.current) return;

    const agent = query.data.find(
      (a) =>
        a.installTokenId === installTokenId &&
        a.status !== "pending_install" &&
        a.status !== "never_connected",
    );

    if (agent) {
      connectedRef.current = true;
      setFoundAgent(agent);
      setIsPolling(false);
      onConnectedRef.current(agent.id);
    }
  }, [query.data, installTokenId]);

  // ── Sincronizar isPolling com shouldPoll ─────────────────

  useEffect(() => {
    if (shouldPoll) {
      setIsPolling(true);
    } else if (!connectedRef.current) {
      setIsPolling(false);
    }
  }, [shouldPoll]);

  // ── Resetar estado quando installTokenId muda ────────────

  useEffect(() => {
    if (!installTokenId) return;
    // Novo token: resetar tudo
    connectedRef.current = false;
    timedOutRef.current = false;
    setFoundAgent(null);
    setElapsedSeconds(0);
  }, [installTokenId]);

  // ── Contador de tempo decorrido (tick por segundo) ────────

  useEffect(() => {
    if (!shouldPoll) return;

    const interval = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [shouldPoll]);

  // ── Timeout global ────────────────────────────────────────

  useEffect(() => {
    if (!shouldPoll) return;

    const timer = setTimeout(() => {
      if (connectedRef.current) return; // Já conectou, ignorar
      timedOutRef.current = true;
      setIsPolling(false);
      onTimeoutRef.current();
    }, timeoutMs);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [installTokenId, timeoutMs]);
  // Dependência intencional: só recria o timer quando o token ou timeout mudam.
  // shouldPoll NÃO entra porque queremos 1 timer por sessão de monitoramento.

  return { isPolling, elapsedSeconds, foundAgent };
}
