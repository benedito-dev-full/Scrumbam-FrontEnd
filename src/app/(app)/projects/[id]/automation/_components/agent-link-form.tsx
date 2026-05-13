"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Link2, Link2Off, AlertCircle, KeyRound } from "lucide-react";

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
 * Form que vincula uma VPS ao projeto.
 *
 * Mudanças Fase 6.1 (plan-2026-05-13):
 *  - Removido `remotePath` (backend resolve via projectSlug + CLAUDE.md global
 *    da VPS — ADR-V2-030 e ADR-V2-035).
 *  - Removido `gitBotEmail` / `gitBotName` (moveram para `/vps/:id` — bot Git
 *    é per-VPS, não per-projeto).
 *  - Mantidos: dropdown VPS, repo URL, branch padrão, timeout.
 *  - `projectSlug` é auto-gerado pelo backend a partir de `project.nome` —
 *    o frontend não envia (é exibido no `ProjectSlugCard` separado).
 *
 * Credenciais (PAT/Anthropic) e bot Git ficam em `/vps/:id`. Deploy key SSH
 * fica no `DeployKeyPanel` separado nesta mesma página.
 */
export function AgentLinkForm({ projectId }: AgentLinkFormProps) {
  const { data: agents, isLoading: loadingAgents } = useAgents();
  const { data: link, isLoading: loadingLink } = useAgentLink(projectId);
  const linkMutation = useLinkAgent(projectId);
  const unlinkMutation = useUnlinkAgent(projectId);

  const [confirmUnlink, setConfirmUnlink] = useState(false);
  const [form, setForm] = useState<LinkAgentInput>({
    idAgent: "",
    remoteBranch: "main",
    remoteRepoUrl: "",
    executionTimeoutMs: 1_800_000,
  });

  // Sincroniza form com vinculo existente
  useEffect(() => {
    if (link) {
      setForm({
        idAgent: link.agent?.id ?? "",
        remoteBranch: link.remoteBranch ?? "main",
        remoteRepoUrl: link.remoteRepoUrl ?? "",
        executionTimeoutMs: link.executionTimeoutMs,
      });
    }
  }, [link]);

  const isLinked = !!link?.agent;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.idAgent) return;
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

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Agente */}
        <div className="space-y-1.5">
          <Label htmlFor="agent" className="text-[12px]">
            VPS
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
                      ? "Selecione uma VPS"
                      : "Nenhuma VPS cadastrada"
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
              Cadastre uma VPS em{" "}
              <Link
                href="/vps"
                className="underline underline-offset-2 hover:text-amber-400"
              >
                /vps
              </Link>{" "}
              antes de vincular.
            </p>
          )}
        </div>

        {/* Branch + Repo URL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="remoteBranch" className="text-[12px]">
              Branch padrão
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
              URL do repositório
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

        {/* Timeout */}
        <div className="space-y-1.5">
          <Label htmlFor="timeout" className="text-[12px]">
            Timeout de execução
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
            Tempo máximo de execução por comando antes da VPS cancelar.
          </p>
        </div>

        {/* Aviso sobre credenciais/bot Git movidos */}
        <div className="rounded-sm border border-border/60 bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground leading-relaxed flex items-start gap-2">
          <KeyRound className="h-3 w-3 mt-0.5 shrink-0" />
          <span>
            Credenciais (PAT GitHub, ANTHROPIC_API_KEY) e o bot Git (name/email)
            agora ficam em <code className="text-[10px]">/vps/:id</code> — são
            per-VPS, compartilhados entre todos os projetos da mesma VPS.
          </span>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <Button
            type="submit"
            size="sm"
            disabled={!form.idAgent || linkMutation.isPending}
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
              "Vincular VPS"
            )}
          </Button>
        </div>
      </form>

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
