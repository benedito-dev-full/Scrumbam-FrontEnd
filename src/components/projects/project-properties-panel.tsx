"use client";

import { useEffect, useRef, useState } from "react";
import { X, Pencil, Loader2, Copy, Check } from "lucide-react";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useMyTeams } from "@/lib/hooks/use-teams";
import { useUpdateProject } from "@/lib/hooks/use-projects";
import { cn } from "@/lib/utils";
import type { Project, ProjectDetail } from "@/types";
import type { Team } from "@/types/team";

const NO_TEAM_VALUE = "__none__";

/**
 * Shape minimo aceito pelo painel. `useProject` retorna `ProjectDetail`
 * (que omite `taskCount`/`teamId` no tipo, mas inclui em runtime via `mapProject`).
 * Aceitamos a uniao para permitir uso em ambos os caminhos.
 */
type ProjectLike =
  | Project
  | (ProjectDetail & { taskCount?: number; teamId?: string | null });

interface ProjectPropertiesPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectLike | undefined;
}

/**
 * Painel lateral (Sheet) de propriedades do projeto.
 *
 * Aberto via botao "Propriedades" no header da pagina /projects/[id].
 * Edicao inline com hover-to-reveal lapis (apenas ADMIN).
 *
 * Editaveis: nome, descricao, time, dataInicio.
 * Read-only: chave (id), responsavel.nome, criadoEm (pt-BR), taskCount.
 *
 * Reusa `useUpdateProject` (PATCH /projects/:id). Toasts de sucesso/erro
 * sao disparados pelo hook. Cada save aguarda resposta (nao otimista) e
 * mostra spinner ao lado do campo durante a mutation.
 */
export function ProjectPropertiesPanel({
  open,
  onOpenChange,
  project,
}: ProjectPropertiesPanelProps) {
  const userRole = useAuthStore((s) => s.user?.role);
  const isAdmin = userRole?.toUpperCase() === "ADMIN";

  const { data: teams } = useMyTeams();
  const updateMutation = useUpdateProject();

  // Track qual campo esta sofrendo save (para spinner localizado)
  const [savingField, setSavingField] = useState<string | null>(null);

  if (!project) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          responsive
          showCloseButton={false}
          className="sm:w-[420px] sm:max-w-[420px] p-0 gap-0"
        >
          <SheetTitle className="sr-only">Propriedades do projeto</SheetTitle>
          <PanelHeader onClose={() => onOpenChange(false)} />
          <div className="flex-1 overflow-auto px-5 py-4">
            <p className="text-[12px] text-muted-foreground">Carregando...</p>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  const saveField = (
    field: string,
    dto: Parameters<typeof updateMutation.mutate>[0]["dto"],
  ) => {
    setSavingField(field);
    updateMutation.mutate(
      { id: project.chave, dto },
      {
        onSettled: () => setSavingField(null),
      },
    );
  };

  // Helpers de save por campo
  const saveName = (newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === project.nome) return;
    saveField("nome", { nome: trimmed });
  };

  const saveDescription = (newDesc: string) => {
    const trimmed = newDesc.trim();
    const current = project.descricao ?? "";
    if (trimmed === current) return;
    saveField("descricao", { descricao: trimmed });
  };

  const saveTeam = (newTeamId: string) => {
    const current = project.teamId ?? "";
    if (newTeamId === current) return;
    // "" representa "Sem time" → backend recebe null
    saveField("idTeam", { idTeam: newTeamId === "" ? null : newTeamId });
  };

  const saveStartDate = (newDate: string) => {
    const current = project.dataInicio
      ? project.dataInicio.slice(0, 10) // ISO → YYYY-MM-DD
      : "";
    if (newDate === current) return;
    saveField("startDate", { startDate: newDate });
  };

  const teamName = project.teamId
    ? (teams?.find((t: Team) => t.id === project.teamId)?.name ?? "—")
    : "Sem time";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        responsive
        showCloseButton={false}
        className="sm:w-[420px] sm:max-w-[420px] p-0 gap-0"
      >
        <SheetTitle className="sr-only">
          Propriedades de {project.nome}
        </SheetTitle>

        <PanelHeader onClose={() => onOpenChange(false)} />

        <div className="flex-1 overflow-auto">
          {/* Secao: Geral (campos editaveis) */}
          <Section title="Geral">
            <EditableField
              label="Nome"
              value={project.nome}
              type="text"
              disabled={!isAdmin}
              isSaving={savingField === "nome"}
              onSave={(v) => saveName(v ?? "")}
            />
            <EditableField
              label="Descricao"
              value={project.descricao ?? ""}
              type="textarea"
              disabled={!isAdmin}
              isSaving={savingField === "descricao"}
              onSave={(v) => saveDescription(v ?? "")}
              placeholder="Sem descricao"
            />
            <EditableField
              label="Time"
              value={project.teamId ?? ""}
              displayValue={teamName}
              type="team-select"
              teams={teams ?? []}
              disabled={!isAdmin}
              isSaving={savingField === "idTeam"}
              onSave={(v) => saveTeam(v ?? "")}
            />
            <EditableField
              label="Data de inicio"
              value={project.dataInicio ? project.dataInicio.slice(0, 10) : ""}
              displayValue={
                project.dataInicio
                  ? new Date(project.dataInicio).toLocaleDateString("pt-BR")
                  : "—"
              }
              type="date"
              disabled={!isAdmin}
              isSaving={savingField === "startDate"}
              onSave={(v) => saveStartDate(v ?? "")}
            />
          </Section>

          {/* Secao: Metadados (read-only) */}
          <Section title="Metadados">
            <ReadonlyField label="ID" value={project.chave} copyable mono />
            <ReadonlyField
              label="Responsavel"
              value={project.responsavel?.nome ?? "—"}
            />
            <ReadonlyField
              label="Criado em"
              value={new Date(project.criadoEm).toLocaleDateString("pt-BR")}
            />
            <ReadonlyField
              label="Total de tasks"
              value={String(project.taskCount)}
            />
          </Section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ============================================================
// Header com X custom (top-LEFT, conforme plano)
// ============================================================

function PanelHeader({ onClose }: { onClose: () => void }) {
  return (
    <header className="flex h-11 shrink-0 items-center gap-2 border-b border-border px-4">
      <button
        type="button"
        onClick={onClose}
        className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        aria-label="Fechar painel"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <span className="text-[13px] font-medium text-foreground">
        Propriedades
      </span>
    </header>
  );
}

// ============================================================
// Section wrapper
// ============================================================

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-border px-4 py-3">
      <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <dl className="space-y-1">{children}</dl>
    </section>
  );
}

// ============================================================
// EditableField — alterna entre display (com hover-lapis) e input
// ============================================================

interface EditableFieldProps {
  label: string;
  value: string;
  /** Texto exibido no modo display quando difere de `value` (ex: nome do time vs id). */
  displayValue?: string;
  onSave: (newValue: string | null) => void;
  disabled?: boolean;
  type: "text" | "textarea" | "date" | "team-select";
  teams?: Team[];
  isSaving?: boolean;
  placeholder?: string;
}

function EditableField({
  label,
  value,
  displayValue,
  onSave,
  disabled = false,
  type,
  teams = [],
  isSaving = false,
  placeholder,
}: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Quando entra em edicao, sincroniza draft com value e foca
  useEffect(() => {
    if (editing) {
      setDraft(value);
      // autofocus apos render
      setTimeout(() => {
        if (type === "textarea") {
          textareaRef.current?.focus();
          textareaRef.current?.select();
        } else if (type === "text" || type === "date") {
          inputRef.current?.focus();
          if (type === "text") inputRef.current?.select();
        }
      }, 0);
    }
  }, [editing, value, type]);

  // Quando value muda externamente (ex: apos save), sai do modo edicao
  useEffect(() => {
    if (!isSaving) {
      // mantem comportamento idempotente: se valor confirmado igual ao draft, fecha
      // (o save explicito ja chama setEditing(false))
    }
  }, [isSaving]);

  const commit = () => {
    onSave(draft);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      cancel();
      return;
    }
    if (type === "text" || type === "date") {
      if (e.key === "Enter") {
        e.preventDefault();
        commit();
      }
    } else if (type === "textarea") {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        commit();
      }
      // Enter normal: deixa quebrar linha
    }
  };

  const startEdit = () => {
    if (disabled || isSaving) return;
    setEditing(true);
  };

  const display = displayValue ?? value;
  const showPlaceholder = !display || display === "";

  // ---- Modo edicao ----
  if (editing) {
    if (type === "textarea") {
      return (
        <FieldRow label={label} isSaving={isSaving}>
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={handleKeyDown}
            disabled={isSaving}
            rows={3}
            className="w-full rounded-md bg-muted/40 px-2 py-1.5 text-[13px] text-foreground outline-none border border-border focus:bg-muted/60 focus:border-ring transition-colors resize-none disabled:opacity-50"
            placeholder={placeholder}
          />
        </FieldRow>
      );
    }

    if (type === "team-select") {
      return (
        <FieldRow label={label} isSaving={isSaving}>
          <Select
            value={draft || NO_TEAM_VALUE}
            onValueChange={(v) => {
              const newDraft = v === NO_TEAM_VALUE ? "" : v;
              setDraft(newDraft);
              // Para Select, salvamos imediatamente ao escolher
              onSave(newDraft === "" ? "" : newDraft);
              setEditing(false);
            }}
            open
            onOpenChange={(o) => {
              if (!o) {
                // fechado sem selecao: cancela
                setEditing(false);
                setDraft(value);
              }
            }}
          >
            <SelectTrigger className="h-8 text-[13px] bg-muted/40 border border-border">
              <SelectValue placeholder="Sem time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_TEAM_VALUE}>Sem time</SelectItem>
              {teams.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldRow>
      );
    }

    // text | date
    return (
      <FieldRow label={label} isSaving={isSaving}>
        <input
          ref={inputRef}
          type={type === "date" ? "date" : "text"}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          className="h-8 w-full rounded-md bg-muted/40 px-2 text-[13px] text-foreground outline-none border border-border focus:bg-muted/60 focus:border-ring transition-colors disabled:opacity-50"
          placeholder={placeholder}
        />
      </FieldRow>
    );
  }

  // ---- Modo display (com hover-lapis) ----
  return (
    <FieldRow label={label} isSaving={isSaving}>
      <button
        type="button"
        onClick={startEdit}
        disabled={disabled || isSaving}
        className={cn(
          "group flex w-full items-start justify-between gap-2 rounded-md px-2 py-1 text-left text-[13px] transition-colors",
          disabled
            ? "cursor-default text-foreground"
            : "hover:bg-accent cursor-text text-foreground",
        )}
        title={
          disabled
            ? "Apenas administradores podem editar"
            : "Clique para editar"
        }
      >
        <span
          className={cn(
            "min-w-0 break-words",
            type === "textarea" && "whitespace-pre-wrap",
            showPlaceholder && "text-muted-foreground/60",
          )}
        >
          {showPlaceholder ? (placeholder ?? "—") : display}
        </span>
        {!disabled && !isSaving && (
          <Pencil className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
        )}
      </button>
    </FieldRow>
  );
}

// ============================================================
// FieldRow — layout 80px label + valor + spinner
// ============================================================

function FieldRow({
  label,
  isSaving,
  children,
}: {
  label: string;
  isSaving?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2 py-1">
      <dt className="w-24 shrink-0 pt-1.5 text-[12px] text-muted-foreground">
        {label}
      </dt>
      <dd className="min-w-0 flex-1">
        <div className="flex items-start gap-1.5">
          <div className="min-w-0 flex-1">{children}</div>
          {isSaving && (
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground mt-1.5" />
          )}
        </div>
      </dd>
    </div>
  );
}

// ============================================================
// ReadonlyField — sem hover-lapis, sem click
// ============================================================

function ReadonlyField({
  label,
  value,
  copyable = false,
  mono = false,
}: {
  label: string;
  value: string;
  copyable?: boolean;
  mono?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // sem navigator.clipboard (raro em produção HTTPS); ignora
    }
  };

  return (
    <FieldRow label={label}>
      <div
        className={cn(
          "group flex items-start justify-between gap-2 px-2 py-1 text-[13px] text-foreground",
          mono && "font-mono",
        )}
      >
        <span className="min-w-0 break-all">{value}</span>
        {copyable && (
          <button
            type="button"
            onClick={handleCopy}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-accent hover:text-foreground transition-all mt-0.5"
            aria-label="Copiar"
            title={copied ? "Copiado!" : "Copiar"}
          >
            {copied ? (
              <Check className="h-3 w-3 text-emerald-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        )}
      </div>
    </FieldRow>
  );
}
