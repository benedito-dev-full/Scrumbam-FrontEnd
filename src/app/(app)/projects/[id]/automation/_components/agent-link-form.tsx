"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Link2, Link2Off, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAgents } from "@/lib/hooks/use-agents";
import {
  useAgentLink,
  useUnlinkAgent,
} from "@/lib/hooks/use-automation";
import { ProvisionModal } from "./provision-modal";

interface AgentLinkFormProps {
  projectId: string;
}

/**
 * Card de vínculo VPS ao projeto.
 *
 * Refatorado na Fase 7 (plan-provision-modal-frontend):
 *  - Form de vinculo removido — toda a lógica moveu para ProvisionModal
 *    (passo 1 = vincular, passo 2 = configurar repo + clonar).
 *  - Exibe estado readonly + botões contextuais ("Re-clonar" /
 *    "Configurar repositório" / "Vincular VPS").
 *  - Botão "Desvincular" preservado no header com dialog de confirmação.
 */
export function AgentLinkForm({ projectId }: AgentLinkFormProps) {
  const { data: agents, isLoading: loadingAgents } = useAgents();
  const { data: link, isLoading: loadingLink } = useAgentLink(projectId);
  const unlinkMutation = useUnlinkAgent(projectId);

  const [confirmUnlink, setConfirmUnlink] = useState(false);
  const [provisionOpen, setProvisionOpen] = useState(false);
  const [initialStep, setInitialStep] = useState<1 | 2>(1);
  const [initialRepoUrl, setInitialRepoUrl] = useState("");

  const isLinked = !!link?.agent;

  const handleUnlink = () => {
    unlinkMutation.mutate(undefined, {
      onSuccess: () => setConfirmUnlink(false),
    });
  };

  if (loadingLink) {
    return (
      <div className="rounded-md border border-border bg-card p-4">
        <div className="h-5 w-40 bg-muted rounded animate-pulse mb-3" />
        <div className="space-y-2">
          <div className="h-9 w-full bg-muted rounded animate-pulse" />
          <div className="h-9 w-full bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-md border border-border bg-card overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border bg-card/40">
        <div className="flex items-center gap-2 min-w-0">
          {isLinked ? (
            <Link2 className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Link2Off className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <h2 className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
            Vinculo VPS
          </h2>
        </div>
        {isLinked && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setConfirmUnlink(true)}
            className="text-[12px] text-destructive hover:text-destructive hover:bg-destructive/10 h-7"
          >
            Desvincular
          </Button>
        )}
      </header>

      {/* Body */}
      {isLinked ? (
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 space-y-0.5">
              <p className="text-[13px] font-medium truncate">
                {link?.agent?.nome}
              </p>
              <p className="text-[11px] text-muted-foreground font-mono truncate">
                {link?.remoteRepoUrl ?? "Sem repositório configurado"}
              </p>
            </div>
            {link?.remoteRepoUrl ? (
              <Button
                variant="outline"
                size="sm"
                className="text-[12px] shrink-0"
                onClick={() => {
                  setInitialStep(2);
                  setInitialRepoUrl(link?.remoteRepoUrl ?? "");
                  setProvisionOpen(true);
                }}
              >
                Re-clonar
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="text-[12px] shrink-0"
                onClick={() => {
                  setInitialStep(2);
                  setInitialRepoUrl("");
                  setProvisionOpen(true);
                }}
              >
                Configurar repositório
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="p-4">
          {!loadingAgents && !agents?.length ? (
            <p className="text-[11px] text-amber-500 flex items-center gap-1.5">
              <AlertCircle className="h-3 w-3" />
              Cadastre uma VPS em{" "}
              <Link
                href="/vps"
                className="underline underline-offset-2 hover:text-amber-400"
              >
                /vps
              </Link>{" "}
              antes de vincular.
            </p>
          ) : (
            <Button
              size="sm"
              className="text-[12px] w-full"
              onClick={() => {
                setInitialStep(1);
                setInitialRepoUrl("");
                setProvisionOpen(true);
              }}
            >
              Vincular VPS
            </Button>
          )}
        </div>
      )}

      {/* Provision Modal */}
      <ProvisionModal
        projectId={projectId}
        open={provisionOpen}
        onClose={() => setProvisionOpen(false)}
        initialStep={initialStep}
        initialAgentId={link?.agent?.id}
        initialRepoUrl={initialRepoUrl}
      />

      {/* Confirm unlink dialog */}
      <Dialog open={confirmUnlink} onOpenChange={setConfirmUnlink}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Desvincular VPS?</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Esta ação removerá o vínculo entre o projeto e{" "}
                  <strong>{link?.agent?.nome}</strong>.
                </p>
                <ul className="list-disc ml-5 space-y-1 text-[12px]">
                  <li>
                    Comandos de automação deste projeto deixarão de ser
                    executados.
                  </li>
                  <li>
                    Deploy keys e .gitconfig na VPS NÃO são removidos
                    automaticamente.
                  </li>
                  <li>
                    A VPS em si continua ativa e pode ser revinculada a outro
                    projeto.
                  </li>
                </ul>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmUnlink(false)}
              disabled={unlinkMutation.isPending}
              className="text-[12px]"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleUnlink}
              disabled={unlinkMutation.isPending}
              className="text-[12px]"
            >
              {unlinkMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                  Desvinculando...
                </>
              ) : (
                "Sim, desvincular"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
