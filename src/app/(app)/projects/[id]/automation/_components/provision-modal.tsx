"use client";

import React, { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Copy,
  Loader2,
  XCircle,
  CheckCircle2,
  AlertCircle,
  GitBranch,
  Rocket,
  Lock,
  Globe,
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

type RepoType = "ssh" | "https" | "unknown";

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

function detectRepoType(url: string): RepoType {
  const trimmed = url.trim();
  if (trimmed.startsWith("git@")) return "ssh";
  if (trimmed.startsWith("https://")) return "https";
  return "unknown";
}

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
// StepIndicator — linha que preenche ao avançar
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
              "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-medium transition-all duration-300",
              n === current
                ? "bg-primary text-primary-foreground scale-110"
                : n < current
                  ? "bg-primary/40 text-primary"
                  : "bg-muted text-muted-foreground",
            )}
          >
            {n < current ? (
              <Check className="h-3 w-3 animate-in zoom-in duration-200" />
            ) : (
              n
            )}
          </span>
          {n < total && (
            <div className="relative h-px w-6 bg-border overflow-hidden">
              <div
                className={cn(
                  "absolute inset-y-0 left-0 bg-primary transition-all duration-500",
                  n < current ? "w-full" : "w-0",
                )}
              />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// =====================================================================
// PhaseSpinner — spinner com texto rotativo
// =====================================================================

function PhaseSpinner({ phase }: { phase: Step2Phase }) {
  const messages: Partial<Record<Step2Phase, string[]>> = {
    "saving-url": ["Salvando URL...", "Persistindo configuração..."],
    "loading-key": ["Verificando deploy key...", "Consultando agente..."],
    "generating-key": [
      "Gerando chave SSH...",
      "Criando par ed25519...",
      "Quase lá...",
    ],
    provisioning: [
      "Conectando à VPS...",
      "Clonando repositório...",
      "Pode levar até 60 segundos...",
      "Aguarde...",
    ],
  };

  const [msgIndex, setMsgIndex] = useState(0);
  const list = messages[phase] ?? ["Processando..."];

  useEffect(() => {
    setMsgIndex(0);
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % list.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [phase, list.length]);

  return (
    <div className="py-10 flex flex-col items-center gap-4 text-center">
      <div className="relative">
        <Loader2 className="h-9 w-9 animate-spin text-primary" />
        <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
      </div>
      <p
        key={msgIndex}
        className="text-[13px] text-muted-foreground animate-in fade-in slide-in-from-bottom-1 duration-300"
      >
        {list[msgIndex]}
      </p>
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
  const [copied, setCopied] = useState(false);

  // Derived
  const agentId =
    step === 1 ? selectedAgentId : (initialAgentId ?? selectedAgentId);
  const repoType = detectRepoType(repoUrl);

  // Auto-detect public/private from URL
  useEffect(() => {
    if (repoType === "ssh") setIsPublic(false);
    if (repoType === "https") setIsPublic(true);
  }, [repoType]);

  // ---------------------------------------------------------------
  // Reset on close
  // ---------------------------------------------------------------

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        setStep(initialStep);
        setSelectedAgentId(initialAgentId ?? "");
        setBranch("main");
        setPhase("idle");
        setRepoUrl(initialRepoUrl);
        setIsPublic(false);
        setDeployKey(null);
        setResult(null);
        setError("");
        setCopied(false);
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
      { onSuccess: () => setStep(2) },
    );
  };

  // ---------------------------------------------------------------
  // Step 2: Provision flow
  // ---------------------------------------------------------------

  const handleProvision = useCallback(async () => {
    const activeAgentId = agentId;
    if (!activeAgentId) return;

    const useSshKey = repoType === "ssh" || !isPublic;

    // 1. Save repoUrl
    setPhase("saving-url");
    try {
      await projectsApi.update(projectId, { repoUrl });
    } catch {
      setPhase("error");
      setError("Erro ao salvar URL do repositório.");
      return;
    }

    // 2. SSH path: ensure deploy key
    if (useSshKey) {
      setPhase("loading-key");
      let key = deployKey;
      if (!key) {
        try {
          key = await deployKeyApi.get(projectId, activeAgentId);
          setDeployKey(key);
          setPhase("key-ready");
          return;
        } catch (err) {
          const status = (err as { response?: { status?: number } })?.response
            ?.status;
          if (status === 404) {
            setPhase("generating-key");
            try {
              key = await deployKeyApi.generate(projectId, activeAgentId);
              setDeployKey(key);
              setPhase("key-ready");
              return;
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
    }

    // 3. Provision
    setPhase("provisioning");
    try {
      const provisionResult = await automationApi.provision(
        projectId,
        activeAgentId,
        { useSshKey },
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
  }, [agentId, projectId, repoUrl, repoType, isPublic, deployKey, qc]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ---------------------------------------------------------------
  // URL validation warning (Proposta 1)
  // ---------------------------------------------------------------

  const renderUrlWarning = () => {
    if (!repoUrl.trim()) return null;

    // HTTPS + sem checkbox público = repo privado via HTTPS → bloquear
    if (repoType === "https" && !isPublic) {
      return (
        <div className="flex items-start gap-2 rounded-sm border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-600 leading-relaxed animate-in fade-in duration-200">
          <Lock className="h-3 w-3 mt-0.5 shrink-0" />
          <span>
            Repositórios privados requerem autenticação. Use a URL SSH{" "}
            <code className="text-[10px]">git@github.com:org/repo.git</code>{" "}
            — o agente usará a deploy key para clonar e fazer push com
            segurança.
          </span>
        </div>
      );
    }

    // HTTPS + público = ok
    if (repoType === "https" && isPublic) {
      return (
        <div className="flex items-center gap-2 rounded-sm border border-green-500/30 bg-green-500/10 px-3 py-2 text-[11px] text-green-600 animate-in fade-in duration-200">
          <Globe className="h-3 w-3 shrink-0" />
          <span>Repositório público via HTTPS — nenhuma chave necessária.</span>
        </div>
      );
    }

    // SSH = deploy key
    if (repoType === "ssh") {
      return (
        <div className="flex items-center gap-2 rounded-sm border border-primary/30 bg-primary/5 px-3 py-2 text-[11px] text-primary animate-in fade-in duration-200">
          <Lock className="h-3 w-3 shrink-0" />
          <span>
            Repositório SSH — uma deploy key será gerada e usada pelo agente.
          </span>
        </div>
      );
    }

    return null;
  };

  // ---------------------------------------------------------------
  // Render Step 1
  // ---------------------------------------------------------------

  const renderStep1 = () => (
    <div className="animate-in fade-in slide-in-from-right-2 duration-200">
      <div className="space-y-4 py-2">
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
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        a.status === "online"
                          ? "bg-green-500"
                          : "bg-muted-foreground",
                      )}
                    />
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
    </div>
  );

  // ---------------------------------------------------------------
  // Render Step 2
  // ---------------------------------------------------------------

  const renderStep2 = () => {
    // Spinner phases
    if (
      phase === "saving-url" ||
      phase === "loading-key" ||
      phase === "generating-key" ||
      phase === "provisioning"
    ) {
      return <PhaseSpinner phase={phase} />;
    }

    // Key ready
    if (phase === "key-ready" && deployKey) {
      return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="space-y-4 py-2">
            <p className="text-[12px] text-muted-foreground leading-relaxed">
              Adicione a deploy key abaixo no GitHub/GitLab para que a VPS
              possa clonar o repositório via SSH.
            </p>

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
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-500 animate-in zoom-in duration-150" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </button>
              </div>
              {deployKey.fingerprint && (
                <p className="text-[10px] text-muted-foreground font-mono">
                  Fingerprint: {deployKey.fingerprint}
                </p>
              )}
            </div>

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
        </div>
      );
    }

    // Success
    if (phase === "success" && result) {
      return (
        <div className="animate-in fade-in zoom-in-95 duration-300">
          <div className="py-6 flex flex-col items-center gap-4 text-center">
            <div className="relative">
              <CheckCircle2 className="h-12 w-12 text-green-500 animate-in zoom-in duration-300" />
              <Rocket className="absolute -top-1 -right-1 h-4 w-4 text-primary animate-in slide-in-from-bottom-2 duration-500 delay-200" />
            </div>
            <div className="space-y-1">
              <p className="text-[14px] font-medium">
                Repositório clonado com sucesso!
              </p>
              <p className="text-[12px] text-muted-foreground font-mono">
                {result.projectPath}
              </p>
            </div>
            <div className="flex gap-4 text-[12px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <GitBranch className="h-3 w-3" />
                <span className="font-mono text-foreground">
                  {result.currentBranch}
                </span>
              </span>
              <span>
                commit{" "}
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
        </div>
      );
    }

    // Error
    if (phase === "error") {
      return (
        <div className="animate-in fade-in duration-200">
          <div className="py-6 flex flex-col items-center gap-4 text-center">
            <XCircle className="h-10 w-10 text-destructive animate-in zoom-in duration-200" />
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
        </div>
      );
    }

    // Idle — main form
    const isHttpsPrivate = repoType === "https" && !isPublic;
    const canSubmit = repoUrl.trim() && !isHttpsPrivate;

    return (
      <div className="animate-in fade-in slide-in-from-left-2 duration-200">
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
          </div>

          {/* URL warning / info (Proposta 1) */}
          {renderUrlWarning()}

          {/* Checkbox público — só mostra se URL não for SSH */}
          {repoType !== "ssh" && (
            <div className="flex items-center gap-2 animate-in fade-in duration-200">
              <input
                id="provision-is-public"
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                disabled={repoType === "https"}
              />
              <Label
                htmlFor="provision-is-public"
                className="text-[12px] cursor-pointer"
              >
                Repositório público (sem deploy key SSH)
              </Label>
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
            disabled={!canSubmit}
            title={
              isHttpsPrivate
                ? "Use URL SSH para repositórios privados"
                : undefined
            }
          >
            {repoType === "ssh" ? "Continuar" : "Clonar"}
          </Button>
        </DialogFooter>
      </div>
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
