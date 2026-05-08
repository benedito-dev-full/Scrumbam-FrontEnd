"use client";

import { forwardRef, useEffect, useState } from "react";
import {
  X,
  MoreHorizontal,
  Box,
  Loader2,
  ChevronRight,
  Play,
  Sparkles,
  Bug,
  TrendingUp,
  Eye,
  HelpCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/use-auth";
import { useProjects } from "@/lib/hooks/use-projects";
import { useCreateIntention } from "@/lib/hooks/use-intentions";
import { TYPE_IDS, PRIORITY_IDS } from "@/types/intention";
import { cn } from "@/lib/utils";

// ============================================================
// Tipos suportados pelo backend (CreateIntentionDto.taskTypeId)
// ============================================================

type TypeKey = "feature" | "bug" | "improvement" | "review" | "explain";

const TYPE_OPTIONS: {
  key: TypeKey;
  label: string;
  icon: LucideIcon;
  iconClass: string;
  id: string;
}[] = [
  {
    key: "feature",
    label: "Feature",
    icon: Sparkles,
    iconClass: "text-blue-500",
    id: TYPE_IDS.FEATURE,
  },
  {
    key: "bug",
    label: "Bug",
    icon: Bug,
    iconClass: "text-red-500",
    id: TYPE_IDS.BUG,
  },
  {
    key: "improvement",
    label: "Melhoria",
    icon: TrendingUp,
    iconClass: "text-violet-500",
    id: TYPE_IDS.IMPROVEMENT,
  },
  {
    key: "review",
    label: "Review",
    icon: Eye,
    iconClass: "text-amber-500",
    id: TYPE_IDS.REVIEW,
  },
  {
    key: "explain",
    label: "Explicar",
    icon: HelpCircle,
    iconClass: "text-orange-500",
    id: TYPE_IDS.EXPLAIN,
  },
];

// ============================================================
// Prioridades — todas persistem (PRIORITY_IDS)
// ============================================================

type PriorityKey = "none" | "urgent" | "high" | "medium" | "low";

const PRIORITY_OPTIONS: {
  key: PriorityKey;
  label: string;
  symbol: string;
  bg: string;
  id: string;
}[] = [
  {
    key: "none",
    label: "Sem prioridade",
    symbol: "—",
    bg: "bg-muted",
    id: PRIORITY_IDS.MEDIUM,
  },
  {
    key: "urgent",
    label: "Urgente",
    symbol: "!",
    bg: "bg-red-500",
    id: PRIORITY_IDS.URGENT,
  },
  {
    key: "high",
    label: "Alta",
    symbol: "▲",
    bg: "bg-orange-500",
    id: PRIORITY_IDS.HIGH,
  },
  {
    key: "medium",
    label: "Media",
    symbol: "=",
    bg: "bg-amber-500",
    id: PRIORITY_IDS.MEDIUM,
  },
  {
    key: "low",
    label: "Baixa",
    symbol: "▽",
    bg: "bg-zinc-500",
    id: PRIORITY_IDS.LOW,
  },
];

interface NewIssueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-selecionar projeto (vindo de /projects/[id]) */
  defaultProjectId?: string;
}

const MIN_DESCRIPTION_LENGTH = 20;

/**
 * Modal de criacao de issue.
 *
 * Backend persiste: title, description (>=20 chars), taskTypeId, priorityId,
 * projectId. So estes campos sao expostos — assignee/status/labels nao
 * persistem ainda e foram removidos para nao induzir ao erro.
 */
export function NewIssueModal({
  open,
  onOpenChange,
  defaultProjectId,
}: NewIssueModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { data: projects } = useProjects();
  const createIntention = useCreateIntention();

  // Form state — apenas os campos que persistem
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<TypeKey>("feature");
  const [priority, setPriority] = useState<PriorityKey>("none");
  const [projectId, setProjectId] = useState<string>(defaultProjectId ?? "");
  const [createMore, setCreateMore] = useState(false);

  useEffect(() => {
    if (defaultProjectId) {
      setProjectId(defaultProjectId);
    } else if (projects && projects.length > 0 && !projectId) {
      setProjectId(projects[0].chave);
    }
  }, [projects, defaultProjectId, projectId]);

  const reset = () => {
    setTitle("");
    setDescription("");
    setType("feature");
    setPriority("none");
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const descriptionOk =
    description.trim().length === 0 ||
    description.trim().length >= MIN_DESCRIPTION_LENGTH;

  const canSubmit =
    title.trim().length > 0 &&
    description.trim().length >= MIN_DESCRIPTION_LENGTH &&
    projectId.length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const priorityOpt = PRIORITY_OPTIONS.find((p) => p.key === priority)!;
    const typeOpt = TYPE_OPTIONS.find((t) => t.key === type)!;

    createIntention.mutate({
      title: title.trim(),
      description: description.trim(),
      taskTypeId: typeOpt.id,
      priorityId: priorityOpt.id,
      projectId,
    });

    if (createMore) {
      reset();
    } else {
      onOpenChange(false);
      router.refresh();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (
      (e.ctrlKey || e.metaKey) &&
      e.key === "Enter" &&
      canSubmit &&
      !createIntention.isPending
    ) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Derived
  const project = projects?.find((p) => p.chave === projectId) ?? null;
  const typeOpt = TYPE_OPTIONS.find((t) => t.key === type)!;
  const priorityOpt = PRIORITY_OPTIONS.find((p) => p.key === priority)!;

  const teamLabel = (user?.orgNome || "DEV").slice(0, 4).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-2xl p-0 gap-0 max-h-[85vh] overflow-hidden border-border"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-5 py-3 border-b border-border">
          <DialogTitle className="flex items-center gap-1.5 text-[13px]">
            <span className="flex items-center gap-1.5 rounded px-1.5 py-0.5 bg-emerald-500/15 text-emerald-300 text-[12px] font-medium">
              <Play className="h-3 w-3 fill-emerald-400" />
              {teamLabel}
            </span>
            <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
            <span className="font-medium">Nova issue</span>
          </DialogTitle>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-auto px-5 py-4 space-y-3">
          {/* Title */}
          <input
            type="text"
            placeholder="Titulo da issue"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            className="h-10 w-full rounded-md bg-muted/40 px-3 text-[16px] font-semibold text-foreground outline-none border-0 placeholder:text-muted-foreground/50 focus:bg-muted/60 transition-colors"
          />

          {/* Description */}
          <textarea
            placeholder="Descreva o problema, contexto, criterios de aceite..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="w-full rounded-md bg-muted/40 px-3 py-2 text-[13px] text-foreground outline-none border-0 placeholder:text-muted-foreground/50 focus:bg-muted/60 transition-colors resize-none min-h-[100px]"
          />
          {!descriptionOk && (
            <p className="text-[11px] text-destructive">
              Minimo {MIN_DESCRIPTION_LENGTH} caracteres (
              {description.trim().length}/{MIN_DESCRIPTION_LENGTH})
            </p>
          )}

          {/* Properties chips — somente campos que persistem */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border">
            {/* Type */}
            <Popover>
              <PopoverTrigger asChild>
                <Chip
                  active
                  icon={typeOpt.icon}
                  iconClass={typeOpt.iconClass}
                  label={typeOpt.label}
                />
              </PopoverTrigger>
              <PopoverContent align="start" className="w-44 p-1">
                {TYPE_OPTIONS.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setType(t.key)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded px-2 py-1.5 text-[12px] hover:bg-accent transition-colors",
                        type === t.key && "bg-accent",
                      )}
                    >
                      <Icon className={cn("h-3.5 w-3.5", t.iconClass)} />
                      {t.label}
                    </button>
                  );
                })}
              </PopoverContent>
            </Popover>

            {/* Priority */}
            <Popover>
              <PopoverTrigger asChild>
                <Chip
                  active={priority !== "none"}
                  icon={MoreHorizontal}
                  label={priorityOpt.label}
                />
              </PopoverTrigger>
              <PopoverContent align="start" className="w-44 p-1">
                {PRIORITY_OPTIONS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setPriority(p.key)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded px-2 py-1.5 text-[12px] hover:bg-accent transition-colors",
                      priority === p.key && "bg-accent",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-3.5 w-3.5 items-center justify-center rounded text-[9px] font-bold text-white",
                        p.bg,
                      )}
                    >
                      {p.symbol}
                    </span>
                    {p.label}
                  </button>
                ))}
              </PopoverContent>
            </Popover>

            {/* Project (required) */}
            <Popover>
              <PopoverTrigger asChild>
                <Chip
                  active={!!project}
                  icon={Box}
                  label={project ? project.nome : "Projeto"}
                />
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="w-56 p-1 max-h-64 overflow-auto"
              >
                {(projects ?? []).map((p) => (
                  <button
                    key={p.chave}
                    type="button"
                    onClick={() => setProjectId(p.chave)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded px-2 py-1.5 text-[12px] hover:bg-accent transition-colors",
                      projectId === p.chave && "bg-accent",
                    )}
                  >
                    <Box className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="truncate">{p.nome}</span>
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between gap-3 border-t border-border px-5 py-3">
          <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground select-none cursor-pointer">
            <Switch
              checked={createMore}
              onCheckedChange={setCreateMore}
              className="scale-75"
            />
            Criar mais
          </label>

          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!canSubmit || createIntention.isPending}
            className="text-[12px] h-8 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {createIntention.isPending ? (
              <>
                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                Criando...
              </>
            ) : (
              "Criar issue"
            )}
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Chip primitive
// ============================================================

interface ChipProps {
  icon: LucideIcon;
  label: string;
  iconClass?: string;
  active?: boolean;
  disabled?: boolean;
  hint?: string;
}

const Chip = forwardRef<
  HTMLButtonElement,
  ChipProps & React.ButtonHTMLAttributes<HTMLButtonElement>
>(function Chip(
  { icon: Icon, label, iconClass, active, disabled, hint, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      title={hint}
      {...rest}
      className={cn(
        "flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[12px] transition-colors",
        active
          ? "bg-accent text-foreground"
          : "bg-card text-muted-foreground hover:bg-accent/60 hover:text-foreground",
        disabled && "opacity-60 cursor-not-allowed",
      )}
    >
      <Icon className={cn("h-3.5 w-3.5 shrink-0", iconClass)} />
      {label && <span>{label}</span>}
    </button>
  );
});
