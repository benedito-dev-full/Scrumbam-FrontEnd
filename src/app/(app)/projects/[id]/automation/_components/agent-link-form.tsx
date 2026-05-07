"use client";

import { useEffect, useState } from "react";
import { Loader2, Link2, Link2Off, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  useLinkAgent,
  useUnlinkAgent,
} from "@/lib/hooks/use-automation";
import type { LinkAgentInput } from "@/lib/api/automation";

interface AgentLinkFormProps {
  projectId: string;
}

const TIMEOUT_PRESETS = [
  { value: 600_000, label: "10 minutos" },
  { value: 1_800_000, label: "30 minutos (default)" },
  { value: 3_600_000, label: "1 hora" },
  { value: 7_200_000, label: "2 horas (max)" },
] as const;

/**
 * Form que vincula um DAgent a um DProject.
 *
 * Lista agentes da org via `useAgents()`, permite escolher remotePath,
 * branch, repoUrl, gitBotEmail/Name e executionTimeoutMs.
 *
 * - Se ja existe vinculo, mostra dados atuais + botao "Desvincular" e
 *   permite editar campos.
 * - Validacoes basicas inline; backend faz validacao final (path
 *   absoluto, owner do agente etc).
 *
 * ADMIN only — controller backend ja barra MEMBER/VIEWER com
 * RolesGuard. Front nao precisa duplicar (mas oculta CTA destrutivo se
 * nao for admin).
 */
export function AgentLinkForm({ projectId }: AgentLinkFormProps) {
  const { data: agents, isLoading: loadingAgents } = useAgents();
  const { data: link, isLoading: loadingLink } = useAgentLink(projectId);
  const linkMutation = useLinkAgent(projectId);
  const unlinkMutation = useUnlinkAgent(projectId);

  const [confirmUnlink, setConfirmUnlink] = useState(false);
  const [form, setForm] = useState<LinkAgentInput>({
    idAgent: "",
    remotePath: "",
    remoteBranch: "main",
    remoteRepoUrl: "",
    gitBotEmail: "bot@scrumban.app",
    gitBotName: "Scrumban Bot",
    executionTimeoutMs: 1_800_000,
  });

  // Sincroniza form com vinculo existente (se houver)
  useEffect(() => {
    if (link) {
      setForm({
        idAgent: link.agent?.id ?? "",
        remotePath: link.remotePath ?? "",
        remoteBranch: link.remoteBranch ?? "main",
        remoteRepoUrl: link.remoteRepoUrl ?? "",
        gitBotEmail: link.gitBotEmail,
        gitBotName: link.gitBotName,
        executionTimeoutMs: link.executionTimeoutMs,
      });
    }
  }, [link]);

  const isLinked = !!link?.agent;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.idAgent || !form.remotePath) return;
    linkMutation.mutate(form);
  };

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
      <header className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border bg-card/40">
        <div className="flex items-center gap-2 min-w-0">
          {isLinked ? (
            <Link2 className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Link2Off className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <h2 className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
            Vinculo Agente
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

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Agente */}
        <div className="space-y-1.5">
          <Label htmlFor="agent" className="text-[12px]">
            Agente
          </Label>
          <Select
            value={form.idAgent}
            onValueChange={(v) => setForm((f) => ({ ...f, idAgent: v }))}
            disabled={loadingAgents || linkMutation.isPending}
          >
            <SelectTrigger id="agent" className="text-[13px]">
              <SelectValue
                placeholder={
                  loadingAgents
                    ? "Carregando..."
                    : agents?.length
                      ? "Selecione um agente"
                      : "Nenhum agente cadastrado"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {agents?.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  <div className="flex items-center gap-2">
                    <span>{a.nome}</span>
                    <span className="text-[11px] text-muted-foreground">
                      ({a.status})
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!loadingAgents && !agents?.length && (
            <p className="text-[11px] text-amber-500 flex items-center gap-1.5 mt-1">
              <AlertCircle className="h-3 w-3" />
              Cadastre um agente em /agents antes de vincular.
            </p>
          )}
        </div>

        {/* Remote Path */}
        <div className="space-y-1.5">
          <Label htmlFor="remotePath" className="text-[12px]">
            Caminho remoto na VPS
          </Label>
          <Input
            id="remotePath"
            type="text"
            value={form.remotePath}
            onChange={(e) =>
              setForm((f) => ({ ...f, remotePath: e.target.value }))
            }
            placeholder="/home/scrumban-agent/projects/dinpayz"
            className="text-[13px] font-mono"
            required
            disabled={linkMutation.isPending}
          />
          <p className="text-[11px] text-muted-foreground">
            Path absoluto onde o repositorio esta clonado no host.
          </p>
        </div>

        {/* Branch + Repo URL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="remoteBranch" className="text-[12px]">
              Branch padrao
            </Label>
            <Input
              id="remoteBranch"
              type="text"
              value={form.remoteBranch ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, remoteBranch: e.target.value }))
              }
              placeholder="main"
              className="text-[13px] font-mono"
              disabled={linkMutation.isPending}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="remoteRepoUrl" className="text-[12px]">
              URL do repositorio
            </Label>
            <Input
              id="remoteRepoUrl"
              type="text"
              value={form.remoteRepoUrl ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, remoteRepoUrl: e.target.value }))
              }
              placeholder="git@github.com:org/repo.git"
              className="text-[13px] font-mono"
              disabled={linkMutation.isPending}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Git Bot */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="gitBotEmail" className="text-[12px]">
              Email do bot Git
            </Label>
            <Input
              id="gitBotEmail"
              type="email"
              value={form.gitBotEmail ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, gitBotEmail: e.target.value }))
              }
              placeholder="bot@scrumban.app"
              className="text-[13px]"
              disabled={linkMutation.isPending}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="gitBotName" className="text-[12px]">
              Nome do bot
            </Label>
            <Input
              id="gitBotName"
              type="text"
              value={form.gitBotName ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, gitBotName: e.target.value }))
              }
              placeholder="Scrumban Bot"
              className="text-[13px]"
              disabled={linkMutation.isPending}
            />
          </div>
        </div>

        {/* Timeout */}
        <div className="space-y-1.5">
          <Label htmlFor="timeout" className="text-[12px]">
            Timeout de execucao
          </Label>
          <Select
            value={String(form.executionTimeoutMs ?? 1_800_000)}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, executionTimeoutMs: Number(v) }))
            }
            disabled={linkMutation.isPending}
          >
            <SelectTrigger id="timeout" className="text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEOUT_PRESETS.map((p) => (
                <SelectItem key={p.value} value={String(p.value)}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">
            Tempo maximo de execucao por comando antes do agente cancelar.
          </p>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <Button
            type="submit"
            size="sm"
            disabled={
              !form.idAgent || !form.remotePath || linkMutation.isPending
            }
            className="text-[12px]"
          >
            {linkMutation.isPending ? (
              <>
                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                Salvando...
              </>
            ) : isLinked ? (
              "Atualizar vinculo"
            ) : (
              "Vincular agente"
            )}
          </Button>
        </div>
      </form>

      {/* Confirm unlink dialog */}
      <Dialog open={confirmUnlink} onOpenChange={setConfirmUnlink}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Desvincular agente?</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Esta acao removera o vinculo entre o projeto e{" "}
                  <strong>{link?.agent?.nome}</strong>.
                </p>
                <ul className="list-disc ml-5 space-y-1 text-[12px]">
                  <li>
                    Comandos de automacao deste projeto deixarao de ser
                    executados.
                  </li>
                  <li>
                    Deploy keys e .gitconfig na VPS NAO sao removidos
                    automaticamente.
                  </li>
                  <li>
                    O agente em si continua ativo e pode ser revinculado a outro
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
