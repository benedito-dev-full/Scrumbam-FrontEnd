"use client";

import { useState, type ComponentType } from "react";
import Link from "next/link";
import {
  CalendarPlus,
  Check,
  ChevronDown,
  Columns3,
  EyeOff,
  Filter,
  Flag,
  GitBranch,
  GripVertical,
  Layers,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  User,
  UserPlus,
  X,
} from "lucide-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";

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
import { useMoveStatus, useUpdateIntention } from "@/lib/hooks/use-intentions";
import { useTaskDueDate } from "@/lib/hooks/use-task-due-dates";
import type {
  IntentionDocument,
  IntentionPriority,
  IntentionStatus,
} from "@/types/intention";

interface StatusConfig {
  key: IntentionStatus;
  label: string;
  variant: "active" | "muted";
  color: string;
  pillBg: string;
  glyphIcon?: "check" | "x" | "half" | "dot";
}

const STATUS_CONFIG: StatusConfig[] = [
  { key: "inbox",     label: "INBOX",        variant: "muted",  color: "#71717a", pillBg: "bg-zinc-800",      glyphIcon: "dot" },
  { key: "ready",     label: "READY",        variant: "muted",  color: "#3b82f6", pillBg: "bg-blue-500/20",   glyphIcon: "dot" },
  { key: "executing", label: "EM PROGRESSO", variant: "active", color: "#ffffff", pillBg: "bg-violet-500",    glyphIcon: "half" },
  { key: "done",      label: "CONCLUÍDO",    variant: "muted",  color: "#22c55e", pillBg: "bg-emerald-500/20",glyphIcon: "check" },
  { key: "failed",    label: "FALHOU",       variant: "muted",  color: "#ef4444", pillBg: "bg-red-500/20",    glyphIcon: "x" },
];

const PRIORITY_OPTIONS: {
  key: IntentionPriority;
  label: string;
  color: string;
}[] = [
  { key: "urgent", label: "Urgente", color: "text-red-500" },
  { key: "high", label: "Alta", color: "text-orange-500" },
  { key: "medium", label: "Média", color: "text-amber-500" },
  { key: "low", label: "Baixa", color: "text-zinc-400" },
];

const PRIORITY_COLOR: Record<IntentionPriority, string> = Object.fromEntries(
  PRIORITY_OPTIONS.map((o) => [o.key, o.color]),
) as Record<IntentionPriority, string>;

const PRIORITY_LABEL: Record<IntentionPriority, string> = Object.fromEntries(
  PRIORITY_OPTIONS.map((o) => [o.key, o.label]),
) as Record<IntentionPriority, string>;

const ROW_GRID =
  "grid grid-cols-[minmax(420px,1fr)_160px_200px_160px_200px_200px_40px] items-center gap-2 pl-[30px] pr-1.5";

const CELL_BOX =
  "flex h-7 w-full items-center rounded-md px-1.5 text-left transition-colors hover:bg-zinc-800/80";

export interface ProjectStatusListProps {
  issues: IntentionDocument[];
  projectId: string;
  onNewTask: () => void;
}

export function ProjectStatusList({
  issues,
  projectId,
  onNewTask,
}: ProjectStatusListProps) {
  const { move } = useMoveStatus();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const groups = STATUS_CONFIG.map((cfg) => ({
    ...cfg,
    tasks: issues.filter((i) => i.status === cfg.key),
  }));

  const activeTask =
    activeId != null ? issues.find((i) => i.id === activeId) ?? null : null;

  const activeConfig = activeTask
    ? STATUS_CONFIG.find((c) => c.key === activeTask.status) ?? null
    : null;

  const toggleCollapsed = (key: string) =>
    setCollapsed((c) => ({ ...c, [key]: !c[key] }));

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);

    const { active, over } = event;
    if (!over) return;

    const newStatus = String(over.id) as IntentionStatus;
    const task = issues.find((i) => i.id === String(active.id));

    if (!task || task.status === newStatus) return;

    move(String(active.id), newStatus);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="rounded-lg border border-border bg-zinc-950/40 text-zinc-100">
        <Toolbar onNewTask={onNewTask} />

        <div className="pb-2">
          {issues.length === 0 ? (
            <p className="px-6 py-10 text-center text-[12px] text-zinc-500">
              Nenhuma tarefa neste projeto ainda.
            </p>
          ) : (
            groups.map((g) => (
              <StatusGroup
                key={g.key}
                config={g}
                tasks={g.tasks}
                projectId={projectId}
                collapsed={!!collapsed[g.key]}
                onToggleCollapsed={() => toggleCollapsed(g.key)}
                onNewTask={onNewTask}
                isDraggingActive={activeId !== null}
              />
            ))
          )}

          <button
            type="button"
            onClick={onNewTask}
            className="ml-4 mt-2 flex items-center gap-2 px-2 py-2 text-[12px] text-zinc-500 transition-colors hover:text-zinc-300"
          >
            <Plus className="h-3.5 w-3.5" />
            Novo status
          </button>
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask && activeConfig && (
          <DragPreview task={activeTask} config={activeConfig} />
        )}
      </DragOverlay>
    </DndContext>
  );
}

function Toolbar({ onNewTask }: { onNewTask: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
      <div className="flex items-center gap-1">
        <ToolbarPill icon={Layers} label="Grupo: Status" active />
        <ToolbarPill icon={Columns3} label="Colunas" />
      </div>

      <div className="flex items-center gap-1">
        <span className="ml-1 flex h-6 w-6 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-[10px] font-semibold text-zinc-300">
          B
        </span>

        <button
          type="button"
          aria-label="Buscar"
          className="ml-1 flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
        >
          <Search className="h-3.5 w-3.5" />
        </button>

        <ToolbarPill icon={Settings} label="Personalizar" />

        <div className="ml-1 flex items-stretch overflow-hidden rounded-md bg-zinc-800">
          <button
            type="button"
            onClick={onNewTask}
            className="px-3 py-1.5 text-[12px] font-semibold text-zinc-100 transition-colors hover:bg-zinc-700"
          >
            Add Tarefa
          </button>

          <button
            type="button"
            aria-label="Mais opções"
            className="flex items-center border-l border-zinc-700 px-1.5 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-100"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ToolbarPill({
  icon: Icon,
  label,
  active = false,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors",
        active
          ? "bg-violet-500/25 text-violet-200"
          : "text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function StatusGroup({
  config,
  tasks,
  projectId,
  collapsed,
  onToggleCollapsed,
  onNewTask,
  isDraggingActive,
}: {
  config: StatusConfig;
  tasks: IntentionDocument[];
  projectId: string;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onNewTask: () => void;
  isDraggingActive: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: config.key });

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "py-1.5 transition-colors",
        isDraggingActive && "rounded-md ring-1 ring-transparent",
        isOver && "rounded-md bg-violet-500/[0.08] ring-violet-500/30",
      )}
    >
      <div className="group/section flex items-center gap-2 px-4 py-1.5">
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? "Expandir" : "Recolher"}
          className="flex h-4 w-4 items-center justify-center text-zinc-400 transition-transform hover:text-zinc-100"
          style={{ transform: collapsed ? "rotate(-90deg)" : "none" }}
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>

        <StatusPill config={config} />

        <span className="text-[12px] text-zinc-500">{tasks.length}</span>

        <button
          type="button"
          onClick={onNewTask}
          className="flex h-6 w-6 items-center justify-center rounded text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          aria-label="Adicionar tarefa nesta seção"
          title="Adicionar tarefa"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>

        <div className="ml-auto flex items-center gap-0.5 opacity-0 transition-opacity group-hover/section:opacity-100">
          <button
            type="button"
            className="flex h-6 w-6 items-center justify-center rounded text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
            aria-label="Ações da seção"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {!collapsed && (
        <StatusTable
          tasks={tasks}
          config={config}
          projectId={projectId}
          onNewTask={onNewTask}
        />
      )}
    </section>
  );
}

function StatusTable({
  tasks,
  config,
  projectId,
  onNewTask,
}: {
  tasks: IntentionDocument[];
  config: StatusConfig;
  projectId: string;
  onNewTask: () => void;
}) {
  return (
    <div className="px-4">
      <div
        className={cn(
          ROW_GRID,
          "h-8 border-b border-zinc-800 text-[12px] text-zinc-500",
        )}
      >
        <HeaderCell label="Nome" />
        <HeaderCell label="Responsável" />
        <HeaderCell label="Data de vencimento" />
        <HeaderCell label="Prioridade" />
        <HeaderCell label="Status" />
        <HeaderCell label="Comentários" />

        <div className="flex justify-center">
          <button
            type="button"
            aria-label="Adicionar coluna"
            className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-zinc-100"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          config={config}
          projectId={projectId}
        />
      ))}

      <button
        type="button"
        onClick={onNewTask}
        className="flex items-center gap-2 py-2 pl-[30px] text-[12.5px] text-zinc-500 transition-colors hover:text-zinc-300 cursor-pointer"
      >
        <Plus className="h-3.5 w-3.5" />
        Adicionar Tarefa
      </button>
    </div>
  );
}

function HeaderCell({ label }: { label: string }) {
  return <span className="truncate">{label}</span>;
}

function TaskRow({
  task,
  config,
  projectId,
}: {
  task: IntentionDocument;
  config: StatusConfig;
  projectId: string;
}) {
  const href = `/projects/${projectId}/issues/${task.id}`;

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        ROW_GRID,
        "group/row relative h-[38px] select-none border-b border-zinc-800/80 text-[13px] transition-colors hover:bg-zinc-900/60",
        "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-40",
      )}
    >
      <div className="flex min-w-0 items-center gap-1.5">
        <span
          aria-hidden
          className="flex h-5 w-4 shrink-0 items-center justify-center text-zinc-600/0 transition-colors group-hover/row:text-zinc-600"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </span>

        <Link
          href={href}
          draggable={false}
          onClick={(e) => e.stopPropagation()}
          className="flex min-w-0 flex-1 items-center gap-2 font-semibold text-zinc-100 hover:underline"
        >
          <StatusGlyph config={config} />
          <span className="truncate">{task.title}</span>
        </Link>
      </div>

      <AssigneeCell task={task} />

      <DueDateCell taskId={task.id} />

      <PriorityCell task={task} />

      <StatusCell task={task} config={config} />

      <div className="flex items-center text-zinc-600">
        <button
          type="button"
          aria-label="Comentar"
          title="Comentar"
          className="flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-zinc-800 hover:text-zinc-300"
        >
          <MessageSquare className="h-3.5 w-3.5" />
        </button>
      </div>

      <div />
    </div>
  );
}

function StatusGlyph({
  config,
  size = 12,
}: {
  config: StatusConfig;
  size?: number;
}) {
  const { glyphIcon, color } = config;
  const s = size;
  const strokeW = size <= 10 ? 2 : 1.5;

  if (glyphIcon === "half") {
    return (
      <span
        aria-hidden
        className="inline-block shrink-0 rounded-full"
        style={{
          width: s,
          height: s,
          border: `${strokeW}px solid ${color}`,
          background: `conic-gradient(${color} 0 50%, transparent 50% 100%)`,
        }}
      />
    );
  }

  if (glyphIcon === "check") {
    return (
      <span
        aria-hidden
        className="inline-flex shrink-0 items-center justify-center rounded-full"
        style={{ width: s, height: s, background: color }}
      >
        <svg width={s * 0.65} height={s * 0.65} viewBox="0 0 10 10" fill="none">
          <polyline points="1.5,5 4,7.5 8.5,2.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }

  if (glyphIcon === "x") {
    return (
      <span
        aria-hidden
        className="inline-flex shrink-0 items-center justify-center rounded-full"
        style={{ width: s, height: s, background: color }}
      >
        <svg width={s * 0.55} height={s * 0.55} viewBox="0 0 10 10" fill="none">
          <line x1="2" y1="2" x2="8" y2="8" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          <line x1="8" y1="2" x2="2" y2="8" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </span>
    );
  }

  // dot (inbox, ready)
  return (
    <span
      aria-hidden
      className="inline-block shrink-0 rounded-full border"
      style={{ width: s, height: s, borderColor: color }}
    />
  );
}

function StatusPill({ config }: { config: StatusConfig }) {
  const isActive = config.variant === "active";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded px-2 py-1 text-[11px] font-bold tracking-wide",
        config.pillBg,
        isActive ? "text-white" : "text-zinc-200",
      )}
    >
      <StatusGlyph config={config} size={10} />
      {config.label}
    </span>
  );
}

function DragPreview({
  task,
  config,
}: {
  task: IntentionDocument;
  config: StatusConfig;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-violet-500/40 bg-zinc-950 px-3 py-2 text-[13px] text-zinc-100 shadow-lg ring-1 ring-violet-500/20">
      <StatusGlyph config={config} />
      <span className="truncate font-medium">{task.title}</span>
    </div>
  );
}

function AssigneeCell({ task }: { task: IntentionDocument }) {
  const orgId = useAuthStore((s) => s.user?.orgId);
  const { data: members } = useOrgMembers(orgId ?? undefined);
  const { update } = useUpdateIntention();

  const assigneeId =
    (task as IntentionDocument & { assigneeId?: string | null }).assigneeId ??
    null;

  const current = members?.find((m) => m.id === assigneeId) ?? null;

  const initials = (current?.name ?? "")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const updateAssignee = (value: string | null) => {
    update(task.id, {
      assigneeId: value,
    } as Partial<IntentionDocument> & { assigneeId?: string | null });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className={CELL_BOX}>
          {current ? (
            <span className="flex min-w-0 items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[9px] font-semibold text-white">
                {initials || "?"}
              </span>
              <span className="truncate text-[12px] text-zinc-200">
                {current.name}
              </span>
            </span>
          ) : (
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-zinc-600 text-zinc-600 transition-colors hover:text-zinc-300">
              <UserPlus className="h-3.5 w-3.5" />
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64" align="start">
        {members?.length ? (
          members.map((m) => {
            const isSelected = m.id === assigneeId;
            const memberInitials = m.name
              .split(" ")
              .map((w) => w[0])
              .filter(Boolean)
              .slice(0, 2)
              .join("")
              .toUpperCase();

            return (
              <DropdownMenuItem
                key={m.id}
                onSelect={() => updateAssignee(isSelected ? null : m.id)}
                className="text-[13px]"
              >
                <span className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-semibold text-white">
                  {memberInitials}
                </span>

                <span className="flex-1 truncate">{m.name}</span>

                {isSelected && (
                  <Check className="ml-2 h-3.5 w-3.5 text-emerald-500" />
                )}
              </DropdownMenuItem>
            );
          })
        ) : (
          <p className="px-2 py-3 text-[12px] text-muted-foreground">
            Nenhum membro disponível.
          </p>
        )}

        {assigneeId && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => updateAssignee(null)}
              className="text-[12px] text-muted-foreground"
            >
              <X className="mr-2 h-3.5 w-3.5" />
              Remover responsável
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
            <span className="text-[12px] text-zinc-200">{display}</span>
          ) : (
            <CalendarPlus className="h-4 w-4 text-zinc-600" />
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
            className="mt-2 flex w-full items-center gap-2 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
            Limpar data
          </button>
        )}

        <p className="mt-2 text-[10px] text-muted-foreground/70">
          Armazenado localmente. Será persistido no servidor quando o backend
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
              <span className="text-zinc-200">
                {PRIORITY_LABEL[task.priority]}
              </span>
            </span>
          ) : (
            <Flag className="h-4 w-4 text-zinc-600" />
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-48" align="start">
        {PRIORITY_OPTIONS.map((opt) => {
          const isSelected = task.priority === opt.key;

          return (
            <DropdownMenuItem
              key={opt.key}
              onSelect={() => update(task.id, { priority: opt.key })}
              className="text-[13px]"
            >
              <Flag className={cn("mr-2 h-3.5 w-3.5", opt.color)} />
              <span className="flex-1">{opt.label}</span>

              {isSelected && (
                <Check className="ml-2 h-3.5 w-3.5 text-emerald-500" />
              )}
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
          const isSelected = task.status === opt.key;

          return (
            <DropdownMenuItem
              key={opt.key}
              onSelect={() => move(task.id, opt.key)}
            >
              <StatusPill config={opt} />

              {isSelected && (
                <Check className="ml-auto h-3.5 w-3.5 text-emerald-500" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ProjectStatusList;