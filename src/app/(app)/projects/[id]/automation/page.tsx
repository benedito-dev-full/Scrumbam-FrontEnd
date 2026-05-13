"use client";

import { use } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Cpu } from "lucide-react";

import { PageTransition } from "@/components/common/page-transition";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { useProject } from "@/lib/hooks/use-projects";
import { useAuthStore } from "@/lib/stores/auth-store";
import { AgentLinkForm } from "./_components/agent-link-form";
import { AgentStatusCard } from "./_components/agent-status-card";
import { DeployKeyPanel } from "./_components/deploy-key-panel";
import { ProjectSlugCard } from "./_components/project-slug-card";
import { ExecutionHistory } from "./_components/execution-history";
import { ApprovalQueuePanel } from "./_components/approval-queue-panel";
import { ExecuteIntentionPanel } from "./_components/execute-intention-panel";

interface AutomationPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Pagina /projects/[id]/automation — gestao de automacao do projeto.
 *
 * Componentes (refatoração Fase 6 — plan-2026-05-13):
 * 1. AgentStatusCard — status do agente vinculado + botão "Testar conexão"
 * 2. AgentLinkForm — vincular/atualizar/desvincular agente do projeto
 *    (sem `remotePath`/gitBot — moveram para `/vps/:id`)
 * 3. ProjectSlugCard — slug auto-derivado + snippet pro CLAUDE.md da VPS
 * 4. DeployKeyPanel — gera/lista/revoga deploy key SSH per-projeto
 * 5. ApprovalQueuePanel + ExecuteIntentionPanel + ExecutionHistory
 *
 * Acesso:
 * - Visivel para todos os roles (MEMBER/VIEWER veem readonly via guards backend).
 * - Acoes destrutivas (vincular, gerar key, revogar) sao ADMIN-only no backend.
 *   O frontend nao bloqueia a UI; usuarios sem permissao recebem 403 nas
 *   mutations e o toast de erro do hook explica.
 *
 * Mobile-first: layout 1 coluna abaixo de sm; 2 colunas em md+.
 */
export default function AutomationPage({ params }: AutomationPageProps) {
  const { id } = use(params);
  const { data: project, isLoading: loadingProject } = useProject(id);
  const userRole = useAuthStore((s) => s.user?.role);
  const isAdmin = userRole === "admin" || userRole === "ADMIN";

  usePageTitle(project ? `Automacao - ${project.nome}` : "Automacao");

  return (
    <PageTransition className="h-full">
      <div className="flex h-full flex-col">
        {/* Top breadcrumb */}
        <header className="flex h-11 shrink-0 items-center px-4 sm:px-6 md:px-8 border-b border-border">
          <nav className="flex items-center gap-1.5 text-[13px] min-w-0">
            <Link
              href="/projects"
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Projects
            </Link>
            <ChevronRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
            <Link
              href={`/projects/${id}`}
              className="text-muted-foreground hover:text-foreground transition-colors truncate"
            >
              {loadingProject ? "..." : (project?.nome ?? id)}
            </Link>
            <ChevronRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
            <Cpu className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="font-medium">Automacao</span>
          </nav>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-auto">
          <div className="px-4 sm:px-6 md:px-8 py-6">
            <div className="mx-auto max-w-4xl space-y-6">
              {/* Title */}
              <div className="space-y-1">
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
                  Automacao do projeto
                </h1>
                <p className="text-[13px] text-muted-foreground">
                  Conecte uma VPS remota a este projeto para executar comandos
                  Git/Claude Code via tunel SSH reverso. Veja{" "}
                  <Link
                    href="/vps"
                    className="text-foreground underline underline-offset-2 hover:text-primary"
                  >
                    /vps
                  </Link>{" "}
                  para cadastrar VPSs na sua organizacao.
                </p>
                {!isAdmin && (
                  <p className="text-[12px] text-amber-600 dark:text-amber-400 mt-2">
                    Voce nao e admin desta organizacao. Acoes de configuracao
                    (vincular, gerar key, revogar) ficarao bloqueadas pelo
                    servidor.
                  </p>
                )}
              </div>

              {/* 1. Status do agente */}
              <AgentStatusCard projectId={id} />

              {/* 2. Vínculo agente↔projeto */}
              <AgentLinkForm projectId={id} />

              {/* 3. Project slug + snippet pro CLAUDE.md da VPS */}
              <ProjectSlugCard projectId={id} />

              {/* 4. Deploy key SSH per-projeto-VPS (substitui o antigo
                  GitCredentialsPanel; credenciais env e bot Git agora vivem
                  em /vps/:id) */}
              <DeployKeyPanel projectId={id} />

              {/* 5. Aprovações pendentes — só renderiza se houver */}
              <ApprovalQueuePanel projectId={id} />

              {/* 6. Disparar execução */}
              <ExecuteIntentionPanel projectId={id} />

              {/* 7. Histórico de execuções */}
              <ExecutionHistory projectId={id} />
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
