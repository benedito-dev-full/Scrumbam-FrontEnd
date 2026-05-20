"use client";

import Link from "next/link";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WizardState } from "../VpsInstallWizard";

interface Step5DoneProps {
  state: WizardState;
  onClose: () => void;
}

/**
 * Step 5 — VPS conectada com sucesso.
 * Exibe ícone de check, resumo final e link para o painel do agente.
 */
export function Step5Done({ state, onClose }: Step5DoneProps) {
  return (
    <div className="space-y-4 py-2">
      <div className="flex flex-col items-center justify-center gap-3 py-6">
        <CheckCircle2 className="h-10 w-10 text-green-500" />
        <div className="text-center space-y-1">
          <h2 className="text-[15px] font-semibold">VPS conectada com sucesso!</h2>
          <p className="text-[13px] text-muted-foreground">
            {state.vpsHostname
              ? `O agente em ${state.vpsHostname} está online e pronto para receber tarefas.`
              : "O agente está online e pronto para receber tarefas."}
          </p>
        </div>
      </div>

      {state.agentId && (
        <div className="rounded-md border border-border bg-muted/30 p-3 text-center">
          <p className="text-[12px] text-muted-foreground">
            ID do agente:{" "}
            <span className="font-mono text-foreground">{state.agentId}</span>
          </p>
        </div>
      )}

      {state.agentId && (
        <div className="flex justify-center">
          <Link href={`/vps/${state.agentId}`}>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-[13px]"
              onClick={onClose}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Ver painel do agente
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
