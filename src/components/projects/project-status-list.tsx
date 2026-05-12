"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarPlus,
  Check,
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
  X,
  XCircle,
} from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useOrgMembers } from "@/lib/hooks/use-organization";
import { useUpdateIntention, useMoveStatus } from "@/lib/hooks/use-intentions";
import { useTaskDueDate } from "@/lib/hooks/use-task-due-dates";
import type {
  IntentionDocument,
  IntentionPriority,
  IntentionStatus,
} from "@/types/intention";

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

const PRIORITY_OPTIONS: {
  key: IntentionPriority;
  label: string;
  color: string;
}[] = [
  { key: "urgent", label: "Urgente", color: "text-red-500" },
  { key: "high", label: "Alta", color: "text-orange-500" },
  { key: "medium", label: "Media", color: "text-amber-500" },
  { key: "low", label: "Baixa", color: "text-zinc-400" },
];

const PRIORITY_COLOR: Record<IntentionPriority, string> = Object.fromEntries(
  PRIORITY_OPTIONS.map((o) => [o.key, o.color]),
) as Record<IntentionPriority, string>;

const PRIORITY_LABEL: Record<IntentionPriority, string> = Object.fromEntries(
  PRIORITY_OPTIONS.map((o) => [o.key, o.label]),
) as Record<IntentionPriority, string>;

/** Wrapper visual de celula "editavel" (estilo ClickUp): borda sutil + padding. */
const CELL_BOX =
  "flex h-7 w-full items-center rounded-md border border-border/50 px-2 text-left transition-colors hover:border-border";

/**
 * Lista de tasks agrupadas por status, no estilo ClickUp "List view".
 *
 * Cada status vira uma secao expansivel com:
 *  - Header: chevron + pill colorido + count + botao "+" (sempre visivel)
 *  - Tabela: Nome | Responsavel | Data | Prioridade | Status | Comentarios
 *  - Linha "+ Adicionar Tarefa" ao final
 *
 * Celulas com dropdown funcional:
 *  - Responsavel: lista membros da org (useOrgMembers + useUpdateIntention)
 *  - Prioridade: 4 niveis (useUpdateIntention)
 *  - Status:     5 status (useMoveStatus)
 *  - Data:       localStorage (backend V2 ainda nao expoe dueDate)
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
    <div className="divide-y divide-border/70">
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

        {/* "+" sempre visivel ao lado do nome — abre criacao de task. */}
        <button
          type="button"
          onClick={onAdd}
          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="Adicionar tarefa nesta secao"
          title="Adicionar tarefa"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>

        {/* "..." aparece no hover do header da secao (acoes auxiliares). */}
        <div className="ml-auto flex items-center gap-0.5 opacity-0 transition-opacity group-hover/section:opacity-100">
          <button
            type="button"
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Acoes da secao"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
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
            className="flex w-full items-center gap-2 border-t border-border/70 px-3 py-2 text-[13px] text-muted-foreground hover:bg-accent/30 hover:text-foreground transition-colors"
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
    <div className="grid grid-cols-[minmax(0,3fr)_140px_160px_120px_140px_60px] items-center gap-3 border-b border-border/70 px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
      <div>Nome</div>
      <div>Responsavel</div>
      <div>Data de vencimento</div>
      <div>Prioridade</div>
      <div>Status</div>
      <div>Coment.</div>
    </div>
  );
}

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
    <div className="grid grid-cols-[minmax(0,3fr)_140px_160px_120px_140px_60px] items-center gap-3 border-b border-border/70 px-3 py-2 text-[13px] transition-colors hover:bg-accent/30">
      {/* Nome — link para detalhe */}
      <Link
        href={href}
        className="flex min-w-0 items-center gap-2 hover:underline"
      >
        <Icon className={cn("h-3.5 w-3.5 shrink-0", config.iconColor)} />
        <span className="truncate font-medium">{task.title}</span>
      </Link>

      {/* Responsavel */}
      <AssigneeCell task={task} />

      {/* Data de vencimento */}
      <DueDateCell taskId={task.id} />

      {/* Prioridade */}
      <PriorityCell task={task} />

      {/* Status (replica do header) */}
      <StatusCell task={task} config={config} />

      {/* Comentarios (sem moldura) */}
      <div className="flex items-center justify-end text-muted-foreground/50">
        <MessageSquare className="h-3.5 w-3.5" />
      </div>
    </div>
  );
}

// ============================================================
// Celulas com dropdowns
// ============================================================

function AssigneeCell({ task }: { task: IntentionDocument }) {
  const orgId = useAuthStore((s) => s.user?.orgId);
  const { data: members } = useOrgMembers(orgId ?? undefined);
  const { update } = useUpdateIntention();
  const current = members?.find((m) => m.id === task.assigneeId) ?? null;

  const initials = (current?.name ?? "")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className={CELL_BOX}>
          {current ? (
            <span className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[9px] font-semibold text-white">
                {initials || "?"}
              </span>
              <span className="truncate text-[12px] text-foreground/85">
                {current.name}
              </span>
            </span>
          ) : (
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground/70">
              <UserPlus className="h-3 w-3" />
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="start">
        {members?.length ? (
          members.map((m) => {
            const isSel = m.id === task.assigneeId;
            const mInitials = m.name
              .split(" ")
              .map((w) => w[0])
              .filter(Boolean)
              .slice(0, 2)
              .join("")
              .toUpperCase();
            return (
              <DropdownMenuItem
                key={m.id}
                onSelect={() =>
                  update(task.id, { assigneeId: isSel ? null : m.id })
                }
                className="text-[13px]"
              >
                <span className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-semibold text-white">
                  {mInitials}
                </span>
                <span className="flex-1 truncate">{m.name}</span>
                {isSel && (
                  <Check className="ml-2 h-3.5 w-3.5 text-emerald-500" />
                )}
              </DropdownMenuItem>
            );
          })
        ) : (
          <p className="px-2 py-3 text-[12px] text-muted-foreground">
            Nenhum membro disponivel.
          </p>
        )}
        {task.assigneeId && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => update(task.id, { assigneeId: null })}
              className="text-[12px] text-muted-foreground"
            >
              <X className="mr-2 h-3.5 w-3.5" />
              Remover responsavel
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DueDateCell({ taskId }: { taskId: string }) {
  const { dueDate, setDueDate } = useTaskDueDate(taskId);
  const display = dueDate
    ? new Date(`${dueDate}T00:00:00`).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      })
    : null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className={CELL_BOX}>
          {display ? (
            <span className="text-[12px] text-foreground/85">{display}</span>
          ) : (
            <CalendarPlus className="h-3.5 w-3.5 text-muted-foreground/60" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="start">
        <label className="block text-[11px] font-medium text-muted-foreground">
          Data de vencimento
        </label>
        <input
          type="date"
          value={dueDate ?? ""}
          onChange={(e) => setDueDate(e.target.value || null)}
          className="mt-2 w-full rounded-md border border-border bg-background px-2 py-1.5 text-[13px] focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {dueDate && (
          <button
            type="button"
            onClick={() => setDueDate(null)}
            className="mt-2 flex w-full items-center gap-2 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Limpar data
          </button>
        )}
        <p className="mt-2 text-[10px] text-muted-foreground/70">
          Armazenado localmente. Sera persistido no servidor quando o backend
          expuser o campo.
        </p>
      </PopoverContent>
    </Popover>
  );
}

function PriorityCell({ task }: { task: IntentionDocument }) {
  const { update } = useUpdateIntention();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className={CELL_BOX}>
          {task.priority ? (
            <span className="flex items-center gap-1.5 text-[12px]">
              <Flag
                className={cn("h-3.5 w-3.5", PRIORITY_COLOR[task.priority])}
              />
              <span className="text-foreground/85">
                {PRIORITY_LABEL[task.priority]}
              </span>
            </span>
          ) : (
            <Flag className="h-3.5 w-3.5 text-muted-foreground/60" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48" align="start">
        {PRIORITY_OPTIONS.map((opt) => {
          const isSel = task.priority === opt.key;
          return (
            <DropdownMenuItem
              key={opt.key}
              onSelect={() => {
                // DEBUG: rastrear cadeia da mutation
                // eslint-disable-next-line no-console
                console.log("[priority onSelect]", {
                  taskId: task.id,
                  newPriority: opt.key,
                  currentPriority: task.priority,
                  updateFn: typeof update,
                });
                update(task.id, { priority: opt.key });
                // eslint-disable-next-line no-console
                console.log("[priority update called]");
              }}
              className="text-[13px]"
            >
              <Flag className={cn("mr-2 h-3.5 w-3.5", opt.color)} />
              <span className="flex-1">{opt.label}</span>
              {isSel && <Check className="ml-2 h-3.5 w-3.5 text-emerald-500" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function StatusCell({
  task,
  config,
}: {
  task: IntentionDocument;
  config: StatusConfig;
}) {
  const { move } = useMoveStatus();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className={CELL_BOX}>
          <StatusPill config={config} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        {STATUS_CONFIG.map((opt) => {
          const isSel = task.status === opt.status;
          return (
            <DropdownMenuItem
              key={opt.status}
              onSelect={() => move(task.id, opt.status as IntentionStatus)}
            >
              <StatusPill config={opt} />
              {isSel && (
                <Check className="ml-auto h-3.5 w-3.5 text-emerald-500" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
