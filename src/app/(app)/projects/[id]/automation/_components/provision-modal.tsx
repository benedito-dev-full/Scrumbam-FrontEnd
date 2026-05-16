"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Copy,
  Loader2,
  XCircle,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { cn } from "@/lib/utils";
import { automationApi, type ProvisionResult } from "@/lib/api/automation";
import { deployKeyApi, type DeployKey } from "@/lib/api/deploy-key";
import { projectsApi } from "@/lib/api/projects";
import { useLinkAgent } from "@/lib/hooks/use-automation";
import { useAgents } from "@/lib/hooks/use-agents";
import { QUERY_KEYS } from "@/lib/constants";

// =====================================================================
// Types
// =====================================================================

type ModalStep = 1 | 2;

type Step2Phase =
  | "idle"
  | "saving-url"
  | "loading-key"
  | "generating-key"
  | "key-ready"
  | "provisioning"
  | "success"
  | "error";

interface ProvisionModalProps {
  projectId: string;
  open: boolean;
  onClose: () => void;
  initialStep?: 1 | 2;
  initialAgentId?: string;
  initialRepoUrl?: string;
}

// =====================================================================
// Helpers
// =====================================================================

function mapProvisionError(err: unknown): string {
  const status = (err as { response?: { status?: number } })?.response?.status;
  const msg = (
    err as { response?: { data?: { message?: string } } }
  )?.response?.data?.message;
  switch (status) {
    case 400:
      if (msg?.includes("repoUrl"))
        return "Configure a URL do repositório antes de clonar.";
      if (msg?.includes("allowlist"))
        return "URL inválida. Use github.com, gitlab.com ou bitbucket.org.";
      if (msg?.includes("deployKeyPub"))
        return "Gere a deploy key antes de clonar um repositório privado.";
      return msg ?? "Dados inválidos.";
    case 403:
      return "Você precisa ser MANAGER ou ADMIN do projeto para provisionar.";
    case 409:
      return "Slug do projeto inválido. Renomeie o projeto e tente novamente.";
    case 503:
      return "A VPS está offline. Aguarde o agente reconectar e tente novamente.";
    case 504:
      return "Timeout: o clone demorou mais de 60 segundos. Verifique a URL e as credenciais.";
    default:
      return msg ?? "Erro ao clonar o repositório. Tente novamente.";
  }
}

// =====================================================================
// StepIndicator
// =====================================================================

function StepIndicator({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
        <React.Fragment key={n}>
          <span
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-medium",
              n === current
                ? "bg-primary text-primary-foreground"
                : n < current
                  ? "bg-primary/30 text-primary"
                  : "bg-muted text-muted-foreground",
            )}
          >
            {n < current ? <Check className="h-3 w-3" /> : n}
          </span>
          {n < total && (
            <div
              className={cn(
                "h-px w-4 bg-border",
                n < current && "bg-primary/30",
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// =====================================================================
// Main component
// =====================================================================

export function ProvisionModal({
  projectId,
  open,
  onClose,
  initialStep = 1,
  initialAgentId,
  initialRepoUrl = "",
}: ProvisionModalProps) {
  const qc = useQueryClient();
  const { data: agents, isLoading: loadingAgents } = useAgents();
  const linkMutation = useLinkAgent(projectId);

  // Step 1 state
  const [step, setStep] = useState<ModalStep>(initialStep);
  const [selectedAgentId, setSelectedAgentId] = useState(
    initialAgentId ?? "",
  );
  const [branch, setBranch] = useState("main");

  // Step 2 state
  const [phase, setPhase] = useState<Step2Phase>("idle");
  const [repoUrl, setRepoUrl] = useState(initialRepoUrl);
  const [isPublic, setIsPublic] = useState(false);
  const [deployKey, setDeployKey] = useState<DeployKey | null>(null);
  const [result, setResult] = useState<ProvisionResult | null>(null);
  const [error, setError] = useState<string>("");

  // Derived
  const agentId = step === 1 ? selectedAgentId : (initialAgentId ?? selectedAgentId);

  // ---------------------------------------------------------------
  // Reset on close
  // ---------------------------------------------------------------

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        // Reset all state
        setStep(initialStep);
        setSelectedAgentId(initialAgentId ?? "");
        setBranch("main");
        setPhase("idle");
        setRepoUrl(initialRepoUrl);
        setIsPublic(false);
        setDeployKey(null);
        setResult(null);
        setError("");
        onClose();
      }
    },
    [initialStep, initialAgentId, initialRepoUrl, onClose],
  );

  // ---------------------------------------------------------------
  // Step 1: Link agent
  // ---------------------------------------------------------------

  const handleStep1Submit = () => {
    if (!selectedAgentId) return;
    linkMutation.mutate(
      { idAgent: selectedAgentId, remoteBranch: branch },
      {
        onSuccess: () => {
          setStep(2);
        },
      },
    );
  };

  // ---------------------------------------------------------------
  // Step 2: Provision flow (imperative, granular state control)
  // ---------------------------------------------------------------

  const handleProvision = useCallback(async () => {
    const activeAgentId = agentId;
    if (!activeAgentId) return;

    // 1. Save repoUrl via PATCH
    setPhase("saving-url");
    try {
      await projectsApi.update(projectId, { repoUrl });
    } catch {
      setPhase("error");
      setError("Erro ao salvar URL do repositório.");
      return;
    }

    // 2. SSH path: ensure deploy key
    if (!isPublic) {
      setPhase("loading-key");
      let key = deployKey;
      if (!key) {
        try {
          key = await deployKeyApi.get(projectId, activeAgentId);
          setDeployKey(key);
          setPhase("key-ready");
          return; // pause — user needs to add key on GitHub
        } catch (err) {
          const status = (err as { response?: { status?: number } })?.response
            ?.status;
          if (status === 404) {
            setPhase("generating-key");
            try {
              key = await deployKeyApi.generate(projectId, activeAgentId);
              setDeployKey(key);
              setPhase("key-ready");
              return; // pause
            } catch {
              setPhase("error");
              setError("Erro ao gerar deploy key na VPS.");
              return;
            }
          }
          setPhase("error");
          setError("Erro ao verificar deploy key.");
          return;
        }
      }
      // key already exists and user clicked "Adicionei" — continue below
    }

    // 3. Provision (clone)
    setPhase("provisioning");
    try {
      const provisionResult = await automationApi.provision(
        projectId,
        activeAgentId,
        { useSshKey: !isPublic },
      );
      setResult(provisionResult);
      setPhase("success");
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.deployKey(projectId, activeAgentId),
      });
      qc.invalidateQueries({
        queryKey: ["automation", "agent-link", projectId],
      });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.project(projectId) });
    } catch (err) {
      setPhase("error");
      setError(mapProvisionError(err));
    }
  }, [agentId, projectId, repoUrl, isPublic, deployKey, qc]);

  // Copy to clipboard helper
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {
      /* ignore */
    });
  };

  // ---------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------

  const renderStep1 = () => (
    <>
      <div className="space-y-4 py-2">
        {/* Agent selector */}
        <div className="space-y-1.5">
          <Label htmlFor="provision-agent" className="text-[12px]">
            VPS
          </Label>
          <Select
            value={selectedAgentId}
            onValueChange={setSelectedAgentId}
            disabled={loadingAgents || linkMutation.isPending}
          >
            <SelectTrigger id="provision-agent" className="text-[13px]">
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

        {/* Branch */}
        <div className="space-y-1.5">
          <Label htmlFor="provision-branch" className="text-[12px]">
            Branch padrão
          </Label>
          <Input
            id="provision-branch"
            type="text"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            placeholder="main"
            className="text-[13px] font-mono"
            disabled={linkMutation.isPending}
          />
        </div>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          size="sm"
          className="text-[12px]"
          onClick={() => handleOpenChange(false)}
          disabled={linkMutation.isPending}
        >
          Cancelar
        </Button>
        <Button
          size="sm"
          className="text-[12px]"
          onClick={handleStep1Submit}
          disabled={!selectedAgentId || linkMutation.isPending}
        >
          {linkMutation.isPending ? (
            <>
              <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
              Vinculando...
            </>
          ) : (
            "Próximo"
          )}
        </Button>
      </DialogFooter>
    </>
  );

  const renderStep2 = () => {
    // --- Spinner phases ---
    if (
      phase === "saving-url" ||
      phase === "loading-key" ||
      phase === "generating-key" ||
      phase === "provisioning"
    ) {
      const messages: Record<string, string> = {
        "saving-url": "Salvando URL do repositório...",
        "loading-key": "Verificando deploy key na VPS...",
        "generating-key": "Gerando deploy key SSH na VPS...",
        provisioning:
          "Clonando repositório na VPS... (pode levar até 60 segundos)",
      };
      return (
        <div className="py-8 flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-[13px] text-muted-foreground">
            {messages[phase]}
          </p>
        </div>
      );
    }

    // --- Key ready: pause for user to add on GitHub ---
    if (phase === "key-ready" && deployKey) {
      return (
        <>
          <div className="space-y-4 py-2">
            <p className="text-[12px] text-muted-foreground leading-relaxed">
              Adicione a deploy key abaixo no GitHub/GitLab para que a VPS
              possa clonar o repositório via SSH.
            </p>

            {/* Public key display */}
            <div className="space-y-1.5">
              <Label className="text-[12px]">Deploy key (pública)</Label>
              <div className="relative">
                <textarea
                  readOnly
                  value={deployKey.publicKey}
                  rows={4}
                  className="w-full rounded-md border border-border bg-muted/40 px-3 py-2 text-[11px] font-mono resize-none focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(deployKey.publicKey)}
                  className="absolute top-2 right-2 p-1 rounded hover:bg-muted transition-colors"
                  title="Copiar"
                >
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
              {deployKey.fingerprint && (
                <p className="text-[10px] text-muted-foreground font-mono">
                  Fingerprint: {deployKey.fingerprint}
                </p>
              )}
            </div>

            {/* Instructions */}
            {deployKey.instructions.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-[12px]">Instruções</Label>
                <ol className="list-decimal ml-4 space-y-1">
                  {deployKey.instructions.map((instruction, i) => (
                    <li
                      key={i}
                      className="text-[12px] text-muted-foreground leading-relaxed"
                    >
                      {instruction}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              className="text-[12px]"
              onClick={() => handleOpenChange(false)}
            >
              Fechar
            </Button>
            <Button
              size="sm"
              className="text-[12px]"
              onClick={() => handleProvision()}
            >
              Adicionei a deploy key
            </Button>
          </DialogFooter>
        </>
      );
    }

    // --- Success ---
    if (phase === "success" && result) {
      return (
        <>
          <div className="py-6 flex flex-col items-center gap-4 text-center">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
            <div className="space-y-1">
              <p className="text-[14px] font-medium">
                Repositório clonado com sucesso!
              </p>
              <p className="text-[12px] text-muted-foreground font-mono">
                {result.projectPath}
              </p>
            </div>
            <div className="flex gap-4 text-[12px] text-muted-foreground">
              <span>
                Branch:{" "}
                <span className="font-mono text-foreground">
                  {result.currentBranch}
                </span>
              </span>
              <span>
                Commit:{" "}
                <span className="font-mono text-foreground">
                  {result.headCommitSha.slice(0, 7)}
                </span>
              </span>
            </div>
            {result.alreadyExisted && (
              <p className="text-[11px] text-amber-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Repositório já existia — foi atualizado.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              size="sm"
              className="text-[12px]"
              onClick={() => handleOpenChange(false)}
            >
              Concluir
            </Button>
          </DialogFooter>
        </>
      );
    }

    // --- Error ---
    if (phase === "error") {
      return (
        <>
          <div className="py-6 flex flex-col items-center gap-4 text-center">
            <XCircle className="h-10 w-10 text-destructive" />
            <div className="space-y-1">
              <p className="text-[14px] font-medium">Erro no provisionamento</p>
              <p className="text-[12px] text-muted-foreground max-w-xs">
                {error}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              className="text-[12px]"
              onClick={() => handleOpenChange(false)}
            >
              Fechar
            </Button>
            <Button
              size="sm"
              className="text-[12px]"
              onClick={() => {
                setPhase("idle");
                setError("");
                setDeployKey(null);
              }}
            >
              Tentar novamente
            </Button>
          </DialogFooter>
        </>
      );
    }

    // --- Idle: main form ---
    return (
      <>
        <div className="space-y-4 py-2">
          {/* Repo URL */}
          <div className="space-y-1.5">
            <Label htmlFor="provision-repo-url" className="text-[12px]">
              URL do repositório
            </Label>
            <Input
              id="provision-repo-url"
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="git@github.com:org/repo.git"
              className="text-[13px] font-mono"
              autoComplete="off"
              spellCheck={false}
            />
            <p className="text-[11px] text-muted-foreground">
              Use SSH (git@...) para repositórios privados ou HTTPS para
              repositórios públicos.
            </p>
          </div>

          {/* Public repo checkbox */}
          <div className="flex items-center gap-2">
            <input
              id="provision-is-public"
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
            />
            <Label
              htmlFor="provision-is-public"
              className="text-[12px] cursor-pointer"
            >
              Repositório público (sem deploy key SSH)
            </Label>
          </div>

          {!isPublic && (
            <div className="rounded-sm border border-border/60 bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground leading-relaxed">
              Uma deploy key SSH será gerada na VPS e precisará ser adicionada
              ao seu repositório no GitHub/GitLab antes do clone.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="text-[12px]"
            onClick={() => handleOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            className="text-[12px]"
            onClick={() => handleProvision()}
            disabled={!repoUrl.trim()}
          >
            {isPublic ? "Clonar" : "Continuar"}
          </Button>
        </DialogFooter>
      </>
    );
  };

  // ---------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------

  const titleByStep: Record<ModalStep, string> = {
    1: "Vincular VPS ao projeto",
    2: "Configurar repositório",
  };

  const descriptionByStep: Record<ModalStep, string> = {
    1: "Selecione a VPS que executará comandos de automação neste projeto.",
    2: "Informe o repositório Git para clonar na VPS.",
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-[15px]">
              {titleByStep[step]}
            </DialogTitle>
            <StepIndicator current={step} total={2} />
          </div>
          <DialogDescription className="text-[12px]">
            {descriptionByStep[step]}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? renderStep1() : renderStep2()}
      </DialogContent>
    </Dialog>
  );
}
