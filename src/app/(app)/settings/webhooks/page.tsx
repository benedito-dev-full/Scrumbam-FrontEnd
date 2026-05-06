"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Webhook as WebhookIcon,
  Plus,
  Trash2,
  Copy,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { PageTransition } from "@/components/common/page-transition";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { webhooksApi } from "@/lib/api/webhooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { Webhook, WebhookEvent } from "@/types";
import { WEBHOOK_EVENTS } from "@/types/webhook";

export default function WebhooksPage() {
  usePageTitle("Webhooks");
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<WebhookEvent[]>([]);
  const [creating, setCreating] = useState(false);
  const [newSecret, setNewSecret] = useState<string | null>(null);

  const loadWebhooks = useCallback(async () => {
    try {
      const data = await webhooksApi.list();
      setWebhooks(data);
    } catch {
      toast.error("Erro ao carregar webhooks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWebhooks();
  }, [loadWebhooks]);

  const toggleEvent = (event: WebhookEvent) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
    );
  };

  const handleAdd = async () => {
    if (!url.trim() || selectedEvents.length === 0) return;
    setCreating(true);
    try {
      const result = await webhooksApi.configure({
        url: url.trim(),
        events: selectedEvents,
      });
      setNewSecret(result.secret);
      toast.success("Webhook configurado com sucesso");
      await loadWebhooks();
      setUrl("");
      setSelectedEvents([]);
    } catch {
      toast.error("Erro ao configurar webhook");
    } finally {
      setCreating(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await webhooksApi.remove(id);
      setWebhooks((prev) =>
        prev.filter((w) => w.chave !== id && String(w.chave) !== String(id)),
      );
      toast.success("Webhook removido");
    } catch {
      toast.error("Erro ao remover webhook");
    }
  };

  const copySecret = () => {
    if (newSecret) {
      navigator.clipboard.writeText(newSecret);
      toast.success("Secret copiado!");
    }
  };

  if (loading) {
    return (
      <PageTransition className="space-y-6 px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-muted" />
          <div className="h-32 rounded bg-muted" />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="space-y-6 px-8 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Webhooks</h1>
          <p className="text-sm text-muted-foreground">
            Receba notificacoes em tempo real quando eventos acontecem
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Webhook
        </Button>
      </div>

      {/* Webhook list */}
      {webhooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card p-8 text-center">
          <div className="rounded-full bg-primary/10 p-4">
            <WebhookIcon className="h-10 w-10 text-primary/60" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">Nenhum webhook</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            Configure webhooks para receber notificacoes quando intencoes forem
            criadas, movidas ou atualizadas.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setShowAdd(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Webhook
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map((webhook) => (
            <div
              key={webhook.chave}
              className="flex items-center justify-between rounded-lg border bg-card p-4"
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-mono truncate">
                    {webhook.url}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {webhook.events.map((event) => (
                    <Badge
                      key={event}
                      variant="secondary"
                      className="text-[10px]"
                    >
                      {event}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Criado em{" "}
                  {new Date(webhook.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-destructive hover:text-destructive"
                onClick={() => handleRemove(webhook.chave)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add webhook dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Webhook</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="webhookUrl">URL</Label>
              <Input
                id="webhookUrl"
                placeholder="https://exemplo.com/webhook"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Eventos</Label>
              <div className="grid grid-cols-2 gap-2">
                {WEBHOOK_EVENTS.map((event) => (
                  <label
                    key={event}
                    className="flex items-center gap-2 rounded-md border p-2 cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedEvents.includes(event)}
                      onChange={() => toggleEvent(event)}
                      className="rounded"
                    />
                    <span className="text-sm">{event}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button
              onClick={handleAdd}
              disabled={creating || !url.trim() || selectedEvents.length === 0}
              className="w-full"
            >
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Configurando...
                </>
              ) : (
                "Configurar Webhook"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Secret reveal dialog */}
      <Dialog open={!!newSecret} onOpenChange={() => setNewSecret(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Webhook Secret</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Guarde este secret. Ele sera usado para validar as assinaturas
              HMAC-SHA256 dos payloads. Nao sera exibido novamente.
            </p>
            <div className="flex gap-2">
              <Input
                value={newSecret || ""}
                readOnly
                className="font-mono text-xs"
              />
              <Button variant="outline" size="icon" onClick={copySecret}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Button
              onClick={() => setNewSecret(null)}
              variant="outline"
              className="w-full"
            >
              Entendi, fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
