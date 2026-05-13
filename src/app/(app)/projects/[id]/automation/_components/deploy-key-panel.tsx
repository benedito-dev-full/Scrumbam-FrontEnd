"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Check,
  Copy,
  KeyRound,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Trash2,
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
import { useAgentLink } from "@/lib/hooks/use-automation";
import {
  useDeployKey,
  useGenerateDeployKey,
  useRevokeDeployKey,
} from "@/lib/hooks/use-deploy-key";

interface DeployKeyPanelProps {
  projectId: string;
}

/**
 * Painel de Deploy Key SSH per-projeto-VPS (ADR-V2-042).
 *
 * Fluxo:
 *  - "Gerar deploy key" → backend dispara `GENERATE_DEPLOY_KEY` no agente,
 *    que gera `ssh-keygen ed25519` em `/etc/scrumban-agent/ssh-keys/<slug>`
 *    (idempotente — se já existe, retorna a mesma).
 *  - Frontend recebe apenas pubkey + fingerprint + instruções. Privada
 *    nunca sai da VPS.
 *  - "Regenerar" exige apagar manualmente o arquivo na VPS (operador SSH).
 *    Mostramos warning.
 *  - "Revogar" apaga só do banco; o arquivo continua na VPS.
 */
export function DeployKeyPanel({ projectId }: DeployKeyPanelProps) {
  const { data: link } = useAgentLink(projectId);
  const agentId = link?.agent?.id ?? null;

  const { data: deployKey, isLoading } = useDeployKey(projectId, agentId);
  const generateMutation = useGenerateDeployKey(projectId, agentId ?? "");
  const revokeMutation = useRevokeDeployKey(projectId, agentId ?? "");

  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const [copiedField, setCopiedField] = useState<
    "publicKey" | "snippet" | null
  >(null);

  if (!link?.agent) {
    return (
      <section className="rounded-md border border-border bg-card overflow-hidden">
        <header className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-card/40">
          <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
          <h2 className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
            Deploy key SSH
          </h2>
        </header>
        <div className="p-4">
          <p className="text-[12px] text-muted-foreground">
            Vincule uma VPS acima antes de gerar deploy key.
          </p>
        </div>
      </section>
    );
  }

  if (!link.projectSlug) {
    return (
      <section className="rounded-md border border-border bg-card overflow-hidden">
        <header className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-card/40">
          <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
          <h2 className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
            Deploy key SSH
          </h2>
        </header>
        <div className="p-4 space-y-2">
          <p className="text-[12px] text-amber-500 flex items-center gap-1.5">
            <AlertTriangle className="h-3 w-3" />
            Vínculo sem projectSlug. Re-vincule a VPS para gerar slug
            automático.
          </p>
        </div>
      </section>
    );
  }

  const handleCopy = async (
    value: string,
    field: "publicKey" | "snippet",
    label: string,
  ) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      toast.success(`${label} copiado`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error("Falha ao copiar. Selecione e copie manualmente.");
    }
  };

  const handleGenerate = () => generateMutation.mutate(undefined);

  const handleRegenerateConfirm = () => {
    setConfirmRegenerate(false);
    generateMutation.mutate(undefined);
  };

  const handleRevoke = () => {
    revokeMutation.mutate(undefined, {
      onSuccess: () => setConfirmRevoke(false),
    });
  };

  return (
    <section className="rounded-md border border-border bg-card overflow-hidden">
      <header className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border bg-card/40">
        <div className="flex items-center gap-2 min-w-0">
          <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
          <h2 className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
            Deploy key SSH
          </h2>
        </div>
        {deployKey && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setConfirmRevoke(true)}
            disabled={revokeMutation.isPending}
            className="text-[12px] text-destructive hover:text-destructive hover:bg-destructive/10 h-7"
          >
            <Trash2 className="mr-1 h-3 w-3" />
            Revogar
          </Button>
        )}
      </header>

      <div className="p-4 space-y-4">
        <p className="text-[12px] text-muted-foreground leading-relaxed">
          Chave SSH ed25519 gerada pelo próprio agente na VPS. A parte privada
          fica em{" "}
          <code className="text-[11px] bg-muted px-1 rounded">
            /etc/scrumban-agent/ssh-keys/{link.projectSlug}
          </code>{" "}
          e <strong>nunca sai da VPS</strong>. O backend só vê a pubkey.
        </p>

        {isLoading ? (
          <div className="space-y-2">
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            <div className="h-20 w-full bg-muted rounded animate-pulse" />
          </div>
        ) : deployKey ? (
          <DeployKeyDetails
            deployKey={deployKey}
            copiedField={copiedField}
            onCopyPublicKey={() =>
              handleCopy(deployKey.publicKey, "publicKey", "Pubkey")
            }
            onCopySnippet={() =>
              handleCopy(deployKey.sshConfigSnippet, "snippet", "Snippet")
            }
            onRegenerate={() => setConfirmRegenerate(true)}
            regenerating={generateMutation.isPending}
          />
        ) : (
          <div className="space-y-3">
            <p className="text-[12px] text-muted-foreground">
              Nenhuma deploy key gerada ainda.
            </p>
            <Button
              type="button"
              size="sm"
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              className="text-[12px]"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                  Gerando na VPS...
                </>
              ) : (
                <>
                  <KeyRound className="mr-1.5 h-3 w-3" />
                  Gerar deploy key
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Confirm regenerate */}
      <Dialog open={confirmRegenerate} onOpenChange={setConfirmRegenerate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Regenerar deploy key?</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 text-[13px]">
                <p>
                  O agente é <strong>idempotente</strong> — chamar
                  &quot;gerar&quot; novamente apenas devolve a chave já
                  existente. Para de fato rotacionar a chave:
                </p>
                <ol className="list-decimal ml-5 space-y-1 text-[12px]">
                  <li>
                    SSH na VPS e apague{" "}
                    <code className="text-[11px]">
                      /etc/scrumban-agent/ssh-keys/{link.projectSlug}*
                    </code>
                  </li>
                  <li>Volte aqui e clique novamente em gerar.</li>
                  <li>
                    Remova a deploy key antiga do GitHub e adicione a nova.
                  </li>
                </ol>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmRegenerate(false)}
              className="text-[12px]"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleRegenerateConfirm}
              className="text-[12px]"
            >
              <RefreshCw className="mr-1.5 h-3 w-3" />
              Tentar regerar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm revoke */}
      <Dialog open={confirmRevoke} onOpenChange={setConfirmRevoke}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Revogar deploy key?</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 text-[13px]">
                <p>Esta ação:</p>
                <ul className="list-disc ml-5 space-y-1 text-[12px]">
                  <li>Remove pubkey + fingerprint do banco.</li>
                  <li>
                    <strong>Não apaga</strong> o arquivo na VPS — você precisa
                    remover manualmente{" "}
                    <code className="text-[11px]">
                      /etc/scrumban-agent/ssh-keys/{link.projectSlug}*
                    </code>
                    .
                  </li>
                  <li>
                    <strong>Não remove</strong> do GitHub — você precisa remover
                    a deploy key lá manualmente.
                  </li>
                </ul>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmRevoke(false)}
              disabled={revokeMutation.isPending}
              className="text-[12px]"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRevoke}
              disabled={revokeMutation.isPending}
              className="text-[12px]"
            >
              {revokeMutation.isPending ? (
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
    </section>
  );
}

interface DeployKeyDetailsProps {
  deployKey: NonNullable<ReturnType<typeof useDeployKey>["data"]>;
  copiedField: "publicKey" | "snippet" | null;
  onCopyPublicKey: () => void;
  onCopySnippet: () => void;
  onRegenerate: () => void;
  regenerating: boolean;
}

function DeployKeyDetails({
  deployKey,
  copiedField,
  onCopyPublicKey,
  onCopySnippet,
  onRegenerate,
  regenerating,
}: DeployKeyDetailsProps) {
  if (!deployKey) return null;
  const generatedDate = new Date(deployKey.generatedAt).toLocaleString("pt-BR");

  return (
    <div className="space-y-4">
      {/* Status */}
      <div className="flex items-center gap-2 text-[11px] text-emerald-300/90">
        <ShieldCheck className="h-3 w-3" />
        Configurada em {generatedDate}
        {deployKey.alreadyExisted && (
          <span className="text-muted-foreground">(idempotente)</span>
        )}
      </div>

      {/* Pubkey */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-medium">Chave pública</span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onCopyPublicKey}
            className="text-[11px] h-7"
          >
            {copiedField === "publicKey" ? (
              <>
                <Check className="mr-1 h-3 w-3" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="mr-1 h-3 w-3" />
                Copiar pubkey
              </>
            )}
          </Button>
        </div>
        <pre className="overflow-x-auto rounded-sm border border-border bg-muted/50 px-3 py-2 text-[11px] font-mono leading-relaxed break-all whitespace-pre-wrap">
          {deployKey.publicKey}
        </pre>
        <p className="text-[11px] text-muted-foreground font-mono">
          {deployKey.fingerprint}
        </p>
      </div>

      {/* SSH config snippet */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-medium">
            ~/.ssh/config (opcional)
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onCopySnippet}
            className="text-[11px] h-7"
          >
            {copiedField === "snippet" ? (
              <>
                <Check className="mr-1 h-3 w-3" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="mr-1 h-3 w-3" />
                Copiar snippet
              </>
            )}
          </Button>
        </div>
        <pre className="overflow-x-auto rounded-sm border border-border bg-muted/50 px-3 py-2 text-[11px] font-mono leading-relaxed">
          {deployKey.sshConfigSnippet}
        </pre>
      </div>

      {/* Instructions */}
      {deployKey.instructions.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[12px] font-medium">
            Como adicionar no GitHub
          </span>
          <ol className="list-decimal ml-5 space-y-1 text-[12px] text-muted-foreground">
            {deployKey.instructions.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Regenerate */}
      <div className="flex items-center justify-end pt-2 border-t border-border">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRegenerate}
          disabled={regenerating}
          className="text-[11px]"
        >
          <RefreshCw className="mr-1 h-3 w-3" />
          Regenerar
        </Button>
      </div>
    </div>
  );
}
