"use client";

import { useEffect, useState } from "react";
import { Bot, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAgentEnvStatus, useSetGitBot } from "@/lib/hooks/use-agent-env";

const DEFAULT_NAME = "Scrumban Bot";
const DEFAULT_EMAIL = "bot@scrumban.app";

/**
 * Painel do bot Git per-VPS. Configura `~scrumban-agent/.gitconfig`
 * (user.name / user.email) — assina commits criados pelo `claude -p` no fim
 * do `RUN_CLAUDE_CODE`.
 *
 * Valores atuais lidos via `envStatus` (dados.gitBotName/Email do agent).
 * Sem persistência de credencial — só name/email visível.
 */
export function GitBotPanel({ agentId }: { agentId: string }) {
  const { data: status, isLoading } = useAgentEnvStatus(agentId);
  const mutation = useSetGitBot(agentId);

  const currentName = status?.gitBotName ?? null;
  const currentEmail = status?.gitBotEmail ?? null;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // Hidrata os campos com os valores atuais quando o status carrega
  useEffect(() => {
    if (status) {
      setName(currentName ?? DEFAULT_NAME);
      setEmail(currentEmail ?? DEFAULT_EMAIL);
    }
  }, [status, currentName, currentEmail]);

  const isValid = name.trim().length > 0 && /.+@.+\..+/.test(email);
  const isDirty =
    name.trim() !== (currentName ?? DEFAULT_NAME) ||
    email.trim() !== (currentEmail ?? DEFAULT_EMAIL);

  const handleUpdate = () => {
    mutation.mutate({ name: name.trim(), email: email.trim() });
  };

  return (
    <section className="rounded-md border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/40">
        <h2 className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
          <Bot className="h-3.5 w-3.5" />
          Bot Git
        </h2>
      </div>
      <div className="p-4 space-y-4">
        <p className="text-[12px] text-muted-foreground leading-relaxed">
          Identidade usada pelo agente para assinar commits no fim do
          <code className="mx-1 text-[11px] bg-muted px-1 rounded">
            claude -p
          </code>
          . Escrito em
          <code className="mx-1 text-[11px] bg-muted px-1 rounded">
            ~scrumban-agent/.gitconfig
          </code>
          na VPS.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="gitbot-name" className="text-[12px]">
              Nome
            </Label>
            <Input
              id="gitbot-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={DEFAULT_NAME}
              disabled={isLoading}
              className="text-[13px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gitbot-email" className="text-[12px]">
              Email
            </Label>
            <Input
              id="gitbot-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={DEFAULT_EMAIL}
              disabled={isLoading}
              className="text-[13px] font-mono"
            />
          </div>
        </div>

        <div className="flex items-center justify-end">
          <Button
            size="sm"
            onClick={handleUpdate}
            disabled={isLoading || !isValid || !isDirty || mutation.isPending}
            className="text-[12px]"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                Atualizando...
              </>
            ) : (
              "Atualizar bot Git"
            )}
          </Button>
        </div>
      </div>
    </section>
  );
}
