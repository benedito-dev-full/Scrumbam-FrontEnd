"use client";

import { useEffect, useState } from "react";
import { Send, Copy, Check, Loader2, Unlink, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGenerateTelegramPairing,
  useTelegramStatus,
  useUnlinkTelegram,
} from "@/lib/hooks/use-telegram";
import { toast } from "sonner";

export function OrgTelegramLink() {
  const { data: status, isLoading } = useTelegramStatus();
  const generatePairing = useGenerateTelegramPairing();
  const unlink = useUnlinkTelegram();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [botUsername, setBotUsername] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [copied, setCopied] = useState(false);

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

  const handleUnlink = () => {
    unlink.mutate();
  };

  const mmss =
    secondsLeft > 0
      ? `${Math.floor(secondsLeft / 60)
          .toString()
          .padStart(2, "0")}:${(secondsLeft % 60).toString().padStart(2, "0")}`
      : "00:00";

  if (isLoading) {
    return (
      <Card className="border-l-[3px] border-l-cyan-500">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-3.5 w-56" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-40" />
        </CardContent>
      </Card>
    );
  }

  const linked = status?.linked === true;

  return (
    <>
      <Card className="border-l-[3px] border-l-cyan-500">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-cyan-500/10 p-3">
              <Send className="h-6 w-6 text-cyan-500" />
            </div>
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                Telegram
                {linked && (
                  <Badge
                    variant="outline"
                    className="text-[10px] border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  >
                    Vinculado
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs">
                {linked
                  ? "Capture intencoes direto do Telegram para seu INBOX"
                  : "Vincule seu Telegram para capturar intencoes via bot"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {linked ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1 text-sm">
                {status?.telegramUsername && (
                  <p>
                    <span className="text-muted-foreground">Usuario:</span>{" "}
                    <span className="font-medium">
                      @{status.telegramUsername}
                    </span>
                  </p>
                )}
                {status?.linkedAt && (
                  <p className="text-xs text-muted-foreground">
                    Vinculado em{" "}
                    {new Date(status.linkedAt).toLocaleString("pt-BR")}
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUnlink}
                disabled={unlink.isPending}
                className="gap-2"
              >
                {unlink.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Unlink className="h-4 w-4" />
                )}
                Desvincular
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleGenerate}
              disabled={generatePairing.isPending}
              className="gap-2"
            >
              {generatePairing.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Vincular Telegram
            </Button>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-cyan-500" />
              Vincular Telegram
            </DialogTitle>
            <DialogDescription>
              Envie o codigo abaixo no bot para vincular sua conta. O codigo
              expira em 10 minutos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-lg border bg-muted/40 p-4 text-center">
              <p className="text-xs text-muted-foreground mb-2">
                Seu codigo de pareamento
              </p>
              <p className="text-3xl font-mono font-bold tracking-[0.3em] text-cyan-600 dark:text-cyan-400">
                {pairingCode ?? "------"}
              </p>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Expira em{" "}
                <span
                  className={
                    secondsLeft < 60
                      ? "font-medium text-destructive"
                      : "font-medium"
                  }
                >
                  {mmss}
                </span>
              </p>
            </div>

            <div className="space-y-2">
              <Button
                onClick={handleCopy}
                variant="outline"
                className="w-full gap-2"
                disabled={!pairingCode}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? "Copiado" : "Copiar codigo"}
              </Button>

              {botUsername && (
                <a
                  href={`https://t.me/${botUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button variant="default" className="w-full gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Abrir @{botUsername}
                  </Button>
                </a>
              )}
            </div>

            <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Como vincular:</p>
              <ol className="list-decimal pl-4 space-y-0.5">
                <li>Abra o bot no Telegram</li>
                <li>
                  Envie o codigo{" "}
                  <code className="font-mono">{pairingCode}</code>
                </li>
                <li>
                  Pronto! Seu Telegram sera vinculado e voce podera capturar
                  intencoes
                </li>
              </ol>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="w-full"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
