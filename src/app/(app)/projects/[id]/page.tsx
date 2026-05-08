"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  Star,
  MoreHorizontal,
  Link2,
  Bell,
  ChevronRight,
  CircleDashed,
  CheckCircle2,
  Calendar,
  PenSquare,
  Cpu,
  Clock,
} from "lucide-react";

import { PageTransition } from "@/components/common/page-transition";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { useProject } from "@/lib/hooks/use-projects";
import { useIntentions } from "@/lib/hooks/use-intentions";
import { ProjectInsights } from "@/components/projects/project-insights";
import { ProjectReports } from "@/components/projects/project-reports";
import { NewIssueModal } from "@/components/intentions/new-issue-modal";
import { cn } from "@/lib/utils";
import type {
  IntentionDocument,
  IntentionPriority,
  IntentionStatus,
} from "@/types/intention";

// ============================================================
// Helpers de ícone colorido (mesma lógica dos cards de projeto)
// ============================================================

const ICON_COLORS = [
  "bg-blue-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
];

function projectColorClass(nome?: string | null): string {
  const idx = (nome?.charCodeAt(0) ?? 0) % ICON_COLORS.length;
  return ICON_COLORS[idx];
}

function ProjectIcon({
  nome,
  size = "sm",
}: {
  nome?: string | null;
  size?: "sm" | "lg";
}) {
  const color = projectColorClass(nome);
  const initial = nome?.[0]?.toUpperCase() ?? "P";
  if (size === "lg") {
    return (
      <span
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-md text-[18px] font-bold text-white shrink-0",
          color,
        )}
      >
        {initial}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-white shrink-0",
        color,
      )}
    >
      {initial}
    </span>
  );
}

// ============================================================
// Tabs
// ============================================================

type TabKey = "overview" | "activity" | "issues" | "insights" | "reports";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Visao geral" },
  { key: "activity", label: "Atividade" },
  { key: "issues", label: "Issues" },
  { key: "insights", label: "Metricas" },
  { key: "reports", label: "Relatorios" },
];

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectDetailPage({ params }: ProjectPageProps) {
  const { id: projectId } = use(params);
  const { data: project, isLoading } = useProject(projectId);
  const { data: intentions } = useIntentions({ projectSlug: projectId });

  usePageTitle(project?.nome ?? "Project");

  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [favorited, setFavorited] = useState(false);
  const [newIssueOpen, setNewIssueOpen] = useState(false);

  const issuesList = (intentions ?? []) as IntentionDocument[];

  return (
    <PageTransition className="h-full">
      <div className="flex h-full flex-col">
        {/* Top breadcrumb bar */}
        <header className="flex h-11 shrink-0 items-center justify-between px-8 border-b border-border">
          <nav className="flex items-center gap-1.5 text-[13px] min-w-0">
            <Link
              href="/projects"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Projects
            </Link>
            <ChevronRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
            <ProjectIcon nome={project?.nome} />
            <span className="font-medium truncate">
              {project?.nome ?? "..."}
            </span>
            <button
              type="button"
              onClick={() => setFavorited((v) => !v)}
              className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors ml-1"
              title="Favoritar (gap #15)"
            >
              <Star
                className={cn(
                  "h-3.5 w-3.5",
                  favorited && "fill-amber-400 text-amber-400",
                )}
              />
            </button>
            <button
              type="button"
              className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Mais opcoes"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </nav>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setNewIssueOpen(true)}
              className="flex items-center gap-1.5 rounded-md bg-foreground/10 px-2 py-1 text-[12px] font-medium text-foreground hover:bg-foreground/15 transition-colors"
              aria-label="Nova issue"
              title="Nova issue neste projeto"
            >
              <PenSquare className="h-3.5 w-3.5" />
              Nova issue
            </button>
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              aria-label="Copiar link"
            >
              <Link2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              aria-label="Notificacoes do projeto"
            >
              <Bell className="h-3.5 w-3.5" />
            </button>
            <Link
              href={`/projects/${projectId}/automation`}
              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              aria-label="Automacao do projeto"
              title="Automacao"
            >
              <Cpu className="h-3.5 w-3.5" />
            </Link>
          </div>
        </header>

        {/* Tabs row */}
        <div className="flex h-10 shrink-0 items-center justify-between border-b border-border px-8">
          <div className="flex items-center gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "rounded-md px-2 py-1 text-[12px] font-medium transition-colors",
                  activeTab === tab.key
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content + side panel */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Main content */}
          <div className="flex-1 overflow-auto">
            {activeTab === "overview" && (
              <OverviewTab
                projectId={projectId}
                project={project}
                isLoading={isLoading}
                issues={issuesList}
              />
            )}
            {activeTab === "activity" && <ActivityTab />}
            {activeTab === "issues" && <IssuesTab issues={issuesList} />}
            {activeTab === "insights" && (
              <ProjectInsights projectId={projectId} />
            )}
            {activeTab === "reports" && (
              <ProjectReports projectId={projectId} />
            )}
          </div>

          {/* Right side panel (Properties) */}
          <aside className="hidden lg:flex w-[280px] shrink-0 flex-col border-l border-border overflow-auto">
            <PropertiesPanel project={project} />
            <ActivityPanel projectName={project?.nome} />
          </aside>
        </div>
      </div>

      {/* New issue modal — projeto pre-selecionado */}
      <NewIssueModal
        open={newIssueOpen}
        onOpenChange={setNewIssueOpen}
        defaultProjectId={projectId}
      />
    </PageTransition>
  );
}

// ============================================================
// Overview tab
// ============================================================

function OverviewTab({
  projectId,
  project,
  isLoading,
  issues,
}: {
  projectId: string;
  project:
    | {
        nome: string;
        descricao?: string | null;
        dataInicio?: string | null;
        dataFim?: string | null;
      }
    | undefined;
  isLoading: boolean;
  issues: IntentionDocument[];
}) {
  return (
    <div className="px-8 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Project header */}
        <div className="space-y-3">
          <ProjectIcon nome={project?.nome} size="lg" />
          <h1 className="text-3xl font-semibold tracking-tight">
            {isLoading ? "..." : (project?.nome ?? "Projeto")}
          </h1>
          {project?.descricao && (
            <p className="text-[13px] text-muted-foreground">
              {project.descricao}
            </p>
          )}
        </div>

        {/* Inline properties strip — apenas dados reais */}
        <PropertiesStrip project={project} />

        {/* Intenções vinculadas */}
        {issues.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-[13px] font-medium text-muted-foreground">
              Intenções recentes
            </h2>
            <div className="space-y-2">
              {issues.slice(0, 5).map((i) => (
                <Link
                  key={i.id}
                  href={`/projects/${projectId}/issues/${i.id}`}
                  className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-[12px] hover:bg-accent/40 transition-colors w-fit"
                >
                  <StatusIcon status={i.status} />
                  <span className="text-muted-foreground tabular-nums">
                    INT-{i.id}
                  </span>
                  <span className="truncate">{i.title}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function PropertiesStrip({
  project,
}: {
  project?:
    | {
        dataInicio?: string | null;
        dataFim?: string | null;
      }
    | null
    | undefined;
}) {
  const hasDataFim = !!project?.dataFim;
  const hasDataInicio = !!project?.dataInicio;

  if (!hasDataFim && !hasDataInicio) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 text-[12px]">
      <span className="text-muted-foreground mr-1">Propriedades</span>
      {(hasDataInicio || hasDataFim) && (
        <span className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-foreground">
          <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          {hasDataInicio && (
            <span>
              {new Date(project!.dataInicio!).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
              })}
            </span>
          )}
          {hasDataInicio && hasDataFim && (
            <span className="text-muted-foreground">→</span>
          )}
          {hasDataFim && (
            <span>
              {new Date(project!.dataFim!).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
              })}
            </span>
          )}
        </span>
      )}
    </div>
  );
}

// ============================================================
// Activity tab
// ============================================================

function ActivityTab() {
  return (
    <div className="px-8 py-16 flex flex-col items-center justify-center text-center">
      <Clock className="h-8 w-8 text-muted-foreground/30 mb-3" />
      <p className="text-[13px] font-medium text-muted-foreground">
        Nenhuma atividade ainda
      </p>
      <p className="text-[12px] text-muted-foreground/60 mt-1">
        As atualizações do projeto aparecerão aqui.
      </p>
    </div>
  );
}

// ============================================================
// Issues tab — reusa visual da /intentions
// ============================================================

function IssuesTab({ issues }: { issues: IntentionDocument[] }) {
  if (issues.length === 0) {
    return (
      <div className="px-8 py-12 text-center">
        <CircleDashed className="mx-auto h-10 w-10 text-muted-foreground/30" />
        <p className="mt-3 text-[13px] text-muted-foreground">
          Sem issues ainda
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-[40px_70px_28px_minmax(0,1fr)_120px] items-center gap-3 border-b border-border px-8 py-2 text-[11px] font-medium text-muted-foreground">
        <div>Pri</div>
        <div>Codigo</div>
        <div></div>
        <div>Titulo</div>
        <div>Atualizado</div>
      </div>
      {issues.map((i) => (
        <div
          key={i.id}
          className="grid grid-cols-[40px_70px_28px_minmax(0,1fr)_120px] items-center gap-3 border-b border-border/40 px-8 py-2 text-[13px] hover:bg-accent/30 transition-colors"
        >
          <PriorityIcon priority={i.priority} />
          <span className="text-[12px] text-muted-foreground tabular-nums">
            INT-{i.id}
          </span>
          <StatusIcon status={i.status} />
          <span className="truncate">{i.title}</span>
          <span className="text-[12px] text-muted-foreground">
            {formatRelative(i.updatedAt)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Right side panel
// ============================================================

function PropertiesPanel({
  project,
}: {
  project:
    | {
        nome: string;
        descricao?: string | null;
        dataInicio?: string | null;
        dataFim?: string | null;
        responsavel?: { chave: string; nome: string } | null;
      }
    | undefined;
}) {
  const hasDataInicio = !!project?.dataInicio;
  const hasDataFim = !!project?.dataFim;
  const hasDates = hasDataInicio || hasDataFim;
  const hasResponsavel = !!project?.responsavel?.nome;

  const hasAnyProp = hasDates || hasResponsavel;

  return (
    <section className="border-b border-border px-4 py-4">
      <h3 className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground mb-3">
        Propriedades
      </h3>
      {!hasAnyProp ? (
        <p className="text-[11px] text-muted-foreground/60">
          Nenhuma propriedade disponível.
        </p>
      ) : (
        <dl className="space-y-2 text-[12px]">
          {hasResponsavel && (
            <div className="flex items-center gap-2 py-0.5">
              <dt className="w-20 shrink-0 text-muted-foreground">
                Responsável
              </dt>
              <dd className="flex items-center gap-1.5 truncate text-foreground">
                <CircleDashed className="h-3 w-3 shrink-0 text-muted-foreground" />
                {project!.responsavel!.nome}
              </dd>
            </div>
          )}
          {hasDates && (
            <div className="flex items-center gap-2 py-0.5">
              <dt className="w-20 shrink-0 text-muted-foreground">Datas</dt>
              <dd className="flex items-center gap-1 text-foreground">
                <Calendar className="h-3 w-3 shrink-0 text-muted-foreground" />
                {hasDataInicio && (
                  <span>
                    {new Date(project!.dataInicio!).toLocaleDateString(
                      "pt-BR",
                      { day: "2-digit", month: "short" },
                    )}
                  </span>
                )}
                {hasDataInicio && hasDataFim && (
                  <span className="text-muted-foreground">→</span>
                )}
                {hasDataFim && (
                  <span>
                    {new Date(project!.dataFim!).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </span>
                )}
              </dd>
            </div>
          )}
        </dl>
      )}
    </section>
  );
}

function ActivityPanel({ projectName }: { projectName?: string }) {
  return (
    <section className="px-4 py-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
          Atividade
        </h3>
      </div>
      <div className="flex items-start gap-2 text-[12px]">
        <CircleDashed className="h-3.5 w-3.5 shrink-0 text-muted-foreground mt-0.5" />
        <span className="text-muted-foreground">
          Projeto {projectName ?? ""} criado
        </span>
      </div>
    </section>
  );
}

// ============================================================
// Status / Priority primitives (subset reused from /intentions)
// ============================================================

function PriorityIcon({ priority }: { priority: IntentionPriority }) {
  const map: Record<IntentionPriority, { bg: string; symbol: string }> = {
    urgent: { bg: "bg-red-500", symbol: "!" },
    high: { bg: "bg-orange-500", symbol: "▲" },
    medium: { bg: "bg-amber-500", symbol: "=" },
    low: { bg: "bg-zinc-500", symbol: "▽" },
  };
  const c = map[priority] ?? map.medium;
  return (
    <div
      className={cn(
        "flex h-4 w-4 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white",
        c.bg,
      )}
    >
      {c.symbol}
    </div>
  );
}

function StatusIcon({ status }: { status: IntentionStatus }) {
  const isDone = status === "done";
  if (isDone) {
    return <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />;
  }
  return (
    <CircleDashed className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
  );
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "agora";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}
