"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2 } from "lucide-react";

import { PageTransition } from "@/components/common/page-transition";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { useCreateIntention } from "@/lib/hooks/use-intentions";
import { useProjects } from "@/lib/hooks/use-projects";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TYPE_IDS, PRIORITY_IDS } from "@/types/intention";
import type { IntentionType, IntentionPriority } from "@/types/intention";
import { cn } from "@/lib/utils";

/**
 * @deprecated Mantido apenas para compatibilidade com wizard-step-*.tsx.
 */
export interface WizardFormData {
  title: string;
  problema: string;
  contexto: string;
  solucaoProposta: string;
  criteriosAceite: string[];
  naoObjetivos: string[];
  riscos: string[];
  type: IntentionType;
  priority: IntentionPriority;
  apetiteDias: number;
}

const TASK_TYPES = [
  { id: TYPE_IDS.FEATURE, label: "Feature" },
  { id: TYPE_IDS.BUG, label: "Bug" },
  { id: TYPE_IDS.IMPROVEMENT, label: "Improvement" },
] as const;

const PRIORITIES = [
  { id: PRIORITY_IDS.URGENT, label: "Urgent" },
  { id: PRIORITY_IDS.HIGH, label: "High" },
  { id: PRIORITY_IDS.MEDIUM, label: "Medium" },
  { id: PRIORITY_IDS.LOW, label: "Low" },
] as const;

const MIN_DESCRIPTION_LENGTH = 20;

export function IntentionWizard() {
  usePageTitle("New issue");
  const router = useRouter();
  const createIntention = useCreateIntention();
  const { data: projects, isLoading: isLoadingProjects } = useProjects();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [taskTypeId, setTaskTypeId] = useState<string>(TYPE_IDS.FEATURE);
  const [priorityId, setPriorityId] = useState<string>(PRIORITY_IDS.MEDIUM);
  const [projectId, setProjectId] = useState<string>("");

  useEffect(() => {
    if (projects && projects.length > 0 && !projectId) {
      setProjectId(projects[0].chave);
    }
  }, [projects, projectId]);

  const descriptionTooShort =
    description.trim().length > 0 &&
    description.trim().length < MIN_DESCRIPTION_LENGTH;

  const canSubmit =
    title.trim().length > 0 &&
    description.trim().length >= MIN_DESCRIPTION_LENGTH &&
    projectId.length > 0;

  const handleCreate = async () => {
    if (!canSubmit) return;
    await createIntention.mutate({
      title: title.trim(),
      description: description.trim(),
      taskTypeId,
      priorityId,
      projectId,
    });
    router.push("/intentions");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (
      (e.ctrlKey || e.metaKey) &&
      e.key === "Enter" &&
      canSubmit &&
      !createIntention.isPending
    ) {
      e.preventDefault();
      handleCreate();
    }
  };

  const isSaving = createIntention.isPending;

  return (
    <PageTransition className="h-full">
      <div className="flex h-full flex-col">
        {/* Top breadcrumb */}
        <header className="flex h-11 shrink-0 items-center px-8 border-b border-border">
          <button
            type="button"
            onClick={() => router.push("/intentions")}
            className="flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Issues
          </button>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-auto">
          <div className="px-8 py-8">
            <div
              className="mx-auto max-w-2xl space-y-6"
              onKeyDown={handleKeyDown}
            >
              <div className="space-y-1.5">
                <h1 className="text-2xl font-semibold tracking-tight">
                  New issue
                </h1>
                <p className="text-[13px] text-muted-foreground">
                  Describe what needs to happen. Press{" "}
                  <kbd className="rounded border border-border bg-muted px-1 text-[11px]">
                    Cmd+Enter
                  </kbd>{" "}
                  to submit.
                </p>
              </div>

              {/* Title — large input, Linear-style "issue creation" */}
              <Input
                placeholder="Issue title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                className="h-12 text-[18px] font-medium border-0 bg-transparent px-0 focus-visible:ring-0 focus-visible:border-0 shadow-none"
              />

              {/* Description */}
              <div className="space-y-1.5">
                <Textarea
                  placeholder="Add a description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  className="text-[14px] border-0 bg-transparent px-0 focus-visible:ring-0 shadow-none resize-none"
                />
                {descriptionTooShort && (
                  <p className="text-[12px] text-destructive">
                    Minimum {MIN_DESCRIPTION_LENGTH} characters (
                    {description.trim().length}/{MIN_DESCRIPTION_LENGTH})
                  </p>
                )}
              </div>

              {/* Inline meta chips (project, type, priority) */}
              <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
                <ChipSelect
                  label="Project"
                  value={projectId}
                  onChange={setProjectId}
                  disabled={isLoadingProjects}
                  options={(projects ?? []).map((p) => ({
                    value: p.chave,
                    label: p.nome,
                  }))}
                  required
                />
                <ChipSelect
                  label="Type"
                  value={taskTypeId}
                  onChange={setTaskTypeId}
                  options={TASK_TYPES.map((t) => ({
                    value: t.id,
                    label: t.label,
                  }))}
                />
                <ChipSelect
                  label="Priority"
                  value={priorityId}
                  onChange={setPriorityId}
                  options={PRIORITIES.map((p) => ({
                    value: p.id,
                    label: p.label,
                  }))}
                />
              </div>

              {/* Submit footer */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <span className="text-[11px] text-muted-foreground">
                  Cmd/Ctrl + Enter to submit
                </span>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={!canSubmit || isSaving}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-opacity",
                    canSubmit && !isSaving
                      ? "bg-foreground text-background hover:opacity-90"
                      : "bg-muted text-muted-foreground cursor-not-allowed",
                  )}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create issue"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

// ============================================================
// Linear-style inline chip select
// ============================================================

interface ChipSelectProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  required?: boolean;
}

function ChipSelect({
  label,
  value,
  onChange,
  options,
  disabled,
  required,
}: ChipSelectProps) {
  return (
    <div className="flex items-center gap-1.5">
      <Label className="text-[12px] text-muted-foreground">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="h-7 min-w-[120px] text-[12px] bg-card border-border">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem
              key={opt.value}
              value={opt.value}
              className="text-[12px]"
            >
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
