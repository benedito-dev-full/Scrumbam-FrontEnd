"use client";
import { useState } from "react";
import {
  Bot,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useClaudeCredentialStatus,
  useClaudeTokenInstructions,
} from "@/lib/hooks/use-automation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { ClaudeCredentialStatus } from "@/types/execution";

interface ClaudeCredentialCardProps {
  projectId: string;
}

export function ClaudeCredentialCard({ projectId }: ClaudeCredentialCardProps) {
  const [status, setStatus] = useState<ClaudeCredentialStatus | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [snippet, setSnippet] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const probeMutation = useClaudeCredentialStatus(projectId);
  const instructionsMutation = useClaudeTokenInstructions(projectId);

  async function handleTest() {
    const result = await probeMutation.mutateAsync();
    setStatus(result as ClaudeCredentialStatus);
  }

  async function handleShowInstructions() {
    const result = await instructionsMutation.mutateAsync();
    const data = result as { setupTokenSnippet: string };
    setSnippet(data.setupTokenSnippet);
    setShowInstructions(true);
  }

  async function handleCopy() {
    if (!snippet) return;
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function StatusIndicator() {
    if (!status) {
      return (
        <span className="text-[12px] text-muted-foreground">Nao testado</span>
      );
    }
    if (status.configured) {
      return (
        <span className="inline-flex items-center gap-1.5 text-[12px] text-green-600">
          <CheckCircle className="h-3.5 w-3.5" />
          Configurado
          {status.account && (
            <span className="text-muted-foreground">({status.account})</span>
          )}
        </span>
      );
    }
    if (status.error?.includes("fallback")) {
      return (
        <span className="inline-flex items-center gap-1.5 text-[12px] text-amber-600">
          <AlertTriangle className="h-3.5 w-3.5" />
          Usando fallback da organizacao
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] text-red-600">
        <XCircle className="h-3.5 w-3.5" />
        Sem token configurado
      </span>
    );
  }

  return (
    <>
      <section className="rounded-md border border-border bg-card overflow-hidden">
        <header className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border bg-card/40">
          <div className="flex items-center gap-2">
            <Bot className="h-3.5 w-3.5 text-muted-foreground" />
            <h2 className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
              Credencial Claude
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[12px] text-muted-foreground"
              onClick={handleShowInstructions}
              disabled={instructionsMutation.isPending}
            >
              {instructionsMutation.isPending && (
                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
              )}
              Ver instrucoes SSH
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[12px]"
              onClick={handleTest}
              disabled={probeMutation.isPending}
            >
              {probeMutation.isPending ? (
                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="mr-1.5 h-3 w-3" />
              )}
              Testar credencial
            </Button>
          </div>
        </header>
        <div className="px-4 py-3">
          <dl className="space-y-0 divide-y divide-border/40">
            <div className="grid grid-cols-[140px_1fr] items-center gap-3 py-2">
              <dt className="text-[12px] text-muted-foreground">Status</dt>
              <dd>
                <StatusIndicator />
              </dd>
            </div>
            {status?.error && !status.configured && (
              <div className="grid grid-cols-[140px_1fr] items-center gap-3 py-2">
                <dt className="text-[12px] text-muted-foreground">Detalhe</dt>
                <dd className="text-[12px] text-destructive">{status.error}</dd>
              </div>
            )}
          </dl>
          <p className="mt-3 text-[11px] text-muted-foreground">
            O token OAuth reside na VPS do projeto. Configure via{" "}
            <code className="font-mono bg-muted px-1 rounded text-[10px]">
              claude setup-token
            </code>{" "}
            na VPS antes de disparar execucoes.
          </p>
        </div>
      </section>

      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[14px]">
              Configurar token Claude na VPS
            </DialogTitle>
            <DialogDescription className="text-[12px]">
              Execute o comando abaixo via SSH na VPS do projeto para configurar
              o token OAuth.
            </DialogDescription>
          </DialogHeader>
          {snippet && (
            <div className="relative mt-2">
              <pre className="rounded-md bg-muted p-3 text-[11px] font-mono overflow-x-auto whitespace-pre-wrap break-all">
                {snippet}
              </pre>
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2 h-6 w-6 p-0"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
