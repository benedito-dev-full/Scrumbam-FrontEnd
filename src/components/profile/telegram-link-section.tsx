"use client";

import { useEffect, useState } from "react";
import {
  Send,
  Copy,
  Check,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useGenerateTelegramPairing,
  useTelegramStatus,
  useUnlinkTelegram,
} from "@/lib/hooks/use-telegram";
import { cn } from "@/lib/utils";

/**
 * Card de vinculacao do Telegram exibido na pagina de perfil.
 *
 * Estados:
 *  - Loading: skeleton compacto
 *  - Nao vinculado: botao "Vincular" abre dialog com codigo de 6 chars,
 *    countdown MM:SS (TTL 10min) e link direto pro @Scrumban_Capture_Bot
 *  - Vinculado: badge verde + username + data + botao "Desvincular"
 *
 * Backend: POST /channels/telegram/pairing | GET /status | DELETE /unlink
 */
export function TelegramLinkSection() {
  const { data: status, isLoading } = useTelegramStatus();
  const generatePairing = useGenerateTelegramPairing();
  const unlink = useUnlinkTelegram();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [botUsername, setBotUsername] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [copied, setCopied] = useState(false);

  // Countdown — atualiza a cada segundo enquanto dialog aberto
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const diff = Math.max(
        0,
        Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000),
      );
      setSecondsLeft(diff);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const handleGenerate = async () => {
    const res = await generatePairing.mutateAsync();
    setPairingCode(res.pairingCode);
    setBotUsername(res.botUsername);
    setExpiresAt(res.expiresAt);
    setCopied(false);
    setDialogOpen(true);
  };

  const handleCopy = async () => {
    if (!pairingCode) return;
    try {
      await navigator.clipboard.writeText(pairingCode);
      setCopied(true);
      toast.success("Codigo copiado");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Nao foi possivel copiar");
    }
  };

  const mmss =
    secondsLeft > 0
      ? `${Math.floor(secondsLeft / 60)
          .toString()
          .padStart(2, "0")}:${(secondsLeft % 60).toString().padStart(2, "0")}`
      : "00:00";

  const isLinked = !!status?.linked;
  const expired = secondsLeft === 0 && !!pairingCode;

  return (
    <section className="space-y-3">
      <h2 className="text-base font-medium">Canais conectados</h2>
      <div className="rounded-md border border-border bg-card overflow-hidden">
        <div className="flex items-start justify-between gap-6 px-4 py-3">
          <div className="flex flex-1 min-w-0 items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-sky-500/10 text-sky-500">
              <Send className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[13px] font-medium">Telegram</p>
                {isLinked && (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Vinculado
                  </span>
                )}
              </div>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                {isLoading
                  ? "Carregando..."
                  : isLinked
                    ? `${
                        status?.telegramUsername
                          ? `@${status.telegramUsername}`
                          : "Conta vinculada"
                      }${
                        status?.linkedAt
                          ? ` em ${formatDate(status.linkedAt)}`
                          : ""
                      }`
                    : "Capture issues conversando direto com o bot no Telegram."}
              </p>
            </div>
          </div>

          <div className="shrink-0">
            {isLoading ? (
              <div className="h-8 w-24 animate-pulse rounded bg-muted" />
            ) : isLinked ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => unlink.mutate()}
                disabled={unlink.isPending}
                className="text-[12px] h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                {unlink.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "Desvincular"
                )}
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleGenerate}
                disabled={generatePairing.isPending}
                className="text-[12px] h-8"
              >
                {generatePairing.isPending ? (
                  <>
                    <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  "Vincular"
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Dialog com codigo de pareamento */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Vincular Telegram</DialogTitle>
            <DialogDescription>
              Use este codigo no @
              {botUsername ?? "Scrumban_Capture_Bot"} para conectar sua conta.
              O codigo expira em 10 minutos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Codigo grande + copy */}
            <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/30 px-4 py-3">
              <span
                className={cn(
                  "font-mono text-2xl font-bold tracking-[0.3em] tabular-nums",
                  expired && "text-muted-foreground line-through",
                )}
              >
                {pairingCode ?? "------"}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopy}
                disabled={!pairingCode || expired}
                className="h-8 w-8 p-0"
                aria-label="Copiar codigo"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Countdown */}
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-muted-foreground">
                {expired ? "Codigo expirado" : "Expira em"}
              </span>
              <span
                className={cn(
                  "font-mono font-semibold tabular-nums",
                  expired
                    ? "text-destructive"
                    : secondsLeft < 60
                      ? "text-amber-500"
                      : "text-foreground",
                )}
              >
                {mmss}
              </span>
            </div>

            {/* Passos */}
            <ol className="space-y-2 text-[12px] text-muted-foreground">
              <li className="flex gap-2">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground">
                  1
                </span>
                Abra o Telegram e procure por @
                {botUsername ?? "Scrumban_Capture_Bot"}
              </li>
              <li className="flex gap-2">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground">
                  2
                </span>
                Envie o comando <code className="rounded bg-muted px-1">/start</code> e cole o codigo acima
              </li>
              <li className="flex gap-2">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground">
                  3
                </span>
                Pronto — issues capturadas no chat aparecem no seu Inbox
              </li>
            </ol>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            {botUsername && (
              <a
                href={`https://t.me/${botUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-sky-500/10 px-3 text-[12px] font-medium text-sky-500 hover:bg-sky-500/20 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                Abrir bot
              </a>
            )}
            {expired ? (
              <Button
                size="sm"
                onClick={handleGenerate}
                disabled={generatePairing.isPending}
                className="text-[12px] h-8"
              >
                {generatePairing.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "Gerar novo codigo"
                )}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="text-[12px] h-8"
              >
                Fechar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
