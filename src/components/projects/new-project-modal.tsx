"use client";

import { forwardRef, useState } from "react";
import {
  X,
  Box,
  CircleDashed,
  MoreHorizontal,
  User as UserIcon,
  Users,
  Calendar,
  Tag,
  GitMerge,
  Plus,
  Loader2,
  ChevronRight,
  Play,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/use-auth";
import { useOrgMembers } from "@/lib/hooks/use-organization";
import { projectsApi } from "@/lib/api/projects";
import { QUERY_KEYS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type StatusKey = "backlog" | "planned" | "inProgress" | "completed" | "canceled";
type PriorityKey = "none" | "urgent" | "high" | "medium" | "low";

const STATUS_OPTIONS: {
  key: StatusKey;
  label: string;
  iconClass: string;
}[] = [
  { key: "backlog", label: "Backlog", iconClass: "text-amber-500" },
  { key: "planned", label: "Planned", iconClass: "text-zinc-400" },
  { key: "inProgress", label: "In Progress", iconClass: "text-amber-400" },
  { key: "completed", label: "Completed", iconClass: "text-violet-500" },
  { key: "canceled", label: "Canceled", iconClass: "text-zinc-500" },
];

const PRIORITY_OPTIONS: {
  key: PriorityKey;
  label: string;
  symbol: string;
  bg: string;
}[] = [
  { key: "none", label: "No priority", symbol: "—", bg: "bg-muted" },
  { key: "urgent", label: "Urgent", symbol: "!", bg: "bg-red-500" },
  { key: "high", label: "High", symbol: "▲", bg: "bg-orange-500" },
  { key: "medium", label: "Medium", symbol: "=", bg: "bg-amber-500" },
  { key: "low", label: "Low", symbol: "▽", bg: "bg-zinc-500" },
];

interface NewProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewProjectModal({ open, onOpenChange }: NewProjectModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: members } = useOrgMembers(user?.orgId);

  // Form state
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<StatusKey>("backlog");
  const [priority, setPriority] = useState<PriorityKey>("none");
  const [leadId, setLeadId] = useState<string | null>(null);
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<string>("");
  const [targetDate, setTargetDate] = useState<string>("");

  const createMutation = useMutation({
    mutationFn: () =>
      projectsApi.create({
        nome: name.trim(),
        descricao: summary.trim() || description.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects });
      toast.success("Project created");
      reset();
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Erro ao criar project");
    },
  });

  const reset = () => {
    setName("");
    setSummary("");
    setDescription("");
    setStatus("backlog");
    setPriority("none");
    setLeadId(null);
    setMemberIds([]);
    setStartDate("");
    setTargetDate("");
  };

  const handleCancel = () => {
    reset();
    onOpenChange(false);
  };

  const lead = members?.find((m) => m.id === leadId) ?? null;
  const selectedMembers = (members ?? []).filter((m) =>
    memberIds.includes(m.id),
  );
  const statusOpt = STATUS_OPTIONS.find((s) => s.key === status)!;
  const priorityOpt = PRIORITY_OPTIONS.find((p) => p.key === priority)!;

  const teamLabel = (user?.orgNome || "DEV").slice(0, 4).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-2xl p-0 gap-0 max-h-[85vh] overflow-hidden border-border"
      >
        {/* Header */}
        <header className="flex items-center justify-between px-5 py-3 border-b border-border">
          <DialogTitle className="flex items-center gap-1.5 text-[13px]">
            <span className="flex items-center gap-1.5 rounded px-1.5 py-0.5 bg-emerald-500/15 text-emerald-300 text-[12px] font-medium">
              <Play className="h-3 w-3 fill-emerald-400" />
              {teamLabel}
            </span>
            <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
            <span className="font-medium">New project</span>
          </DialogTitle>
          <button
            type="button"
            onClick={handleCancel}
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-auto px-5 py-4 space-y-4">
          {/* Project icon (stub — sem campo no schema) */}
          <button
            type="button"
            disabled
            title="Icone do project (em breve)"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card cursor-not-allowed"
          >
            <Box className="h-4 w-4 text-muted-foreground" />
          </button>

          {/* Name */}
          <Input
            placeholder="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            className="h-10 text-[18px] font-semibold border-0 bg-transparent px-0 focus-visible:ring-0 shadow-none placeholder:text-muted-foreground/50"
          />

          {/* Summary */}
          <Input
            placeholder="Add a short summary..."
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="h-7 text-[13px] border-0 bg-transparent px-0 focus-visible:ring-0 shadow-none placeholder:text-muted-foreground/50"
          />

          {/* Properties chips row */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
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
              <PopoverContent
                align="start"
                className="w-44 p-1"
              >
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
                  Nao persiste — gap #37
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
                <p className="mt-1 px-2 py-1 text-[10px] text-muted-foreground/60 border-t border-border">
                  Nao persiste — gap #5
                </p>
              </PopoverContent>
            </Popover>

            {/* Lead */}
            <Popover>
              <PopoverTrigger asChild>
                <Chip
                  active={!!lead}
                  icon={UserIcon}
                  label={lead ? lead.name.split(" ")[0] : "Lead"}
                />
              </PopoverTrigger>
              <PopoverContent align="start" className="w-56 p-1">
                <button
                  type="button"
                  onClick={() => setLeadId(null)}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-[12px] hover:bg-accent transition-colors"
                >
                  <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  No lead
                </button>
                {(members ?? []).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setLeadId(m.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded px-2 py-1.5 text-[12px] hover:bg-accent transition-colors",
                      leadId === m.id && "bg-accent",
                    )}
                  >
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[9px] font-medium text-white">
                      {initials(m.name)}
                    </span>
                    <span className="truncate">{m.name}</span>
                  </button>
                ))}
              </PopoverContent>
            </Popover>

            {/* Members */}
            <Popover>
              <PopoverTrigger asChild>
                <Chip
                  active={selectedMembers.length > 0}
                  icon={Users}
                  label={
                    selectedMembers.length === 0
                      ? "Members"
                      : `${selectedMembers.length} member${selectedMembers.length > 1 ? "s" : ""}`
                  }
                />
              </PopoverTrigger>
              <PopoverContent align="start" className="w-56 p-1 max-h-64 overflow-auto">
                {(members ?? []).map((m) => {
                  const checked = memberIds.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() =>
                        setMemberIds((ids) =>
                          checked
                            ? ids.filter((i) => i !== m.id)
                            : [...ids, m.id],
                        )
                      }
                      className={cn(
                        "flex w-full items-center gap-2 rounded px-2 py-1.5 text-[12px] hover:bg-accent transition-colors",
                        checked && "bg-accent",
                      )}
                    >
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[9px] font-medium text-white">
                        {initials(m.name)}
                      </span>
                      <span className="flex-1 truncate text-left">{m.name}</span>
                      {checked && (
                        <span className="text-[10px] text-cyan-400">✓</span>
                      )}
                    </button>
                  );
                })}
              </PopoverContent>
            </Popover>

            {/* Start date */}
            <DateChip
              icon={Calendar}
              label="Start"
              value={startDate}
              onChange={setStartDate}
            />

            {/* Target date */}
            <DateChip
              icon={Calendar}
              label="Target"
              value={targetDate}
              onChange={setTargetDate}
            />

            {/* Labels (stub) */}
            <Chip
              icon={Tag}
              label="Labels"
              disabled
              hint="Em breve — gap #14"
            />

            {/* Dependencies (stub) */}
            <Chip
              icon={GitMerge}
              label="Dependencies"
              disabled
              hint="Em breve — gap #38"
            />
          </div>

          {/* Description */}
          <Textarea
            placeholder="Write a description, a project brief, or collect ideas..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            className="text-[13px] border-0 bg-transparent px-0 focus-visible:ring-0 shadow-none resize-none placeholder:text-muted-foreground/50"
          />

          {/* Milestones (stub) */}
          <div className="flex items-center justify-between rounded-md border border-dashed border-border px-3 py-2.5">
            <span className="text-[13px] text-muted-foreground">
              Milestones
            </span>
            <button
              type="button"
              disabled
              title="Em breve — gap #11"
              className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground/40 cursor-not-allowed"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between gap-3 border-t border-border px-5 py-3">
          <p className="text-[11px] text-muted-foreground/70">
            Backend persiste apenas <code>name</code> e <code>summary</code>.
            Demais campos serao salvos quando o backend ampliar o DTO.
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="text-[12px] h-8"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => createMutation.mutate()}
              disabled={!name.trim() || createMutation.isPending}
              className="text-[12px] h-8 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create project"
              )}
            </Button>
          </div>
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
      <span>{label}</span>
    </button>
  );
});

// ============================================================
// Date chip (popover with native date input)
// ============================================================

function DateChip({
  icon: Icon,
  label,
  value,
  onChange,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const display = value
    ? new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : label;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Chip icon={Icon} label={display} active={!!value} />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-2">
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="rounded border border-border bg-card px-2 py-1 text-[12px]"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="ml-2 text-[11px] text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
