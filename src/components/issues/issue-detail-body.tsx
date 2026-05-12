"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Box,
  MoreHorizontal,
  Trash2,
  RotateCcw,
  CircleDashed,
  CheckCircle2,
  Circle,
  CircleDotDashed,
  XCircle,
  Ban,
  Send,
  User as UserIcon,
} from "lucide-react";

import {
  useIntention,
  useUpdateIntention,
  useMoveStatus,
} from "@/lib/hooks/use-intentions";
import { useProject } from "@/lib/hooks/use-projects";
import { useOrgMembers } from "@/lib/hooks/use-organization";
import { useAuthStore } from "@/lib/stores/auth-store";
import { commentsApi } from "@/lib/api/comments";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type {
  IntentionDocument,
  IntentionPriority,
  IntentionStatus,
  IntentionType,
  TimelineEvent,
} from "@/types/intention";
import type { Comment } from "@/types";

// ============================================================
// Local hooks for comments
// ============================================================

export function useIssueComments(taskId: string) {
  return useQuery({
    queryKey: ["task-comments", taskId],
    queryFn: () => commentsApi.list(taskId),
    enabled: !!taskId,
    staleTime: 30 * 1000,
  });
}

export function useAddIssueComment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (texto: string) => commentsApi.add(taskId, { texto }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["task-comments", taskId] });
    },
    onError: () => {
      toast.error("Erro ao adicionar comentario");
    },
  });
}

// ============================================================
// IssueDetailBody
// ============================================================

export type IssueDetailVariant = "page" | "modal";

interface IssueDetailBodyProps {
  projectId: string;
  intentionId: string;
  variant?: IssueDetailVariant;
}

export function IssueDetailBody({
  projectId,
  intentionId,
}: IssueDetailBodyProps) {
  const { data: intention, isLoading } = useIntention(intentionId);
  const { data: project } = useProject(projectId);
  const { data: comments } = useIssueComments(intentionId);
  const { update: updateIntentionFn } = useUpdateIntention();
  const { move: moveStatusFn } = useMoveStatus();
  const orgId = useAuthStore((s) => s.user?.orgId);

  const i = intention as
    | (IntentionDocument & {
        assignee?: { chave: string; nome: string } | null;
        excluido?: boolean;
      })
    | undefined;

  const isDeleted = i?.excluido === true;

  const handleUpdate = useCallback(
    (fields: Partial<IntentionDocument>) => {
      updateIntentionFn(intentionId, fields);
    },
    [intentionId, updateIntentionFn],
  );

  const handleMoveStatus = useCallback(
    (status: IntentionStatus) => {
      moveStatusFn(intentionId, status);
      toast.success("Status atualizado");
    },
    [intentionId, moveStatusFn],
  );

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden h-full">
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="px-8 py-6">
          <div className="mx-auto max-w-3xl space-y-5">
            {isDeleted && <DeletedBanner />}

            {isLoading ? (
              <SkeletonBody />
            ) : !i ? (
              <p className="text-[13px] text-muted-foreground">
                Issue nao encontrada.
              </p>
            ) : (
              <>
                <EditableTitle
                  value={i.title}
                  onSave={(nome) => handleUpdate({ title: nome })}
                />

                <EditableDescription
                  value={i.description ?? ""}
                  onSave={(descricao) =>
                    handleUpdate({ description: descricao })
                  }
                />

                <ActivitySection
                  timeline={i.timeline ?? []}
                  comments={comments ?? []}
                />

                <CommentForm taskId={intentionId} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right side panel */}
      <aside className="hidden lg:flex w-[280px] shrink-0 flex-col border-l border-border overflow-auto">
        <PropertiesPanel
          intention={i}
          project={project}
          orgId={orgId}
          onUpdate={handleUpdate}
          onMoveStatus={handleMoveStatus}
        />
      </aside>
    </div>
  );
}

// ============================================================
// Inline editors
// ============================================================

function EditableTitle({
  value,
  onSave,
}: {
  value: string;
  onSave: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setText(value);
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const trimmed = text.trim();
    if (trimmed === value) return;
    if (trimmed.length < 3) {
      toast.error("Titulo precisa ter ao menos 3 caracteres");
      setText(value);
      return;
    }
    if (trimmed.length > 512) {
      toast.error("Titulo nao pode passar de 512 caracteres");
      setText(value);
      return;
    }
    onSave(trimmed);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
          if (e.key === "Escape") {
            setText(value);
            setEditing(false);
          }
        }}
        className="w-full bg-transparent text-2xl font-semibold tracking-tight border-none outline-none focus:ring-0 px-0"
      />
    );
  }

  return (
    <h1
      role="button"
      tabIndex={0}
      onClick={() => setEditing(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter") setEditing(true);
      }}
      className="text-2xl font-semibold tracking-tight cursor-text rounded -mx-1 px-1 hover:bg-muted/40 transition-colors"
    >
      {value}
    </h1>
  );
}

function EditableDescription({
  value,
  onSave,
}: {
  value: string;
  onSave: (v: string) => void;
}) {
  const [text, setText] = useState(value);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;
  const lastSavedRef = useRef(value);

  useEffect(() => {
    setText(value);
    lastSavedRef.current = value;
  }, [value]);

  const triggerSave = useCallback((newVal: string) => {
    if (newVal === lastSavedRef.current) return;
    if (newVal.length > 10000) {
      toast.error("Descricao nao pode passar de 10000 caracteres");
      return;
    }
    setStatus("saving");
    lastSavedRef.current = newVal;
    onSaveRef.current(newVal);
    setTimeout(() => setStatus("saved"), 500);
    setTimeout(() => setStatus("idle"), 2500);
  }, []);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-end h-3">
        {status === "saving" && (
          <span className="text-[11px] text-muted-foreground animate-pulse">
            Salvando...
          </span>
        )}
        {status === "saved" && (
          <span className="text-[11px] text-emerald-500">Salvo</span>
        )}
      </div>
      <textarea
        value={text}
        onChange={(e) => {
          const v = e.target.value;
          setText(v);
          setStatus("idle");
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => triggerSave(v), 1500);
        }}
        onBlur={() => {
          if (debounceRef.current) {
            clearTimeout(debounceRef.current);
            debounceRef.current = null;
          }
          triggerSave(text);
        }}
        placeholder="Adicione uma descricao..."
        rows={5}
        className="w-full resize-y rounded-md border border-transparent hover:border-border focus:border-border bg-transparent px-2 py-1.5 text-[13px] leading-relaxed focus:outline-none placeholder:text-muted-foreground/60 transition-colors"
      />
    </div>
  );
}

// ============================================================
// Activity (timeline + comments unified)
// ============================================================

interface ActivityRow {
  id: string;
  kind: "event" | "comment";
  timestamp: string;
  event?: TimelineEvent;
  comment?: Comment;
}

function ActivitySection({
  timeline,
  comments,
}: {
  timeline: TimelineEvent[];
  comments: Comment[];
}) {
  const rows: ActivityRow[] = [
    ...timeline.map(
      (e): ActivityRow => ({
        id: `e-${e.id}`,
        kind: "event",
        timestamp: e.timestamp,
        event: e,
      }),
    ),
    ...comments.map(
      (c): ActivityRow => ({
        id: `c-${c.chave}`,
        kind: "comment",
        timestamp: c.criadoEm,
        comment: c,
      }),
    ),
  ].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  return (
    <section className="space-y-3 pt-4 border-t border-border">
      <div className="flex items-center justify-between">
        <h2 className="text-[13px] font-medium">Atividade</h2>
        <button
          type="button"
          disabled
          title="Inscritos (gap #8)"
          className="flex items-center gap-1.5 text-[12px] text-muted-foreground/70 cursor-not-allowed"
        >
          Cancelar inscricao
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="text-[12px] text-muted-foreground/70">
          Nenhuma atividade ainda.
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) =>
            row.kind === "event" ? (
              <EventRow key={row.id} event={row.event!} />
            ) : (
              <CommentRow key={row.id} comment={row.comment!} />
            ),
          )}
        </ul>
      )}
    </section>
  );
}

function EventRow({ event }: { event: TimelineEvent }) {
  const Icon = event.actorType === "system" ? Box : Circle;
  return (
    <li className="flex items-start gap-2 text-[12px]">
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
        <Icon className="h-3 w-3" />
      </div>
      <div className="flex-1 min-w-0">
        <p>
          <span className="font-medium">{event.actor}</span>{" "}
          <span className="text-muted-foreground">{event.action}</span>{" "}
          <span className="text-muted-foreground/60">
            · {formatRelative(event.timestamp)}
          </span>
        </p>
        {event.details && (
          <p className="text-muted-foreground/70 mt-0.5">{event.details}</p>
        )}
      </div>
    </li>
  );
}

function CommentRow({ comment }: { comment: Comment }) {
  const initials = comment.autor.nome
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <li className="flex items-start gap-2">
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-medium text-white">
        {initials}
      </div>
      <div className="flex-1 min-w-0 rounded-md border border-border bg-card px-3 py-2">
        <div className="flex items-center justify-between text-[12px] mb-1">
          <span className="font-medium">{comment.autor.nome}</span>
          <span className="text-muted-foreground/70">
            {formatRelative(comment.criadoEm)}
          </span>
        </div>
        <p className="text-[13px] whitespace-pre-wrap leading-relaxed">
          {comment.texto}
        </p>
      </div>
    </li>
  );
}

function CommentForm({ taskId }: { taskId: string }) {
  const [text, setText] = useState("");
  const add = useAddIssueComment(taskId);

  const submit = () => {
    if (!text.trim()) return;
    add.mutate(text.trim(), {
      onSuccess: () => setText(""),
    });
  };

  return (
    <div className="rounded-md border border-border bg-card p-3 space-y-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Deixe um comentario..."
        rows={2}
        className="w-full resize-none bg-transparent text-[13px] focus:outline-none placeholder:text-muted-foreground/60"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            submit();
          }
        }}
      />
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground/60">
          Cmd/Ctrl + Enter para enviar
        </span>
        <button
          type="button"
          onClick={submit}
          disabled={!text.trim() || add.isPending}
          className={cn(
            "flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-medium transition-colors",
            !text.trim() || add.isPending
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-foreground text-background hover:opacity-90",
          )}
        >
          <Send className="h-3 w-3" />
          {add.isPending ? "Enviando..." : "Comentar"}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// DeletedBanner
// ============================================================

function DeletedBanner() {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[12px]">
      <div className="flex items-center gap-2 text-amber-200 dark:text-amber-300">
        <Trash2 className="h-3.5 w-3.5 shrink-0" />
        <span>Issue excluida</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled
          title="Restaurar (em breve)"
          className="flex items-center gap-1 rounded px-2 py-0.5 text-amber-200 dark:text-amber-300 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
        >
          <RotateCcw className="h-3 w-3" />
        </button>
        <button
          type="button"
          disabled
          title="Excluir definitivamente (em breve)"
          className="flex items-center gap-1 rounded px-2 py-0.5 text-amber-200 dark:text-amber-300 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// ============================================================
// EditableProperty (generic popover-based selector)
// ============================================================

interface EditableOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

function EditableProperty({
  label,
  current,
  options,
  icon,
  onChange,
  placeholder,
}: {
  label: string;
  current: { value: string; label: string } | null;
  options: EditableOption[];
  icon: React.ReactNode;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const display = current?.label ?? placeholder ?? "Definir";
  const isStub = !current;

  return (
    <div className="flex items-center gap-2 py-0.5">
      <dt className="w-16 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="flex-1 min-w-0">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex w-full items-center gap-1.5 rounded px-1 -mx-1 py-0.5 hover:bg-accent text-left truncate transition-colors",
                isStub && "text-muted-foreground/60",
              )}
            >
              {icon}
              <span className="truncate">{display}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-56 p-1">
            <ul className="max-h-72 overflow-auto">
              {options.map((opt) => (
                <li key={opt.value}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded px-2 py-1.5 text-[12px] hover:bg-accent transition-colors text-left",
                      current?.value === opt.value &&
                        "bg-accent/50 font-medium",
                    )}
                  >
                    {opt.icon}
                    <span className="truncate">{opt.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>
      </dd>
    </div>
  );
}

// ============================================================
// PropertiesPanel
// ============================================================

const STATUS_LIST: IntentionStatus[] = [
  "inbox",
  "ready",
  "validating",
  "validated",
  "executing",
  "done",
  "failed",
  "cancelled",
  "discarded",
];

const PRIORITY_LIST: IntentionPriority[] = ["urgent", "high", "medium", "low"];

const TYPE_LIST: { value: IntentionType; label: string }[] = [
  { value: "feature", label: "Feature" },
  { value: "bug", label: "Bug" },
  { value: "improvement", label: "Melhoria" },
  { value: "review", label: "Review" },
  { value: "analysis", label: "Explain" },
];

const ASSIGNEE_NONE = "__none__";

function PropertiesPanel({
  intention: i,
  project,
  orgId,
  onUpdate,
  onMoveStatus,
}: {
  intention:
    | (IntentionDocument & {
        assignee?: { chave: string; nome: string } | null;
      })
    | undefined;
  project: { nome: string } | undefined;
  orgId: string | undefined;
  onUpdate: (fields: Partial<IntentionDocument>) => void;
  onMoveStatus: (status: IntentionStatus) => void;
}) {
  const { data: members } = useOrgMembers(orgId);

  const statusOptions: EditableOption[] = STATUS_LIST.map((s) => ({
    value: s,
    label: statusLabel(s),
    icon: <StatusIcon status={s} />,
  }));

  const priorityOptions: EditableOption[] = PRIORITY_LIST.map((p) => ({
    value: p,
    label: priorityLabel(p),
  }));

  const typeOptions: EditableOption[] = TYPE_LIST.map((t) => ({
    value: t.value,
    label: t.label,
  }));

  const assigneeOptions: EditableOption[] = [
    {
      value: ASSIGNEE_NONE,
      label: "Sem responsavel",
      icon: (
        <CircleDashed className="h-3 w-3 shrink-0 text-muted-foreground/60" />
      ),
    },
    ...(members ?? []).map((m) => ({
      value: m.id,
      label: m.name || m.email || "Membro",
      icon: <UserIcon className="h-3 w-3 shrink-0 text-muted-foreground/60" />,
    })),
  ];

  const currentAssigneeId = i?.assigneeId ?? i?.assignee?.chave ?? null;
  const currentAssigneeLabel =
    i?.assignee?.nome ||
    members?.find((m) => m.id === currentAssigneeId)?.name ||
    members?.find((m) => m.id === currentAssigneeId)?.email ||
    null;

  return (
    <section className="border-b border-border px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
          Propriedades
        </h3>
      </div>
      <dl className="space-y-2 text-[12px]">
        <EditableProperty
          label="Status"
          current={
            i?.status ? { value: i.status, label: statusLabel(i.status) } : null
          }
          options={statusOptions}
          icon={<StatusIcon status={i?.status ?? "inbox"} />}
          onChange={(v) => onMoveStatus(v as IntentionStatus)}
          placeholder="Definir status"
        />
        <EditableProperty
          label="Prioridade"
          current={
            i?.priority
              ? { value: i.priority, label: priorityLabel(i.priority) }
              : null
          }
          options={priorityOptions}
          icon={
            <MoreHorizontal className="h-3 w-3 shrink-0 text-muted-foreground/60" />
          }
          onChange={(v) => onUpdate({ priority: v as IntentionPriority })}
          placeholder="Definir prioridade"
        />
        <EditableProperty
          label="Responsavel"
          current={
            currentAssigneeId && currentAssigneeLabel
              ? { value: currentAssigneeId, label: currentAssigneeLabel }
              : null
          }
          options={assigneeOptions}
          icon={
            <CircleDashed className="h-3 w-3 shrink-0 text-muted-foreground/60" />
          }
          onChange={(v) =>
            onUpdate({ assigneeId: v === ASSIGNEE_NONE ? null : v })
          }
          placeholder="Atribuir"
        />
        <EditableProperty
          label="Tipo"
          current={i?.type ? { value: i.type, label: typeLabel(i.type) } : null}
          options={typeOptions}
          icon={
            <CircleDashed className="h-3 w-3 shrink-0 text-muted-foreground/60" />
          }
          onChange={(v) => onUpdate({ type: v as IntentionType })}
          placeholder="Definir tipo"
        />
        {/* Projeto: read-only — mover task entre projetos fora de escopo */}
        <div className="flex items-center gap-2 py-0.5">
          <dt className="w-16 shrink-0 text-muted-foreground">Projeto</dt>
          <dd className="flex items-center gap-1.5 truncate">
            <Box className="h-3 w-3 shrink-0 text-muted-foreground" />
            {project?.nome ?? "—"}
          </dd>
        </div>
      </dl>
    </section>
  );
}

// ============================================================
// Helpers (exported for reuse by header)
// ============================================================

export function StatusIcon({ status }: { status: IntentionStatus }) {
  const map: Record<
    IntentionStatus,
    { Icon: React.ComponentType<{ className?: string }>; color: string }
  > = {
    inbox: { Icon: CircleDashed, color: "text-muted-foreground" },
    ready: { Icon: Circle, color: "text-blue-400" },
    validating: { Icon: CircleDotDashed, color: "text-amber-400" },
    validated: { Icon: Circle, color: "text-emerald-400" },
    executing: { Icon: CircleDotDashed, color: "text-amber-400" },
    done: { Icon: CheckCircle2, color: "text-emerald-500" },
    failed: { Icon: XCircle, color: "text-red-500" },
    cancelled: { Icon: Ban, color: "text-muted-foreground" },
    discarded: { Icon: Trash2, color: "text-muted-foreground" },
  };
  const c = map[status] ?? map.inbox;
  return <c.Icon className={cn("h-3 w-3 shrink-0", c.color)} />;
}

export function statusLabel(s: IntentionStatus): string {
  const map: Record<IntentionStatus, string> = {
    inbox: "Backlog",
    ready: "Pronta",
    validating: "Validando",
    validated: "Validada",
    executing: "Em andamento",
    done: "Concluida",
    failed: "Falhou",
    cancelled: "Cancelada",
    discarded: "Descartada",
  };
  return map[s] ?? s;
}

export function priorityLabel(p: IntentionPriority): string {
  const map: Record<IntentionPriority, string> = {
    urgent: "Urgente",
    high: "Alta",
    medium: "Media",
    low: "Baixa",
  };
  return map[p] ?? p;
}

export function typeLabel(t: IntentionType): string {
  const map: Record<IntentionType, string> = {
    feature: "Feature",
    bug: "Bug",
    improvement: "Melhoria",
    review: "Review",
    analysis: "Explain",
    code: "Code",
    documentation: "Documentacao",
    test: "Teste",
    refactor: "Refactor",
  };
  return map[t] ?? t;
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "agora";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m atras`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h atras`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `${d}d atras`;
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

function SkeletonBody() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-7 w-2/3 bg-muted rounded" />
      <div className="h-4 w-full bg-muted rounded" />
      <div className="h-4 w-5/6 bg-muted rounded" />
      <div className="h-4 w-3/4 bg-muted rounded" />
    </div>
  );
}
