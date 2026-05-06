"use client";

import { useState } from "react";
import { Copy, Check, AlertTriangle, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  useMcpKeyInfo,
  useGenerateMcpKey,
  useRevokeMcpKey,
} from "@/lib/hooks/use-mcp-key";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface McpKeyManagerProps {
  /** Callback chamado quando o plaintext eh fechado, para o pai recarregar o snippet */
  onPlaintextDismissed?: () => void;
}

export function McpKeyManager({ onPlaintextDismissed }: McpKeyManagerProps) {
  const { data: info, isLoading } = useMcpKeyInfo();
  const generate = useGenerateMcpKey();
  const revoke = useRevokeMcpKey();

  const [plaintext, setPlaintext] = useState<string | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [copied, setCopied] = useState(false);

  const hasKey = info?.hasKey === true;

  const handleGenerate = () => {
    generate.mutate(undefined, {
      onSuccess: (data) => {
        setPlaintext(data.key);
        setCopied(false);
      },
    });
  };

  const handleRevoke = () => {
    revoke.mutate(undefined, {
      onSuccess: () => setConfirmRevoke(false),
    });
  };

  const handleCopy = async () => {
    if (!plaintext) return;
    try {
      await navigator.clipboard.writeText(plaintext);
      setCopied(true);
      toast.success("Key copiada");
    } catch {
      toast.error("Falha ao copiar");
    }
  };

  const dismissPlaintext = () => {
    setPlaintext(null);
    onPlaintextDismissed?.();
  };

  // === Loading ===
  if (isLoading) {
    return (
      <div className="rounded-md border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-muted-foreground text-[13px]">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Carregando...
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border border-border bg-card p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
            <KeyRound className="h-4 w-4 text-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[13px] font-medium">MCP Key</h3>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Autentica clientes Claude Code, Cursor e Claude Desktop como
              voce. Uma key por usuario.
            </p>
          </div>
        </div>

        {hasKey ? (
          <div className="space-y-3 border-t border-border pt-3">
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[12px]">
              <div>
                <dt className="text-muted-foreground">Prefix</dt>
                <dd className="font-mono mt-0.5 truncate">
                  {info?.prefix ?? "—"}
                  <span className="text-muted-foreground">
                    {"········"}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Criada em</dt>
                <dd className="mt-0.5">
                  {info?.createdAt ? formatDate(info.createdAt) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Ultimo uso</dt>
                <dd className="mt-0.5">
                  {info?.lastUsedAt ? formatDate(info.lastUsedAt) : "Nunca"}
                </dd>
              </div>
            </dl>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerate}
                disabled={generate.isPending}
                className="text-[12px]"
              >
                {generate.isPending ? (
                  <>
                    <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                    Regenerando...
                  </>
                ) : (
                  "Regenerar key"
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmRevoke(true)}
                disabled={revoke.isPending}
                className="text-[12px] text-destructive hover:text-destructive"
              >
                Revogar
              </Button>
            </div>
          </div>
        ) : (
          <div className="border-t border-border pt-3">
            <Button
              size="sm"
              onClick={handleGenerate}
              disabled={generate.isPending}
              className="text-[12px]"
            >
              {generate.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                  Gerando...
                </>
              ) : (
                "Gerar MCP Key"
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Plaintext modal — shown ONCE after generation */}
      <Dialog
        open={!!plaintext}
        onOpenChange={(open) => !open && dismissPlaintext()}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Sua nova MCP Key</DialogTitle>
            <DialogDescription>
              Copie agora — esta e a unica vez que ela aparece em texto plano.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-[12px] text-amber-200 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>
                Salve em local seguro. Se perder, voce precisa gerar uma nova
                (a anterior e invalidada).
              </span>
            </div>

            <div className="rounded-md border border-border bg-background p-3 font-mono text-[12px] break-all">
              {plaintext}
            </div>

            <Button
              onClick={handleCopy}
              variant="outline"
              size="sm"
              className="w-full text-[12px]"
            >
              {copied ? (
                <>
                  <Check className="mr-1.5 h-3 w-3" />
                  Copiada
                </>
              ) : (
                <>
                  <Copy className="mr-1.5 h-3 w-3" />
                  Copiar key
                </>
              )}
            </Button>
          </div>

          <DialogFooter>
            <Button
              size="sm"
              onClick={dismissPlaintext}
              className="text-[12px]"
            >
              Ja salvei, fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke confirmation */}
      <Dialog open={confirmRevoke} onOpenChange={setConfirmRevoke}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Revogar MCP Key?</DialogTitle>
            <DialogDescription>
              Apos revogar, qualquer cliente Claude Code/Cursor/Claude Desktop
              usando esta key recebera 401. Voce podera gerar uma nova depois.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmRevoke(false)}
              className="text-[12px]"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRevoke}
              disabled={revoke.isPending}
              className="text-[12px]"
            >
              {revoke.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                  Revogando...
                </>
              ) : (
                "Sim, revogar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
