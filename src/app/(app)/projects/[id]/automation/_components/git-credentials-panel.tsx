"use client";

import { useState } from "react";
import {
  Key,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  KeyRound,
  Trash2,
  Settings,
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
  useGitCredentials,
  useGenerateGitCredentials,
  useRevokeGitCredentials,
  useApplyGitConfig,
} from "@/lib/hooks/use-automation";

interface GitCredentialsPanelProps {
  projectId: string;
}

/**
 * Painel de gestao de deploy keys SSH por projeto (decisao D3).
 *
 * Fluxo:
 * 1. Operador clica "Gerar deploy key" -> backend dispara GIT_CREDS_GENERATE
 *    no agente, recebe public key + fingerprint, persiste em DProject.
 * 2. UI exibe public key copiavel + instrucoes para cadastrar no GitHub.
 * 3. Operador cadastra public key manualmente em github.com/<repo>/settings/keys.
 * 4. Operador marca checkbox "Cadastrei no GitHub" -> habilita "Aplicar config".
 * 5. "Aplicar config" dispara GIT_CONFIG_APPLY (escreve .gitconfig na VPS).
 *
 * Private key NUNCA chega ao backend. Issue M1 (review backend Fase 2):
 * `privateKeyPath` foi removido do response — backend nao expoe layout
 * do filesystem da VPS.
 */
export function GitCredentialsPanel({ projectId }: GitCredentialsPanelProps) {
  const { data: info, isLoading } = useGitCredentials(projectId);
  const generateMutation = useGenerateGitCredentials(projectId);
  const revokeMutation = useRevokeGitCredentials(projectId);
  const applyMutation = useApplyGitConfig(projectId);

  const [copiedKey, setCopiedKey] = useState(false);
  const [confirmedGithub, setConfirmedGithub] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  // Public key recem-gerada (mostra ao usuario; depois cai no info.publicKey)
  const [freshlyGenerated, setFreshlyGenerated] = useState<{
    publicKey: string;
    fingerprint: string;
    instructions: string[];
  } | null>(null);

  const hasKey = info?.hasKey ?? false;
  const publicKey = freshlyGenerated?.publicKey ?? info?.publicKey ?? null;
  const fingerprint =
    freshlyGenerated?.fingerprint ?? info?.fingerprint ?? null;

  const handleGenerate = () => {
    generateMutation.mutate(undefined, {
      onSuccess: (data) => {
        setFreshlyGenerated({
          publicKey: data.publicKey,
          fingerprint: data.fingerprint,
          instructions: data.instructions,
        });
        setConfirmedGithub(false);
      },
    });
  };

  const handleRevoke = () => {
    revokeMutation.mutate(undefined, {
      onSuccess: () => {
        setConfirmRevoke(false);
        setFreshlyGenerated(null);
        setConfirmedGithub(false);
      },
    });
  };

  const copyKey = async () => {
    if (!publicKey) return;
    try {
      await navigator.clipboard.writeText(publicKey);
      setCopiedKey(true);
      toast.success("Public key copiada");
      setTimeout(() => setCopiedKey(false), 2000);
    } catch {
      toast.error("Falha ao copiar");
    }
  };

  if (isLoading) {
    return (
      <section className="rounded-md border border-border bg-card p-4">
        <div className="h-5 w-40 bg-muted rounded animate-pulse mb-3" />
        <div className="h-9 w-full bg-muted rounded animate-pulse" />
      </section>
    );
  }

  return (
    <section className="rounded-md border border-border bg-card overflow-hidden">
      <header className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border bg-card/40">
        <div className="flex items-center gap-2 min-w-0">
          <Key className="h-3.5 w-3.5 text-muted-foreground" />
          <h2 className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
            Deploy Key (Git SSH)
          </h2>
        </div>
        {hasKey && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setConfirmRevoke(true)}
            className="text-[12px] text-destructive hover:text-destructive hover:bg-destructive/10 h-7"
          >
            <Trash2 className="mr-1.5 h-3 w-3" />
            Revogar
          </Button>
        )}
      </header>

      <div className="p-4 space-y-4">
        {!hasKey && (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-[12px] font-medium">
                  Nenhuma deploy key gerada
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Gere uma chave SSH ed25519 para que o agente possa abrir PRs
                  no GitHub em nome do projeto. A chave privada fica somente na
                  VPS — o backend recebe apenas a publica.
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              className="text-[12px] mt-2"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                  Gerando...
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

        {hasKey && publicKey && (
          <>
            {/* Public key block */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[12px] text-muted-foreground">
                  Public key (cole no GitHub)
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={copyKey}
                  className="h-6 text-[11px]"
                >
                  {copiedKey ? (
                    <>
                      <Check className="mr-1 h-3 w-3" />
                      Copiada
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1 h-3 w-3" />
                      Copiar
                    </>
                  )}
                </Button>
              </div>
              <pre className="text-[11px] font-mono bg-muted/40 border border-border rounded p-2 overflow-x-auto whitespace-pre-wrap break-all">
                {publicKey}
              </pre>
              {fingerprint && (
                <p className="text-[11px] text-muted-foreground">
                  Fingerprint: <span className="font-mono">{fingerprint}</span>
                </p>
              )}
            </div>

            {/* GitHub setup instructions */}
            <div className="rounded-md border border-border bg-muted/20 p-3 space-y-2">
              <p className="text-[12px] font-medium">
                Como cadastrar no GitHub
              </p>
              <ol className="text-[11px] text-muted-foreground space-y-1 list-decimal ml-4">
                <li>Copie a public key acima.</li>
                <li>
                  Va em{" "}
                  <code className="text-foreground">
                    github.com/&lt;org&gt;/&lt;repo&gt;/settings/keys
                  </code>
                  .
                </li>
                <li>Clique em &quot;Add deploy key&quot;.</li>
                <li>Cole no campo &quot;Key&quot;.</li>
                <li>
                  Marque <strong>&quot;Allow write access&quot;</strong>{" "}
                  (necessario para abrir PRs).
                </li>
                <li>Clique em &quot;Add key&quot; e volte aqui.</li>
              </ol>
            </div>

            {/* Confirmation checkbox + Apply config */}
            <div className="rounded-md border border-border p-3 space-y-3">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmedGithub}
                  onChange={(e) => setConfirmedGithub(e.target.checked)}
                  className="mt-0.5"
                />
                <span className="text-[12px]">
                  Cadastrei a public key no GitHub e estou pronto para aplicar a
                  configuracao Git na VPS.
                </span>
              </label>

              <Button
                type="button"
                size="sm"
                onClick={() => applyMutation.mutate()}
                disabled={!confirmedGithub || applyMutation.isPending}
                className="text-[12px] w-full sm:w-auto"
              >
                {applyMutation.isPending ? (
                  <>
                    <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                    Aplicando...
                  </>
                ) : (
                  <>
                    <Settings className="mr-1.5 h-3 w-3" />
                    Aplicar config Git na VPS
                  </>
                )}
              </Button>

              <p className="text-[11px] text-muted-foreground">
                Escreve <code>.gitconfig</code> em{" "}
                <code>~/.config/git/&lt;projeto&gt;/</code> com{" "}
                <code>core.sshCommand</code> apontando para esta key e{" "}
                <code>user.email</code>/<code>user.name</code> do bot.
              </p>
            </div>

            {/* Regenerate */}
            <div className="pt-2 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleGenerate}
                disabled={generateMutation.isPending}
                className="text-[12px]"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                    Regenerando...
                  </>
                ) : (
                  <>
                    <KeyRound className="mr-1.5 h-3 w-3" />
                    Regenerar deploy key
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Confirm revoke dialog */}
      <Dialog open={confirmRevoke} onOpenChange={setConfirmRevoke}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Revogar deploy key?</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Esta acao apaga a public key e o fingerprint do banco. Apos
                  revogar:
                </p>
                <ul className="list-disc ml-5 space-y-1 text-[12px]">
                  <li>
                    O agente nao podera mais autenticar pushes ate uma nova key
                    ser gerada.
                  </li>
                  <li>
                    A entrada no GitHub continua existindo — voce precisa
                    remove-la manualmente em{" "}
                    <code className="text-[11px]">
                      github.com/&lt;repo&gt;/settings/keys
                    </code>
                    .
                  </li>
                  <li>
                    A private key na VPS NAO e apagada automaticamente. Cleanup
                    gracioso fica para Fase 5.
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
