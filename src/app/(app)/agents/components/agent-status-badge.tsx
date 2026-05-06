"use client";

import { Badge } from "@/components/ui/badge";
import type { AgentStatus } from "@/lib/api/agents";

interface AgentStatusBadgeProps {
  status: AgentStatus;
}

const STATUS_LABEL: Record<AgentStatus, string> = {
  pending_install: "Aguardando instalação",
  never_connected: "Aguardando heartbeat",
  online: "Online",
  offline: "Offline",
};

const STATUS_VARIANT: Record<
  AgentStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending_install: "secondary",
  never_connected: "secondary",
  online: "default",
  offline: "destructive",
};

const STATUS_COLOR_CLASS: Record<AgentStatus, string> = {
  pending_install: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  never_connected: "bg-blue-500/10 text-blue-700 border-blue-500/30",
  online: "bg-green-500/10 text-green-700 border-green-500/30",
  offline: "bg-red-500/10 text-red-700 border-red-500/30",
};

/**
 * Badge visual de status do agente.
 *
 * Mapeamento:
 * - pending_install → amarelo (aguardando admin rodar one-liner)
 * - never_connected → azul (registrou-se mas sem heartbeat ainda)
 * - online → verde
 * - offline → vermelho (90s sem heartbeat)
 */
export function AgentStatusBadge({ status }: AgentStatusBadgeProps) {
  return (
    <Badge
      variant={STATUS_VARIANT[status]}
      className={STATUS_COLOR_CLASS[status]}
    >
      {STATUS_LABEL[status]}
    </Badge>
  );
}
