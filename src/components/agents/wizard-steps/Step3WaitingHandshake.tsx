"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAgentWatcher } from "@/lib/hooks/use-agent-watcher";
import type { WizardState } from "../VpsInstallWizard";

// ============================================================
// Props
// ============================================================

export interface Step3WaitingHandshakeProps {
  state: WizardState;
  onAgentConnected: (agentId: string) => void;
  onTimeout: () => void;
}

// ============================================================
// Constantes
// ============================================================

const TIMEOUT_MS = 15 * 60 * 1000; // 15 minutos
const CONNECTED_FLASH_MS = 500; // exibe o check verde antes de avançar

// ============================================================
// Componente
// ============================================================

/**
 * Step 3 — Aguardando conexão do agente.
 *
 * Faz polling a cada 3 s via `useAgentWatcher`. Quando o agente conecta,
 * exibe ícone de sucesso por 500 ms e avança. Se o timeout de 15 min
 * expirar, exibe estado de erro com dicas de diagnóstico e botão para
 * voltar ao início (delega ao VpsInstallWizard via `onTimeout`).
 */
export function Step3WaitingHandshake({
  state,
  onAgentConnected,
  onTimeout,
}: Step3WaitingHandshakeProps) {
  // "connected" = agente detectado, exibindo flash do check verde
  const [connected, setConnected] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  // Garante que o callback de avanço é chamado apenas uma vez
  const calledRef = useRef(false);

  // ── handlers para o watcher ───────────────────────────────

  function handleConnected(agentId: string) {
    if (calledRef.current) return;
    calledRef.current = true;
    setConnected(true);
    // Exibe check verde brevemente antes de avançar
    setTimeout(() => {
      onAgentConnected(agentId);
    }, CONNECTED_FLASH_MS);
  }

  function handleTimeout() {
    setTimedOut(true);
  }

  // ── polling ───────────────────────────────────────────────

  const { elapsedSeconds } = useAgentWatcher({
    installTokenId: state.installTokenId,
    enabled: !timedOut && !connected,
    timeoutMs: TIMEOUT_MS,
    onConnected: handleConnected,
    onTimeout: handleTimeout,
  });

  // ── contador de texto ("Aguardando há Xs...") ─────────────
  //
  // Exibido enquanto aguarda. elapsedSeconds vem do hook (incrementa 1/s).

  // ── render de timeout ─────────────────────────────────────

  if (timedOut) {
    return (
      <div className="space-y-4 py-2">
        <div className="flex flex-col items-center gap-3 py-6">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <div className="space-y-1 text-center">
            <p className="text-[14px] font-medium text-destructive">
              Tempo esgotado
            </p>
            <p className="text-[13px] text-muted-foreground">
              O agente não respondeu em 15 minutos.
            </p>
          </div>
        </div>

        <ul className="space-y-1.5 rounded-md border border-border bg-muted/40 px-4 py-3">
          <li className="text-[12px] text-muted-foreground">
            • Verifique se o comando foi executado como <code className="font-mono">root</code>
          </li>
          <li className="text-[12px] text-muted-foreground">
            • Verifique conectividade da VPS com a internet
          </li>
          <li className="text-[12px] text-muted-foreground">
            • Consulte{" "}
            <code className="font-mono">journalctl -u scrumban-agent</code>{" "}
            para detalhes
          </li>
        </ul>

        <div className="flex justify-center pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={onTimeout}
            className="text-[13px]"
          >
            Voltar ao início
          </Button>
        </div>
      </div>
    );
  }

  // ── render de sucesso (flash do check verde) ──────────────

  if (connected) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        <CheckCircle2 className="h-8 w-8 text-green-500" />
        <p className="text-[13px] text-muted-foreground">Agente conectado!</p>
      </div>
    );
  }

  // ── render de aguardo (estado normal) ────────────────────

  return (
    <div className="space-y-4 py-2">
      <div className="space-y-1">
        <h2 className="text-[14px] font-medium">Aguardando conexão...</h2>
        <p className="text-[13px] text-muted-foreground">
          Conectando à VPS{" "}
          <span className="font-mono">{state.vpsHostname}</span>
        </p>
      </div>

      <div className="flex flex-col items-center justify-center gap-3 py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <ElapsedCounter elapsedSeconds={elapsedSeconds} />
      </div>

      <p className="text-center text-[12px] text-muted-foreground">
        Após rodar o comando na VPS, o agente fará o primeiro heartbeat
        (pode levar até 60 s). Verificando a cada 3 s.
      </p>
    </div>
  );
}

// ============================================================
// Sub-componente: contador de tempo decorrido
// ============================================================

interface ElapsedCounterProps {
  elapsedSeconds: number;
}

/**
 * Exibe "Aguardando há Xs..." com atualização automática por segundo.
 * Usa o `elapsedSeconds` já vindo do hook para evitar segundo timer.
 */
function ElapsedCounter({ elapsedSeconds }: ElapsedCounterProps) {
  // Fallback: contador local caso o hook ainda não tenha iniciado
  const [localSeconds, setLocalSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLocalSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const display = elapsedSeconds > 0 ? elapsedSeconds : localSeconds;

  return (
    <p className="text-[13px] text-muted-foreground tabular-nums">
      Aguardando há {display}s...
    </p>
  );
}
