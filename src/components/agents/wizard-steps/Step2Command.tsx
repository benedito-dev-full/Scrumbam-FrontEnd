"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useInstallCommand } from "@/lib/hooks/use-install-command";
import type { WizardState } from "../VpsInstallWizard";

interface Step2CommandProps {
  state: WizardState;
  onNext: (updates?: Partial<WizardState>) => void;
}

/**
 * Formata segundos restantes em MM:SS.
 */
function formatTTL(seconds: number): string {
  const m = Math.floor(Math.max(0, seconds) / 60)
    .toString()
    .padStart(2, "0");
  const s = (Math.max(0, seconds) % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/**
 * Step 2 — Instale o agente.
 *
 * Ao montar, gera automaticamente um install-token via API.
 * Exibe o one-liner copiável com countdown do TTL.
 * "Gerar novo token" reseta e repete o processo.
 * Avança (onNext) apenas após token gerado, passando installTokenId.
 */
export function Step2Command({ state, onNext }: Step2CommandProps) {
  const { generate, data, isPending, error, reset } = useInstallCommand();

  // Controle de cópia — ícone muda para Check por 2s
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Countdown do TTL em segundos
  const [ttlSeconds, setTtlSeconds] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Gera token ao montar (apenas uma vez)
  useEffect(() => {
    generate({ nome: state.vpsLabel || "agent" });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Exibe toast ao falhar
  useEffect(() => {
    if (error) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? "Erro ao gerar token de instalação";
      toast.error(msg);
    }
  }, [error]);

  // Inicia countdown quando token é gerado
  useEffect(() => {
    if (!data?.installTokenExp) return;

    // Limpa interval anterior se existir (ex: ao regenerar)
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
    }

    const expAt = new Date(data.installTokenExp).getTime();

    function calcRemaining() {
      return Math.max(0, Math.floor((expAt - Date.now()) / 1000));
    }

    setTtlSeconds(calcRemaining());

    intervalRef.current = setInterval(() => {
      const remaining = calcRemaining();
      setTtlSeconds(remaining);
      if (remaining <= 0 && intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, 1000);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [data?.installTokenExp]);

  // Limpa timer de cópia ao desmontar
  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  function handleCopy() {
    if (!data?.oneLineInstall) return;
    navigator.clipboard.writeText(data.oneLineInstall).then(() => {
      setCopied(true);
      if (copyTimerRef.current !== null) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleRegenerate() {
    reset();
    setCopied(false);
    setTtlSeconds(null);
    generate({ nome: state.vpsLabel || "agent" });
  }

  function handleNext() {
    if (!data) return;
    onNext({ installTokenId: data.id });
  }

  const isExpired = ttlSeconds !== null && ttlSeconds <= 0;

  return (
    <div className="space-y-4 py-2">
      <div className="space-y-1">
        <h2 className="text-[14px] font-medium">Instale o agente</h2>
        <p className="text-[13px] text-muted-foreground">
          Copie o comando abaixo e execute na sua VPS como{" "}
          <span className="font-semibold">root</span>.
        </p>
      </div>

      {/* Bloco do comando */}
      <div className="relative rounded-md border border-border bg-muted/40 p-3 pr-10">
        {isPending ? (
          <span className="text-[12px] text-muted-foreground font-mono animate-pulse">
            Gerando token...
          </span>
        ) : error ? (
          <span className="text-[12px] text-destructive font-mono">
            Falha ao gerar token. Use o botão abaixo para tentar novamente.
          </span>
        ) : (
          <code className="text-[12px] font-mono break-all leading-relaxed">
            {data?.oneLineInstall ?? ""}
          </code>
        )}

        {/* Botão copiar */}
        {data && !isExpired && (
          <button
            type="button"
            onClick={handleCopy}
            aria-label="Copiar comando"
            className="absolute top-2.5 right-2.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* TTL e regeneração */}
      <div className="flex items-center justify-between">
        <div className="text-[12px] text-muted-foreground tabular-nums">
          {data && ttlSeconds !== null && !isExpired && (
            <span>Expira em {formatTTL(ttlSeconds)}</span>
          )}
          {isExpired && (
            <span className="text-destructive font-medium">Token expirado</span>
          )}
        </div>

        {(isExpired || error) && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerate}
            disabled={isPending}
            className="text-[13px] gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Gerar novo token
          </Button>
        )}
      </div>

      {/* Instrução */}
      {data && !isExpired && (
        <p className="text-[12px] text-muted-foreground">
          Após executar o comando na VPS, clique em Próximo para aguardar a
          conexão do agente.
        </p>
      )}

      {/* Botão avançar — Step2 controla quando exibir */}
      {data && !isExpired && (
        <div className="flex justify-end pt-1">
          <Button size="sm" onClick={handleNext} className="text-[13px]">
            Próximo
          </Button>
        </div>
      )}
    </div>
  );
}
