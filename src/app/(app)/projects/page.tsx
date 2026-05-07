"use client";

import {
  Box,
  Plus,
  SlidersHorizontal,
  Settings2,
  PanelRight,
  Layers,
  CircleDashed,
  Calendar,
  User as UserIcon,
  MoreHorizontal,
  Cpu,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { PageTransition } from "@/components/common/page-transition";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { useProjects } from "@/lib/hooks/use-projects";
import { NewProjectModal } from "@/components/projects/new-project-modal";
import { cn } from "@/lib/utils";

export default function ProjectsPage() {
  usePageTitle("Projetos");
  const router = useRouter();
  const { data: projects, isLoading } = useProjects();
  const [newProjectOpen, setNewProjectOpen] = useState(false);

  return (
    <PageTransition className="h-full">
      <div className="flex h-full flex-col">
        {/* Page header */}
        <header className="flex h-11 shrink-0 items-center justify-between border-b border-border px-8">
          <h1 className="text-[13px] font-medium">Projetos</h1>
          <button
            type="button"
            onClick={() => setNewProjectOpen(true)}
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Criar projeto"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <NewProjectModal
            open={newProjectOpen}
            onOpenChange={setNewProjectOpen}
          />
        </header>

        {/* Tab + filter row */}
        <div className="flex h-10 shrink-0 items-center justify-between border-b border-border px-8">
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-md bg-accent px-2 py-1 text-[12px] font-medium text-foreground"
            >
              Todos os projetos
            </button>
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              aria-label="Layers"
            >
              <Layers className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              aria-label="Filtros"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              aria-label="Opcoes de exibicao"
            >
              <Settings2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              aria-label="Alternar painel"
            >
              <PanelRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {/* Column headers */}
          <div className="grid grid-cols-[minmax(0,1fr)_140px_100px_60px_120px_70px_90px] items-center gap-3 border-b border-border px-8 py-2 text-[11px] font-medium text-muted-foreground">
            <div>Nome</div>
            <div>Saude</div>
            <div>Prioridade</div>
            <div>Responsavel</div>
            <div>Data alvo</div>
            <div className="text-right pr-2">Issues</div>
            <div>Status</div>
          </div>

          {/* Rows */}
          {isLoading ? (
            <SkeletonRows />
          ) : !projects?.length ? (
            <EmptyState onCreate={() => setNewProjectOpen(true)} />
          ) : (
            projects.map((p) => (
              <ProjectRow
                key={p.chave}
                project={p}
                onClick={() => router.push(`/intentions/${p.chave}`)}
                onAutomation={() => router.push(`/projects/${p.chave}/automation`)}
              />
            ))
          )}
        </div>
      </div>
    </PageTransition>
  );
}

function ProjectRow({
  project,
  onClick,
  onAutomation,
}: {
  project: {
    chave: string;
    nome: string;
    dataFim?: string | null;
    taskCount?: number;
    responsavel?: { chave: string; nome: string } | null;
  };
  onClick: () => void;
  onAutomation: () => void;
}) {
  // Status como % de progresso: stub 0% ate API expor count(done)/count(total).
  // Gap registrado em LINEAR_PIVOT_GAPS.md.
  const progress = 0;

  // Health e Priority sao gaps de schema -> stub.
  // Lead = responsavel (DProject.idOwner).

  const targetDate = project.dataFim
    ? new Date(project.dataFim).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;

  const leadInitials = project.responsavel?.nome
    ? project.responsavel.nome
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : null;

  return (
    <div className="group grid w-full grid-cols-[minmax(0,1fr)_140px_100px_60px_120px_70px_90px_32px] items-center gap-3 border-b border-border/60 px-8 py-2 text-[13px] hover:bg-accent/40 transition-colors">
      {/* Nome — clicável para o board */}
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-2 min-w-0 text-left"
      >
        <Box className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="truncate">{project.nome}</span>
      </button>

      {/* Health (stub) */}
      <div className="flex items-center gap-1.5 text-muted-foreground/80 text-[12px]">
        <CircleDashed className="h-3.5 w-3.5" />
        <span>Sem atualizacoes</span>
      </div>

      {/* Priority (stub) */}
      <div className="text-muted-foreground/60 text-[12px]">---</div>

      {/* Lead */}
      <div>
        {leadInitials ? (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
            {leadInitials}
          </div>
        ) : (
          <div className="flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-muted-foreground/40 text-muted-foreground/40">
            <UserIcon className="h-3 w-3" />
          </div>
        )}
      </div>

      {/* Target date */}
      <div>
        {targetDate ? (
          <span className="text-[12px] text-muted-foreground">{targetDate}</span>
        ) : (
          <div className="flex h-5 w-5 items-center justify-center rounded border border-dashed border-muted-foreground/40 text-muted-foreground/40">
            <Calendar className="h-3 w-3" />
          </div>
        )}
      </div>

      {/* Issues count */}
      <div className="text-right pr-2 tabular-nums text-[12px] text-muted-foreground">
        {project.taskCount ?? 0}
      </div>

      {/* Status (% progresso) */}
      <ProgressBadge value={progress} />

      {/* Ações — aparece no hover da row */}
      <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              aria-label="Ações do projeto"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); onAutomation(); }}
              className="flex items-center gap-2 text-[13px]"
            >
              <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
              Automação
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function ProgressBadge({ value }: { value: number }) {
  const radius = 6;
  const circ = 2 * Math.PI * radius;
  const dash = (value / 100) * circ;

  return (
    <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
      <svg width="16" height="16" viewBox="0 0 16 16" className="shrink-0">
        <circle
          cx="8"
          cy="8"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="2 2"
          opacity="0.4"
        />
        {value > 0 && (
          <circle
            cx="8"
            cy="8"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray={`${dash} ${circ}`}
            transform="rotate(-90 8 8)"
            className="text-[var(--scrumban-brand)]"
          />
        )}
      </svg>
      <span className="tabular-nums">{value}%</span>
    </div>
  );
}

function SkeletonRows() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="grid grid-cols-[minmax(0,1fr)_140px_100px_60px_120px_70px_90px] items-center gap-3 border-b border-border/60 px-8 py-2 animate-pulse"
        >
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="h-3 w-20 bg-muted rounded" />
          <div className="h-3 w-8 bg-muted rounded" />
          <div className="h-5 w-5 bg-muted rounded-full" />
          <div className="h-3 w-16 bg-muted rounded" />
          <div className="h-3 w-6 bg-muted rounded ml-auto" />
          <div className="h-3 w-10 bg-muted rounded" />
        </div>
      ))}
    </>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
        <Box className="h-5 w-5 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-sm font-medium">Nenhum projeto ainda</h3>
      <p className="mt-1 text-[12px] text-muted-foreground">
        Crie seu primeiro projeto para comecar.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className={cn(
          "mt-4 inline-flex items-center gap-1.5 rounded-md bg-foreground px-2.5 py-1 text-[12px] font-medium",
          "text-background hover:opacity-90 transition-opacity",
        )}
      >
        <Plus className="h-3 w-3" />
        Novo projeto
      </button>
    </div>
  );
}
