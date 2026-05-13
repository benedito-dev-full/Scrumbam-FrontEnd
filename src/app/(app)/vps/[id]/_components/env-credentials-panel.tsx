"use client";

import { useState } from "react";
import { Eye, EyeOff, KeyRound, Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAgentEnvStatus, useSetAgentEnv } from "@/lib/hooks/use-agent-env";

/**
 * Painel de credenciais env do agent (PAT GitHub + Anthropic keys).
 *
 * Decisões (ADR-V2-041):
 * - Inputs `type="password"` por padrão; botão "olho" alterna visibilidade.
 * - Backend NUNCA recebe nem persiste plaintext após o write — só envia
 *   para a VPS via HMAC e marca `envStatus` (booleanos + timestamp).
 * - Após salvar com sucesso: inputs são limpos e o painel mostra
 *   "Configurado em DD/MM/AAAA HH:mm" (do `lastEnvUpdatedAt`).
 * - "Salvar credenciais" fica disabled quando todos os inputs estão vazios.
 */
export function EnvCredentialsPanel({ agentId }: { agentId: string }) {
  const { data: status, isLoading } = useAgentEnvStatus(agentId);
  const setEnv = useSetAgentEnv(agentId);

  const [githubToken, setGithubToken] = useState("");
  const [anthropicApiKey, setAnthropicApiKey] = useState("");
  const [anthropicAuthToken, setAnthropicAuthToken] = useState("");

  const [showGh, setShowGh] = useState(false);
  const [showAnthropic, setShowAnthropic] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const hasAnyInput =
    githubToken.length > 0 ||
    anthropicApiKey.length > 0 ||
    anthropicAuthToken.length > 0;

  const handleSave = () => {
    const payload: {
      githubToken?: string;
      anthropicApiKey?: string;
      anthropicAuthToken?: string;
    } = {};
    if (githubToken) payload.githubToken = githubToken;
    if (anthropicApiKey) payload.anthropicApiKey = anthropicApiKey;
    if (anthropicAuthToken) payload.anthropicAuthToken = anthropicAuthToken;

    setEnv.mutate(payload, {
      onSuccess: () => {
        setGithubToken("");
        setAnthropicApiKey("");
        setAnthropicAuthToken("");
        setShowGh(false);
        setShowAnthropic(false);
        setShowAuth(false);
      },
    });
  };

  return (
    <section className="rounded-md border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/40">
        <h2 className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
          <KeyRound className="h-3.5 w-3.5" />
          Credenciais (env file)
        </h2>
      </div>
      <div className="p-4 space-y-4">
        <p className="text-[12px] text-muted-foreground leading-relaxed">
          Estas credenciais ficam <strong>apenas na VPS</strong> em{" "}
          <code className="text-[11px] bg-muted px-1 rounded">
            /etc/scrumban-agent/environment
          </code>{" "}
          (0600). O backend nunca persiste o valor — só registra que foi
          configurado.
        </p>

        <div className="space-y-3">
          <SecretField
            label="GitHub PAT (escopo repo)"
            placeholder={
              status?.hasGithubToken
                ? "•••••••••••••••• (configurado)"
                : "ghp_xxx..."
            }
            value={githubToken}
            onChange={setGithubToken}
            show={showGh}
            onToggleShow={() => setShowGh((v) => !v)}
            id="env-gh-pat"
          />
          <SecretField
            label="ANTHROPIC_API_KEY"
            placeholder={
              status?.hasAnthropicKey
                ? "•••••••••••••••• (configurado)"
                : "sk-ant-..."
            }
            value={anthropicApiKey}
            onChange={setAnthropicApiKey}
            show={showAnthropic}
            onToggleShow={() => setShowAnthropic((v) => !v)}
            id="env-anthropic-key"
          />
          <SecretField
            label="ANTHROPIC_AUTH_TOKEN (opcional)"
            placeholder={
              status?.hasAnthropicKey
                ? "•••••••••••••••• (configurado)"
                : "Token alternativo (Bedrock/Vertex)"
            }
            value={anthropicAuthToken}
            onChange={setAnthropicAuthToken}
            show={showAuth}
            onToggleShow={() => setShowAuth((v) => !v)}
            id="env-anthropic-auth"
          />
        </div>

        <div className="flex items-center justify-between gap-4 pt-1">
          <StatusLine
            loading={isLoading}
            hasGithubToken={status?.hasGithubToken ?? false}
            hasAnthropicKey={status?.hasAnthropicKey ?? false}
            lastEnvUpdatedAt={status?.lastEnvUpdatedAt ?? null}
          />
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasAnyInput || setEnv.isPending}
            className="text-[12px]"
          >
            {setEnv.isPending ? (
              <>
                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                Aplicando...
              </>
            ) : (
              "Salvar credenciais"
            )}
          </Button>
        </div>
      </div>
    </section>
  );
}

interface SecretFieldProps {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  show: boolean;
  onChange: (v: string) => void;
  onToggleShow: () => void;
}

function SecretField({
  id,
  label,
  placeholder,
  value,
  show,
  onChange,
  onToggleShow,
}: SecretFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-[12px]">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className="pr-9 text-[13px] font-mono"
        />
        <button
          type="button"
          onClick={onToggleShow}
          tabIndex={-1}
          aria-label={show ? "Ocultar valor" : "Mostrar valor"}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          {show ? (
            <EyeOff className="h-3.5 w-3.5" />
          ) : (
            <Eye className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}

interface StatusLineProps {
  loading: boolean;
  hasGithubToken: boolean;
  hasAnthropicKey: boolean;
  lastEnvUpdatedAt: string | null;
}

function StatusLine({
  loading,
  hasGithubToken,
  hasAnthropicKey,
  lastEnvUpdatedAt,
}: StatusLineProps) {
  if (loading) {
    return (
      <span className="text-[11px] text-muted-foreground/70">Carregando…</span>
    );
  }
  if (!hasGithubToken && !hasAnthropicKey) {
    return (
      <span className="text-[11px] text-muted-foreground/70">
        Nenhuma credencial configurada.
      </span>
    );
  }
  const when = lastEnvUpdatedAt
    ? new Date(lastEnvUpdatedAt).toLocaleString("pt-BR")
    : null;
  return (
    <span className="text-[11px] text-emerald-300/90 flex items-center gap-1">
      <ShieldCheck className="h-3 w-3" />
      {when ? `Configurado em ${when}` : "Configurado"}
    </span>
  );
}
