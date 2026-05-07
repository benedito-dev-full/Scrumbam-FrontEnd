"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Box,
  ChevronRight,
  MoreHorizontal,
  Link2,
  Copy,
  GitBranch,
  ArrowRight,
  ChevronDown,
  Trash2,
  RotateCcw,
  Plus,
  CircleDashed,
  CheckCircle2,
  Circle,
  CircleDotDashed,
  XCircle,
  Ban,
  Send,
} from "lucide-react";

import { useRouter } from "next/navigation";

import { PageTransition } from "@/components/common/page-transition";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { useIntention, useDeleteIntention } from "@/lib/hooks/use-intentions";
import { useProject } from "@/lib/hooks/use-projects";
import { commentsApi } from "@/lib/api/comments";
import { cn } from "@/lib/utils";
import type {
  IntentionDocument,
  IntentionPriority,
  IntentionStatus,
  TimelineEvent,
} from "@/types/intention";
import type { Comment } from "@/types";

interface IssueDetailPageProps {
  params: Promise<{ projectId: string; intentionId: string }>;
}

// ============================================================
// Local hooks for comments (no global hook exists yet)
// ============================================================

function useIssueComments(taskId: string) {
  return useQuery({
    queryKey: ["task-comments", taskId],
    queryFn: () => commentsApi.list(taskId),
    enabled: !!taskId,
    staleTime: 30 * 1000,
  });
}

function useAddComment(taskId: string) {
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
// Page
// ============================================================

export default function IssueDetailPage({ params }: IssueDetailPageProps) {
  const { projectId, intentionId } = use(params);
  const { data: intention, isLoading } = useIntention(intentionId);
  const { data: project } = useProject(projectId);
  const { data: comments } = useIssueComments(intentionId);
  const router = useRouter();
  const { remove: removeIntention, isPending: isDeleting } =
    useDeleteIntention();

  const i = intention as
    | (IntentionDocument & {
        assignee?: { chave: string; nome: string } | null;
        excluido?: boolean;
      })
    | undefined;

  usePageTitle(i?.title ?? "Issue");

  const code = `INT-${intentionId}`;
  const isDeleted = i?.excluido === true;

  async function handleDelete() {
    if (isDeleted || isDeleting) return;
    const confirmed = window.confirm(
      `Excluir a issue "${i?.title ?? code}"?\n\nIsso e um soft-delete: a issue sai das listagens, mas o historico fica salvo no banco.`,
    );
    if (!confirmed) return;
    try {
      await removeIntention(intentionId);
      toast.success("Issue excluida");
      router.push(`/intentions/${projectId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir issue");
    }
  }

  return (
    <PageTransition className="h-full">
      <div className="flex h-full flex-col">
        {/* Top breadcrumb bar */}
        <header className="flex h-11 shrink-0 items-center justify-between px-8 border-b border-border">
          <nav className="flex items-center gap-1.5 text-[13px] min-w-0">
            <Box className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <Link
              href={`/intentions/${projectId}`}
              className="text-muted-foreground hover:text-foreground transition-colors truncate"
            >
              {project?.nome ?? "Projeto"}
            </Link>
            <ChevronRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
            <span className="text-muted-foreground tabular-nums">{code}</span>
            <span className="font-medium truncate">{i?.title ?? "..."}</span>
            <button
              type="button"
              className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Mais opcoes"
              title="Mais opcoes"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </nav>

          <div className="flex items-center gap-1">
            <IconButton label="Copiar link">
              <Link2 className="h-3.5 w-3.5" />
            </IconButton>
            <IconButton
              label="Copiar ID"
              onClick={() => {
                navigator.clipboard.writeText(code);
                toast.success("ID copiado");
              }}
            >
              <Copy className="h-3.5 w-3.5" />
            </IconButton>
            <IconButton label="Branch (gap #20)" disabled>
              <GitBranch className="h-3.5 w-3.5" />
            </IconButton>
            <IconButton label="Abrir em nova aba">
              <ArrowRight className="h-3.5 w-3.5" />
            </IconButton>
            <IconButton
              label={isDeleting ? "Excluindo..." : "Excluir issue"}
              onClick={handleDelete}
              disabled={isDeleted || isDeleting}
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </IconButton>
            <IconButton label="Mais opcoes">
              <ChevronDown className="h-3.5 w-3.5" />
            </IconButton>
          </div>
        </header>

        {/* Two-column body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
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
                    <h1 className="text-2xl font-semibold tracking-tight">
                      {i.title}
                    </h1>

                    {i.problema || i.contexto || i.solucaoProposta ? (
                      <DescriptionBody intention={i} />
                    ) : (
                      <p className="text-[13px] text-muted-foreground/70">
                        Adicione uma descricao...
                      </p>
                    )}

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
            <PropertiesPanel intention={i} project={project} />
            <SubscribersPanel />
            <LinkedIssuesPanel />
            <SubIssuesPanel />
          </aside>
        </div>
      </div>
    </PageTransition>
  );
}

// ============================================================
// Body sections
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

function DescriptionBody({ intention: i }: { intention: IntentionDocument }) {
  return (
    <div className="space-y-3 text-[13px] leading-relaxed">
      {i.problema && <Block label="Problema" body={i.problema} />}
      {i.contexto && <Block label="Contexto" body={i.contexto} />}
      {i.solucaoProposta && (
        <Block label="Solucao proposta" body={i.solucaoProposta} />
      )}
      {i.criteriosAceite?.length > 0 && (
        <ListBlock label="Criterios de aceite" items={i.criteriosAceite} />
      )}
      {i.naoObjetivos?.length > 0 && (
        <ListBlock label="Nao objetivos" items={i.naoObjetivos} />
      )}
      {i.riscos?.length > 0 && <ListBlock label="Riscos" items={i.riscos} />}
    </div>
  );
}

function Block({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <h3 className="text-[12px] font-medium text-muted-foreground mb-1">
        {label}
      </h3>
      <p className="whitespace-pre-wrap">{body}</p>
    </div>
  );
}

function ListBlock({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-[12px] font-medium text-muted-foreground mb-1">
        {label}
      </h3>
      <ul className="list-disc pl-5 space-y-0.5">
        {items.map((it, idx) => (
          <li key={idx}>{it}</li>
        ))}
      </ul>
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
  const add = useAddComment(taskId);

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
// Right panel sections
// ============================================================

function PropertiesPanel({
  intention: i,
  project,
}: {
  intention:
    | (IntentionDocument & {
        assignee?: { chave: string; nome: string } | null;
      })
    | undefined;
  project: { nome: string } | undefined;
}) {
  return (
    <section className="border-b border-border px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
          Propriedades
        </h3>
      </div>
      <dl className="space-y-2 text-[12px]">
        <PropRow
          label="Status"
          value={i?.status ? statusLabel(i.status) : "—"}
          icon={<StatusIcon status={i?.status ?? "inbox"} />}
        />
        <PropRow
          label="Prioridade"
          value={i?.priority ? priorityLabel(i.priority) : "Definir prioridade"}
          icon={
            <MoreHorizontal className="h-3 w-3 shrink-0 text-muted-foreground/60" />
          }
          stub={!i?.priority}
        />
        <PropRow
          label="Responsavel"
          value={i?.assignee?.nome ?? "Atribuir"}
          icon={
            <CircleDashed className="h-3 w-3 shrink-0 text-muted-foreground/60" />
          }
          stub={!i?.assignee}
        />
        <PropRow
          label="Projeto"
          value={project?.nome ?? "—"}
          icon={<Box className="h-3 w-3 shrink-0 text-muted-foreground" />}
        />
        <PropRow
          label="Estimativa"
          value={i?.apetiteDias ? `${i.apetiteDias}d` : "Estimativa"}
          icon={
            <CircleDashed className="h-3 w-3 shrink-0 text-muted-foreground/60" />
          }
          stub={!i?.apetiteDias}
        />
        <PropRow
          label="Etiquetas"
          value="Adicionar etiquetas"
          icon={
            <CircleDashed className="h-3 w-3 shrink-0 text-muted-foreground/60" />
          }
          stub
          title="Gap #14 (Project Labels)"
        />
      </dl>
    </section>
  );
}

function SubscribersPanel() {
  return (
    <section className="border-b border-border px-4 py-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
          Inscritos
        </h3>
        <button
          type="button"
          disabled
          title="Gap #8"
          className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground/40 cursor-not-allowed"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
      <p className="text-[11px] text-muted-foreground/70">Em breve.</p>
    </section>
  );
}

function LinkedIssuesPanel() {
  return (
    <section className="border-b border-border px-4 py-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
          Issues relacionadas
        </h3>
        <button
          type="button"
          disabled
          title="Gap #17"
          className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground/40 cursor-not-allowed"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
      <p className="text-[11px] text-muted-foreground/70">
        Bloqueia, relacionada, duplicada.
      </p>
    </section>
  );
}

function SubIssuesPanel() {
  return (
    <section className="px-4 py-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
          Sub-issues
        </h3>
        <button
          type="button"
          disabled
          title="Gap #19"
          className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground/40 cursor-not-allowed"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
      <p className="text-[11px] text-muted-foreground/70">
        Quebrar em sub-tarefas.
      </p>
    </section>
  );
}

// ============================================================
// Helpers
// ============================================================

function PropRow({
  label,
  value,
  icon,
  stub,
  title,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
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
        {icon}
        {value}
      </dd>
    </div>
  );
}

function IconButton({
  children,
  label,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        "flex h-6 w-6 items-center justify-center rounded transition-colors",
        disabled
          ? "text-muted-foreground/30 cursor-not-allowed"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function StatusIcon({ status }: { status: IntentionStatus }) {
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

function statusLabel(s: IntentionStatus): string {
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

function priorityLabel(p: IntentionPriority): string {
  const map: Record<IntentionPriority, string> = {
    urgent: "Urgente",
    high: "Alta",
    medium: "Media",
    low: "Baixa",
  };
  return map[p] ?? p;
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
