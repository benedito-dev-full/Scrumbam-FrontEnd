"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, Timer, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type {
  IntentionDocument,
  IntentionPriority,
  IntentionType,
} from "@/types/intention";
import { IntentionDocView } from "./intention-doc-view";
import { IntentionTimeline } from "./intention-timeline";
import { IntentionActions } from "./intention-actions";
import { useUpdateIntention } from "@/lib/hooks/use-intentions";

interface IntentionDetailProps {
  intention: IntentionDocument;
  projectId: string;
}

const STATUS_DISPLAY: Record<
  string,
  { label: string; icon: string; bgClass: string }
> = {
  inbox: {
    label: "Inbox",
    icon: "\u{1F4E5}",
    bgClass: "bg-muted/50 text-muted-foreground",
  },
  ready: {
    label: "Pronta",
    icon: "\u2705",
    bgClass: "bg-[var(--status-todo-bg)] text-[var(--status-todo)]",
  },
  executing: {
    label: "Executando",
    icon: "\u26A1",
    bgClass: "bg-[var(--ai-accent-muted)] text-[var(--ai-accent)]",
  },
  done: {
    label: "Concluida",
    icon: "\u2714\uFE0F",
    bgClass: "bg-[var(--status-done-bg)] text-[var(--status-done)]",
  },
  failed: {
    label: "Falhou",
    icon: "\u274C",
    bgClass: "bg-destructive/10 text-destructive",
  },
  cancelled: {
    label: "Cancelada",
    icon: "\uD83D\uDEAB",
    bgClass: "bg-muted/50 text-muted-foreground",
  },
  discarded: {
    label: "Descartada",
    icon: "\uD83D\uDDD1\uFE0F",
    bgClass: "bg-muted/50 text-muted-foreground",
  },
};

const TYPE_DISPLAY: Record<string, { label: string; bgClass: string }> = {
  feature: {
    label: "Feature",
    bgClass: "bg-[var(--type-feature)]/10 text-[var(--type-feature)]",
  },
  bug: {
    label: "Bug",
    bgClass: "bg-destructive/10 text-destructive",
  },
  improvement: {
    label: "Melhoria",
    bgClass: "bg-[var(--type-improvement)]/10 text-[var(--type-improvement)]",
  },
  code: {
    label: "Feature",
    bgClass: "bg-[var(--type-feature)]/10 text-[var(--type-feature)]",
  },
  analysis: {
    label: "Analise",
    bgClass: "bg-[var(--ai-accent-muted)] text-[var(--ai-accent)]",
  },
  documentation: {
    label: "Docs",
    bgClass: "bg-[var(--status-todo-bg)] text-[var(--status-todo)]",
  },
  test: {
    label: "Teste",
    bgClass: "bg-[var(--status-review-bg)] text-[var(--status-review)]",
  },
  review: {
    label: "Review",
    bgClass: "bg-[var(--status-review-bg)] text-[var(--status-review)]",
  },
  refactor: {
    label: "Melhoria",
    bgClass: "bg-[var(--type-improvement)]/10 text-[var(--type-improvement)]",
  },
};

const PRIORITY_DISPLAY: Record<string, { label: string; bgClass: string }> = {
  urgent: {
    label: "Urgente",
    bgClass: "bg-[var(--priority-urgent)]/10 text-[var(--priority-urgent)]",
  },
  high: {
    label: "Alta",
    bgClass: "bg-[var(--priority-high)]/10 text-[var(--priority-high)]",
  },
  medium: {
    label: "Media",
    bgClass: "bg-[var(--priority-medium)]/10 text-[var(--priority-medium)]",
  },
  low: {
    label: "Baixa",
    bgClass: "bg-[var(--priority-low)]/10 text-[var(--priority-low)]",
  },
};

// Status that allow editing
const EDITABLE_STATUSES = new Set(["inbox", "ready"]);

export function IntentionDetail({
  intention,
  projectId,
}: IntentionDetailProps) {
  const { update } = useUpdateIntention();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState<Partial<IntentionDocument>>({});

  const canEdit = EDITABLE_STATUSES.has(intention.status);

  const statusCfg = STATUS_DISPLAY[intention.status] ?? STATUS_DISPLAY.inbox;

  // For type and priority, use editForm values when editing
  const currentType =
    isEditing && editForm.type !== undefined ? editForm.type : intention.type;
  const currentPriority =
    isEditing && editForm.priority !== undefined
      ? editForm.priority
      : intention.priority;

  const typeCfg = TYPE_DISPLAY[currentType] ?? TYPE_DISPLAY.code;
  const prioCfg = PRIORITY_DISPLAY[currentPriority] ?? PRIORITY_DISPLAY.medium;

  const handleStartEdit = useCallback(() => {
    setEditForm({
      title: intention.title,
      problema: intention.problema,
      contexto: intention.contexto,
      solucaoProposta: intention.solucaoProposta,
      criteriosAceite: [...intention.criteriosAceite],
      naoObjetivos: [...intention.naoObjetivos],
      riscos: [...intention.riscos],
      type: intention.type,
      priority: intention.priority,
    });
    setIsEditing(true);
  }, [intention]);

  const handleSave = useCallback(() => {
    setIsSaving(true);
    update(intention.id, editForm);
    toast.success("Alteracoes salvas com sucesso");
    setIsSaving(false);
    setIsEditing(false);
  }, [intention.id, editForm, update]);

  const handleCancel = useCallback(() => {
    setEditForm({});
    setIsEditing(false);
  }, []);

  const handleUpdateForm = useCallback(
    (partial: Partial<IntentionDocument>) => {
      setEditForm((prev) => ({ ...prev, ...partial }));
    },
    [],
  );

  return (
    <div className="space-y-6">
      {/* Back + Title Header */}
      <div>
        <Link
          href={`/projects/${projectId}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        {/* Title: editable when editing */}
        {isEditing ? (
          <EditableTitle
            value={editForm.title ?? intention.title}
            onChange={(title) => handleUpdateForm({ title })}
          />
        ) : (
          <h1 className="text-2xl font-bold tracking-tight mb-2">
            {intention.title}
          </h1>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className={statusCfg.bgClass}>
            <span className="mr-1">{statusCfg.icon}</span>
            {statusCfg.label}
          </Badge>
          <Badge variant="secondary" className={typeCfg.bgClass}>
            {typeCfg.label}
          </Badge>
          <Badge variant="secondary" className={prioCfg.bgClass}>
            {prioCfg.label}
          </Badge>
        </div>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Intention Document */}
          <div className="rounded-lg border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold">Documento de Intencao</h2>
              {canEdit && !isEditing && (
                <button
                  onClick={handleStartEdit}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Pencil className="h-3 w-3" />
                  Editar
                </button>
              )}
            </div>
            <IntentionDocView
              intention={intention}
              editable={isEditing}
              editForm={editForm}
              onUpdate={handleUpdateForm}
            />
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-5">
          {/* Config Card */}
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Configuracao
            </p>

            {/* Type: editable via select when editing */}
            {isEditing ? (
              <EditableSelectRow
                label="Tipo"
                value={currentType}
                onChange={(val) =>
                  handleUpdateForm({ type: val as IntentionType })
                }
                options={Object.entries(TYPE_DISPLAY).map(([k, v]) => ({
                  value: k,
                  label: v.label,
                }))}
              />
            ) : (
              <DetailRow label="Tipo" value={typeCfg.label} />
            )}

            {/* Priority: editable via select when editing */}
            {isEditing ? (
              <EditableSelectRow
                label="Prioridade"
                value={currentPriority}
                onChange={(val) =>
                  handleUpdateForm({ priority: val as IntentionPriority })
                }
                options={Object.entries(PRIORITY_DISPLAY).map(([k, v]) => ({
                  value: k,
                  label: v.label,
                }))}
              />
            ) : (
              <DetailRow label="Prioridade" value={prioCfg.label} />
            )}

            <DetailRow
              label="Apetite"
              value={`${intention.apetiteDias} dias`}
              icon={<Timer className="h-3.5 w-3.5 text-muted-foreground" />}
            />
            <DetailRow
              label="Projeto"
              value={intention.projectSlug ?? "Nenhum projeto atribuido"}
            />
            <DetailRow label="Criado por" value={intention.createdBy} />
            <DetailRow
              label="Criado em"
              value={formatDate(intention.createdAt)}
              icon={<Calendar className="h-3.5 w-3.5 text-muted-foreground" />}
            />
          </div>

          {/* Actions Card */}
          <div className="rounded-lg border bg-card p-4">
            <IntentionActions
              intention={intention}
              isEditing={isEditing}
              onEditClick={handleStartEdit}
              onCancelEdit={handleCancel}
              onSaveEdit={handleSave}
              isSaving={isSaving}
            />
          </div>

          {/* Timeline Card */}
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Timeline
            </p>
            <IntentionTimeline events={intention.timeline} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

function EditableTitle({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-2xl font-bold tracking-tight h-auto py-1 mb-2"
    />
  );
}

function EditableSelectRow({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[120px] h-7 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function DetailRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <span className="font-medium truncate max-w-[60%] text-right">
        {value}
      </span>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
