"use client";

import { Loader2 } from "lucide-react";
import type { WizardState } from "../VpsInstallWizard";

interface Step3WaitingHandshakeProps {
  state: WizardState;
  onAgentConnected: (agentId: string) => void;
}

/**
 * Step 3 — Aguardando conexão.
 * Stub: spinner + título. Polling real (useAgentWatcher) vem na Fase 4.
 */
export function Step3WaitingHandshake({
  state: _state,
  onAgentConnected: _onAgentConnected,
}: Step3WaitingHandshakeProps) {
  return (
    <div className="space-y-4 py-2">
      <div className="space-y-1">
        <h2 className="text-[14px] font-medium">Aguardando conexão...</h2>
        <p className="text-[13px] text-muted-foreground">
          Após rodar o comando na VPS, aguarde o agente fazer o primeiro
          heartbeat (pode levar até 60s).
        </p>
      </div>

      <div className="flex flex-col items-center justify-center gap-3 py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-[13px] text-muted-foreground">
          Aguardando heartbeat do agente...
        </p>
      </div>

      <p className="text-[12px] text-muted-foreground text-center">
        Polling real (useAgentWatcher, 3s) implementado na Fase 4.
      </p>
    </div>
  );
}
