"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  CircleDashed,
  CircleDot,
  Flag,
  MessageSquare,
  MoreHorizontal,
  Plus,
  UserPlus,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { IntentionDocument, IntentionPriority } from "@/types/intention";

type StatusKey = "inbox" | "ready" | "executing" | "done" | "failed";

interface StatusConfig {
  status: StatusKey;
  label: string;
  pillBg: string;
  pillText: string;
  iconColor: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STATUS_CONFIG: StatusConfig[] = [
  {
    status: "inbox",
    label: "INBOX",
    pillBg: "bg-zinc-700/70",
    pillText: "text-zinc-100",
    iconColor: "text-zinc-300",
    icon: CircleDashed,
  },
  {
    status: "ready",
    label: "READY",
    pillBg: "bg-blue-600",
    pillText: "text-white",
    iconColor: "text-blue-200",
    icon: Circle,
  },
  {
    status: "executing",
    label: "EM EXECUCAO",
    pillBg: "bg-violet-600",
    pillText: "text-white",
    iconColor: "text-violet-200",
    icon: CircleDot,
  },
  {
    status: "done",
    label: "CONCLUIDO",
    pillBg: "bg-emerald-600",
    pillText: "text-white",
    iconColor: "text-emerald-200",
    icon: CheckCircle2,
  },
  {
    status: "failed",
    label: "FALHOU",
    pillBg: "bg-rose-600",
    pillText: "text-white",
    iconColor: "text-rose-200",
    icon: XCircle,
  },
];

const PRIORITY_COLOR: Record<IntentionPriority, string> = {
  urgent: "text-red-500",
  high: "text-orange-500",
  medium: "text-amber-500",
  low: "text-zinc-400",
};

const PRIORITY_LABEL: Record<IntentionPriority, string> = {
  urgent: "Urgente",
  high: "Alta",
  medium: "Media",
  low: "Baixa",
};

/**
 * Lista de tasks agrupadas por status, no estilo ClickUp "List view".
 *
 * Cada status vira uma secao expansivel com:
 *  - Header: chevron + pill colorido + count + acoes (..., +).
 *  - Tabela: Nome | Responsavel | Data | Prioridade | Status | Comentarios.
 *  - Linha "+ Adicionar Tarefa" ao final.
 *
 * Substitui o KanbanBoard horizontal na aba Visao Geral do projeto.
 */
export function ProjectStatusList({
  projectId,
  issues,
  onNewTask,
}: {
  projectId: string;
  issues: IntentionDocument[];
  onNewTask: () => void;
}) {
  return (
    <div className="divide-y divide-border/40">
      {STATUS_CONFIG.map((cfg) => (
        <StatusSection
          key={cfg.status}
          config={cfg}
          projectId={projectId}
          tasks={issues.filter((i) => i.status === cfg.status)}
          onAdd={onNewTask}
        />
      ))}

      <button
        type="button"
        onClick={onNewTask}
        className="flex w-full items-center gap-2 px-2 py-3 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        Novo status
      </button>
    </div>
  );
}

function StatusSection({
  config,
  projectId,
  tasks,
  onAdd,
}: {
  config: StatusConfig;
  projectId: string;
  tasks: IntentionDocument[];
  onAdd: () => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <section className="py-2">
      {/* Header da secao */}
      <div className="group/section flex items-center gap-2 px-2 py-1">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
          aria-expanded={expanded}
          aria-label={expanded ? "Recolher secao" : "Expandir secao"}
        >
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </button>

        <StatusPill config={config} />

        <span className="text-[12px] tabular-nums text-muted-foreground">
          {tasks.length}
        </span>

        <div className="ml-auto flex items-center gap-0.5 opacity-0 transition-opacity group-hover/section:opacity-100">
          <button
            type="button"
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Acoes da secao"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onAdd}
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Adicionar tarefa nesta secao"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-1">
          <TableHeader />
          {tasks.length === 0 ? (
            <div className="px-3 py-2 text-[12px] text-muted-foreground/70">
              Sem tarefas neste status.
            </div>
          ) : (
            tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                projectId={projectId}
                config={config}
              />
            ))
          )}

          <button
            type="button"
            onClick={onAdd}
            className="flex w-full items-center gap-2 border-t border-border/40 px-3 py-2 text-[13px] text-muted-foreground hover:bg-accent/30 hover:text-foreground transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar Tarefa
          </button>
        </div>
      )}
    </section>
  );
}

function StatusPill({ config }: { config: StatusConfig }) {
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        config.pillBg,
        config.pillText,
      )}
    >
      <Icon className={cn("h-3 w-3", config.iconColor)} />
      {config.label}
    </span>
  );
}

function TableHeader() {
  return (
    <div className="grid grid-cols-[minmax(0,3fr)_140px_160px_120px_140px_60px] items-center gap-3 border-b border-border/40 px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
      <div>Nome</div>
      <div>Responsavel</div>
      <div>Data de vencimento</div>
      <div>Prioridade</div>
      <div>Status</div>
      <div>Coment.</div>
    </div>
  );
}

/** Wrapper visual de celula "editavel" (estilo ClickUp): borda sutil + padding. */
const CELL_BOX =
  "flex h-7 items-center rounded-md border border-border/50 px-2 transition-colors hover:border-border";

function TaskRow({
  task,
  projectId,
  config,
}: {
  task: IntentionDocument;
  projectId: string;
  config: StatusConfig;
}) {
  const Icon = config.icon;
  const href = `/projects/${projectId}/issues/${task.id}`;

  return (
    <Link
      href={href}
      className="grid grid-cols-[minmax(0,3fr)_140px_160px_120px_140px_60px] items-center gap-3 border-b border-border/40 px-3 py-2 text-[13px] transition-colors hover:bg-accent/30"
    >
      {/* Nome */}
      <div className="flex min-w-0 items-center gap-2">
        <Icon className={cn("h-3.5 w-3.5 shrink-0", config.iconColor)} />
        <span className="truncate font-medium">{task.title}</span>
      </div>

      {/* Responsavel */}
      <div className={CELL_BOX}>
        <AssigneeCell assigneeId={task.assigneeId} />
      </div>

      {/* Data de vencimento */}
      <div className={CELL_BOX}>
        <EmptyCell icon={Calendar} />
      </div>

      {/* Prioridade */}
      <div className={CELL_BOX}>
        <PriorityCell priority={task.priority} />
      </div>

      {/* Status (replica do header) */}
      <div className={CELL_BOX}>
        <StatusPill config={config} />
      </div>

      {/* Comentarios (sem moldura) */}
      <EmptyCell icon={MessageSquare} align="end" />
    </Link>
  );
}

function AssigneeCell({ assigneeId }: { assigneeId?: string | null }) {
  if (!assigneeId) {
    return (
      <div className="flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground/60">
        <UserPlus className="h-3 w-3" />
      </div>
    );
  }
  // Sem hook de nomes aqui — placeholder com inicial generica.
  return (
    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[9px] font-semibold text-white">
      ?
    </div>
  );
}

function PriorityCell({ priority }: { priority: IntentionPriority }) {
  if (!priority) {
    return (
      <div className="text-muted-foreground/60">
        <Flag className="h-3.5 w-3.5" />
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 text-[12px]">
      <Flag className={cn("h-3.5 w-3.5", PRIORITY_COLOR[priority])} />
      <span className="text-foreground/85">{PRIORITY_LABEL[priority]}</span>
    </div>
  );
}

function EmptyCell({
  icon: Icon,
  align = "start",
}: {
  icon: React.ComponentType<{ className?: string }>;
  align?: "start" | "end";
}) {
  return (
    <div
      className={cn(
        "flex items-center text-muted-foreground/50",
        align === "end" && "justify-end",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </div>
  );
}
