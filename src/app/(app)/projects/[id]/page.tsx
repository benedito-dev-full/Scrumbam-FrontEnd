"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  Box,
  Star,
  MoreHorizontal,
  Link2,
  Bell,
  ChevronRight,
  CircleDashed,
  CheckCircle2,
  Plus,
  Calendar,
  User as UserIcon,
  Hash,
  PenSquare,
  Cpu,
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
            <Box className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
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
            <MilestonesPanel />
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
  project: { nome: string; descricao?: string | null } | undefined;
  isLoading: boolean;
  issues: IntentionDocument[];
}) {
  return (
    <div className="px-8 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Project header */}
        <div className="space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
            <Box className="h-5 w-5 text-foreground" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {isLoading ? "..." : (project?.nome ?? "Project")}
          </h1>
          <p className="text-[13px] text-muted-foreground">
            {project?.descricao || "Adicione um resumo curto..."}
          </p>
        </div>

        {/* Inline properties strip */}
        <PropertiesStrip />

        {/* Resources */}
        <ResourcesRow />

        {/* Project update CTA */}
        <ProjectUpdateCTA />

        {/* Description / linked issues */}
        <section className="space-y-2">
          <h2 className="text-[13px] font-medium text-muted-foreground">
            Description
          </h2>
          <div className="space-y-2">
            {issues.length === 0 ? (
              <p className="text-[12px] text-muted-foreground/70">
                No issues linked yet.
              </p>
            ) : (
              issues.slice(0, 5).map((i) => (
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
              ))
            )}
          </div>
        </section>

        {/* Milestone CTA (gap #11) */}
        <button
          type="button"
          className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
          title="Em breve (gap de schema)"
          disabled
        >
          <Plus className="h-3 w-3" />
          Marco
        </button>
      </div>
    </div>
  );
}

function PropertiesStrip() {
  return (
    <div className="flex flex-wrap items-center gap-2 text-[12px]">
      <span className="text-muted-foreground mr-1">Propriedades</span>
      <ChipButton
        icon={CircleDashed}
        label="Backlog"
        iconClass="text-amber-400"
      />
      <ChipButton
        icon={MoreHorizontal}
        label="Sem prioridade"
        stub
        title="Gap #5"
      />
      <ChipButton
        icon={UserIcon}
        label="Responsavel"
        stub
        title="Sem responsavel no schema do projeto"
      />
      <ChipButton icon={Calendar} label="Data alvo" />
      <ChipButton
        icon={Hash}
        label="Devari Tecnologia"
        stub
        title="Gap #1 (Times)"
      />
      <button
        type="button"
        className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        aria-label="Mais propriedades"
        title="Mais propriedades"
      >
        <MoreHorizontal className="h-3 w-3" />
      </button>
    </div>
  );
}

function ResourcesRow() {
  return (
    <div className="flex items-center gap-2 text-[12px]">
      <span className="text-muted-foreground mr-1">Recursos</span>
      <button
        type="button"
        disabled
        title="Em breve (gap #12)"
        className="flex items-center gap-1 rounded-md border border-dashed border-muted-foreground/40 px-2 py-1 text-muted-foreground/70 cursor-not-allowed"
      >
        <Plus className="h-3 w-3" />
        Adicionar documento ou link...
      </button>
    </div>
  );
}

function ProjectUpdateCTA() {
  return (
    <button
      type="button"
      disabled
      title="Em breve (gap #10)"
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-muted-foreground/30 bg-card/40 px-4 py-4",
        "text-[13px] text-muted-foreground/80 cursor-not-allowed",
      )}
    >
      <PenSquare className="h-4 w-4" />
      Escrever primeira atualizacao do projeto
    </button>
  );
}

function ChipButton({
  icon: Icon,
  label,
  iconClass,
  stub,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  iconClass?: string;
  stub?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      disabled={stub}
      title={title}
      className={cn(
        "flex items-center gap-1.5 rounded-md border border-border px-2 py-1 transition-colors",
        stub
          ? "text-muted-foreground/60 cursor-not-allowed"
          : "text-foreground hover:bg-accent",
      )}
    >
      <Icon className={cn("h-3.5 w-3.5 shrink-0", iconClass)} />
      <span>{label}</span>
    </button>
  );
}

// ============================================================
// Activity tab (stub minimal)
// ============================================================

function ActivityTab() {
  return (
    <div className="px-8 py-8">
      <div className="mx-auto max-w-3xl">
        <p className="text-[12px] text-muted-foreground">
          Feed de atividade em breve. (Backend tem `DEvento` filtrado por
          `idProject`; falta hook no frontend.)
        </p>
      </div>
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
  project: { nome: string; descricao?: string | null } | undefined;
}) {
  return (
    <section className="border-b border-border px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
          Propriedades
        </h3>
        <button
          type="button"
          className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="Adicionar propriedade"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
      <dl className="space-y-2 text-[12px]">
        <PropRow label="Status" value="Backlog" iconColor="text-amber-400" />
        <PropRow
          label="Prioridade"
          value="Sem prioridade"
          stub
          title="Gap #5"
        />
        <PropRow label="Responsavel" value="Adicionar responsavel" stub />
        <PropRow label="Membros" value="Adicionar membros" />
        <PropRow label="Datas" value="Inicio → Entrega" />
        <PropRow
          label="Times"
          value="Devari Tecnologia"
          iconColor="text-emerald-500"
          stub
          title="Gap #1 (Times)"
        />
        <PropRow label="Slack" value="Canal Slack" stub title="Gap #13" />
        <PropRow
          label="Etiquetas"
          value="Adicionar etiqueta"
          stub
          title="Gap #14"
        />
      </dl>
      {project?.nome && <span className="sr-only">{project.nome}</span>}
    </section>
  );
}

function PropRow({
  label,
  value,
  iconColor,
  stub,
  title,
}: {
  label: string;
  value: string;
  iconColor?: string;
  stub?: boolean;
  title?: string;
}) {
  return (
    <div className="flex items-center gap-2 py-0.5" title={title}>
      <dt className="w-16 shrink-0 text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "flex items-center gap-1.5 truncate",
          stub && "text-muted-foreground/60",
        )}
      >
        <CircleDashed className={cn("h-3 w-3 shrink-0", iconColor)} />
        {value}
      </dd>
    </div>
  );
}

function MilestonesPanel() {
  return (
    <section className="border-b border-border px-4 py-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
          Marcos
        </h3>
        <button
          type="button"
          disabled
          title="Gap #11"
          className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground/40 cursor-not-allowed"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
      <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
        Adicione marcos para organizar o trabalho do projeto em etapas mais
        granulares.
      </p>
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
        <button
          type="button"
          className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          Ver tudo
        </button>
      </div>
      <div className="flex items-start gap-2 text-[12px]">
        <Box className="h-3.5 w-3.5 shrink-0 text-muted-foreground mt-0.5" />
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
