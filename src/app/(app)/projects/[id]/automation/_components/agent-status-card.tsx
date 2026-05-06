"use client";

import { Activity, RefreshCw, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAgentStatus, useTestConnection } from "@/lib/hooks/use-automation";
import { AgentStatusBadge } from "../../../../agents/components/agent-status-badge";

interface AgentStatusCardProps {
  projectId: string;
}

/**
 * Card de status do agente vinculado.
 *
 * Mostra:
 * - Badge de status (online/offline/pending_install/never_connected)
 * - Hostname, porta tunelada, ultima heartbeat
 * - Resultado do ultimo livePing (se ja foi disparado)
 * - Botao "Testar conexao" -> dispara PING via tunel SSH
 *
 * Nao auto-refetch livePing (custa I/O); refresh manual pelo usuario.
 * Status do banco refresca a cada 30s automaticamente.
 */
export function AgentStatusCard({ projectId }: AgentStatusCardProps) {
  const { data, isLoading } = useAgentStatus(projectId, false);
  const { data: liveData } = useAgentStatus(projectId, true, {
    enabled: false,
  });
  const testMutation = useTestConnection(projectId);

  if (isLoading) {
    return (
      <section className="rounded-md border border-border bg-card p-4">
        <div className="h-5 w-32 bg-muted rounded animate-pulse mb-3" />
        <div className="space-y-2">
          <div className="h-4 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-40 bg-muted rounded animate-pulse" />
        </div>
      </section>
    );
  }

  if (!data?.agent) {
    return (
      <section className="rounded-md border border-dashed border-border bg-card/40 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="h-3.5 w-3.5 text-muted-foreground" />
          <h2 className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
            Status do agente
          </h2>
        </div>
        <p className="text-[12px] text-muted-foreground">
          Nenhum agente vinculado. Use o formulario acima para conectar um
          agente.
        </p>
      </section>
    );
  }

  const agent = data.agent;
  const ping = liveData?.livePing;

  return (
    <section className="rounded-md border border-border bg-card overflow-hidden">
      <header className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border bg-card/40">
        <div className="flex items-center gap-2 min-w-0">
          <Activity className="h-3.5 w-3.5 text-muted-foreground" />
          <h2 className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
            Status do agente
          </h2>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => testMutation.mutate()}
          disabled={testMutation.isPending}
          className="text-[12px] h-7"
        >
          {testMutation.isPending ? (
            <>
              <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
              Testando...
            </>
          ) : (
            <>
              <RefreshCw className="mr-1.5 h-3 w-3" />
              Testar conexao
            </>
          )}
        </Button>
      </header>

      <dl className="text-[13px]">
        <Row
          label="Agente"
          value={
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{agent.nome}</span>
              <AgentStatusBadge status={agent.status} />
            </div>
          }
        />
        <Row
          label="Hostname"
          value={
            <span className="font-mono text-[12px] truncate">
              {agent.hostname ?? "—"}
            </span>
          }
        />
        <Row
          label="Tunnel port"
          value={
            <span className="font-mono text-[12px] tabular-nums">
              {agent.tunnelPort ?? "—"}
            </span>
          }
        />
        <Row
          label="Ultima heartbeat"
          value={
            <span className="text-[12px] text-muted-foreground">
              {agent.lastHeartbeat
                ? new Date(agent.lastHeartbeat).toLocaleString("pt-BR")
                : "Nunca"}
            </span>
          }
        />
        {ping && (
          <Row
            label="Ultimo ping"
            value={
              ping.ok ? (
                <span className="text-[12px] text-green-500">
                  OK
                  {ping.latencyMs != null && (
                    <span className="text-muted-foreground ml-1">
                      ({ping.latencyMs}ms)
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-[12px] text-destructive">
                  {ping.error ?? "Sem resposta"}
                </span>
              )
            }
          />
        )}
      </dl>
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 items-center px-4 py-2 border-b border-border last:border-b-0">
      <dt className="text-[12px] text-muted-foreground">{label}</dt>
      <dd className="truncate">{value}</dd>
    </div>
  );
}
