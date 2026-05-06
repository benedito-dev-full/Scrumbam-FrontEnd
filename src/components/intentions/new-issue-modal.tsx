"use client";

import { forwardRef, useEffect, useState } from "react";
import {
  X,
  Maximize2,
  CircleDashed,
  MoreHorizontal,
  User as UserIcon,
  Box,
  Tag,
  Paperclip,
  Loader2,
  ChevronRight,
  Play,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/use-auth";
import { useOrgMembers } from "@/lib/hooks/use-organization";
import { useProjects } from "@/lib/hooks/use-projects";
import { useCreateIntention } from "@/lib/hooks/use-intentions";
import { TYPE_IDS, PRIORITY_IDS } from "@/types/intention";
import { cn } from "@/lib/utils";

type StatusKey = "backlog" | "todo" | "inProgress" | "done" | "canceled";

const STATUS_OPTIONS: {
  key: StatusKey;
  label: string;
  iconClass: string;
}[] = [
  { key: "backlog", label: "Backlog", iconClass: "text-amber-500" },
  { key: "todo", label: "Todo", iconClass: "text-zinc-400" },
  { key: "inProgress", label: "In Progress", iconClass: "text-amber-400" },
  { key: "done", label: "Done", iconClass: "text-emerald-500" },
  { key: "canceled", label: "Canceled", iconClass: "text-zinc-500" },
];

type PriorityKey = "none" | "urgent" | "high" | "medium" | "low";

const PRIORITY_OPTIONS: {
  key: PriorityKey;
  label: string;
  symbol: string;
  bg: string;
  id: string;
}[] = [
  { key: "none", label: "No priority", symbol: "—", bg: "bg-muted", id: PRIORITY_IDS.MEDIUM },
  { key: "urgent", label: "Urgent", symbol: "!", bg: "bg-red-500", id: PRIORITY_IDS.URGENT },
  { key: "high", label: "High", symbol: "▲", bg: "bg-orange-500", id: PRIORITY_IDS.HIGH },
  { key: "medium", label: "Medium", symbol: "=", bg: "bg-amber-500", id: PRIORITY_IDS.MEDIUM },
  { key: "low", label: "Low", symbol: "▽", bg: "bg-zinc-500", id: PRIORITY_IDS.LOW },
];

interface NewIssueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-selecionar projeto (vindo de /intentions/[projectId]) */
  defaultProjectId?: string;
}

const MIN_DESCRIPTION_LENGTH = 20;

export function NewIssueModal({
  open,
  onOpenChange,
  defaultProjectId,
}: NewIssueModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { data: members } = useOrgMembers(user?.orgId);
  const { data: projects } = useProjects();
  const createIntention = useCreateIntention();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<StatusKey>("backlog");
  const [priority, setPriority] = useState<PriorityKey>("none");
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
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
    setStatus("backlog");
    setPriority("none");
    setAssigneeId(null);
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

    createIntention.mutate({
      title: title.trim(),
      description: description.trim(),
      taskTypeId: TYPE_IDS.FEATURE,
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
  const assignee = members?.find((m) => m.id === assigneeId) ?? null;
  const statusOpt = STATUS_OPTIONS.find((s) => s.key === status)!;
  const priorityOpt = PRIORITY_OPTIONS.find((p) => p.key === priority)!;

  const teamLabel = (user?.orgNome || "DEV").slice(0, 4).toUpperCase();

  // Quick suggestion: current user as assignee
  const suggestion = members?.find((m) => m.id === user?.entidadeId) ?? null;

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
            <span className="font-medium">New issue</span>
          </DialogTitle>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled
              title="Expand (em breve)"
              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground/40 cursor-not-allowed"
              aria-label="Expand"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-auto px-5 py-4 space-y-3">
          {/* Title */}
          <Input
            placeholder="Issue title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            className="h-9 text-[16px] font-semibold border-0 bg-transparent px-0 focus-visible:ring-0 shadow-none placeholder:text-muted-foreground/50"
          />

          {/* Description */}
          <Textarea
            placeholder="Add description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="text-[13px] border-0 bg-transparent px-0 focus-visible:ring-0 shadow-none resize-none placeholder:text-muted-foreground/50 min-h-[80px]"
          />
          {!descriptionOk && (
            <p className="text-[11px] text-destructive">
              Min {MIN_DESCRIPTION_LENGTH} chars (
              {description.trim().length}/{MIN_DESCRIPTION_LENGTH})
            </p>
          )}

          {/* Quick suggestions */}
          {suggestion && (
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Sparkles className="h-3 w-3" />
                Quick suggestions
              </div>
              <button
                type="button"
                onClick={() => setAssigneeId(suggestion.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md border border-dashed px-2 py-0.5 text-[12px] transition-colors",
                  assigneeId === suggestion.id
                    ? "border-cyan-500 bg-cyan-500/10 text-cyan-300"
                    : "border-border hover:border-foreground/30",
                )}
              >
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[9px] font-medium text-white">
                  {initials(suggestion.name)}
                </span>
                {suggestion.name.split(" ")[0]}
              </button>
            </div>
          )}

          {/* Properties chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border">
            {/* Status */}
            <Popover>
              <PopoverTrigger asChild>
                <Chip
                  active
                  icon={CircleDashed}
                  iconClass={statusOpt.iconClass}
                  label={statusOpt.label}
                />
              </PopoverTrigger>
              <PopoverContent align="start" className="w-44 p-1">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setStatus(s.key)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded px-2 py-1.5 text-[12px] hover:bg-accent transition-colors",
                      status === s.key && "bg-accent",
                    )}
                  >
                    <CircleDashed className={cn("h-3.5 w-3.5", s.iconClass)} />
                    {s.label}
                  </button>
                ))}
                <p className="mt-1 px-2 py-1 text-[10px] text-muted-foreground/60 border-t border-border">
                  Backend usa workflow V3
                </p>
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

            {/* Assignee */}
            <Popover>
              <PopoverTrigger asChild>
                <Chip
                  active={!!assignee}
                  icon={UserIcon}
                  label={assignee ? assignee.name.split(" ")[0] : "Assignee"}
                />
              </PopoverTrigger>
              <PopoverContent align="start" className="w-56 p-1 max-h-64 overflow-auto">
                <button
                  type="button"
                  onClick={() => setAssigneeId(null)}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-[12px] hover:bg-accent transition-colors"
                >
                  <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  No assignee
                </button>
                {(members ?? []).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setAssigneeId(m.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded px-2 py-1.5 text-[12px] hover:bg-accent transition-colors",
                      assigneeId === m.id && "bg-accent",
                    )}
                  >
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[9px] font-medium text-white">
                      {initials(m.name)}
                    </span>
                    <span className="truncate">{m.name}</span>
                  </button>
                ))}
                <p className="mt-1 px-2 py-1 text-[10px] text-muted-foreground/60 border-t border-border">
                  Nao persiste — DTO incompleto
                </p>
              </PopoverContent>
            </Popover>

            {/* Project (required) */}
            <Popover>
              <PopoverTrigger asChild>
                <Chip
                  active={!!project}
                  icon={Box}
                  label={project ? project.nome : "Project"}
                />
              </PopoverTrigger>
              <PopoverContent align="start" className="w-56 p-1 max-h-64 overflow-auto">
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

            {/* Labels (stub) */}
            <Chip
              icon={Tag}
              label="Labels"
              disabled
              hint="Em breve — gap #14"
            />

            {/* More menu */}
            <Chip icon={MoreHorizontal} label="" disabled hint="Em breve" />
          </div>
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between gap-3 border-t border-border px-5 py-3">
          <button
            type="button"
            disabled
            title="Anexos — gap #39"
            className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground/40 cursor-not-allowed"
            aria-label="Attach"
          >
            <Paperclip className="h-3.5 w-3.5" />
          </button>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground select-none cursor-pointer">
              <Switch
                checked={createMore}
                onCheckedChange={setCreateMore}
                className="scale-75"
              />
              Create more
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
                  Creating...
                </>
              ) : (
                "Create issue"
              )}
            </Button>
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Chip primitive (reused pattern from new-project-modal)
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

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
