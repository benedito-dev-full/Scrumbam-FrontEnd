"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowRight,
  Box,
  ChevronDown,
  ChevronRight,
  Copy,
  GitBranch,
  Link2,
  MoreHorizontal,
  Trash2,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useIntention, useDeleteIntention } from "@/lib/hooks/use-intentions";
import { useProject } from "@/lib/hooks/use-projects";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import type { IntentionDocument } from "@/types/intention";

export type IssueDetailHeaderVariant = "page" | "modal";

interface IssueDetailHeaderProps {
  projectId: string;
  intentionId: string;
  variant?: IssueDetailHeaderVariant;
  /**
   * Optional callback fired after a successful delete. When provided it
   * overrides the default `router.push(/projects/{id})` behavior — useful in
   * the modal variant where the parent wants to close the dialog first.
   */
  onAfterDelete?: () => void;
  /** Modal-only: invoked when the user clicks the explicit close button. */
  onClose?: () => void;
}

export function IssueDetailHeader({
  projectId,
  intentionId,
  variant = "page",
  onAfterDelete,
  onClose,
}: IssueDetailHeaderProps) {
  const { data: intention } = useIntention(intentionId);
  const { data: project } = useProject(projectId);
  const router = useRouter();
  const { remove: removeIntention, isPending: isDeleting } =
    useDeleteIntention();

  const i = intention as
    | (IntentionDocument & { excluido?: boolean })
    | undefined;

  // Only the standalone page should drive the document title.
  usePageTitle(variant === "page" ? (i?.title ?? "Issue") : undefined);

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
      if (onAfterDelete) {
        onAfterDelete();
      } else {
        router.push(`/projects/${projectId}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir issue");
    }
  }

  const actions = (
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
      {variant === "modal" ? (
        <IconButton
          label="Abrir em pagina completa"
          onClick={() =>
            router.push(`/projects/${projectId}/issues/${intentionId}`)
          }
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </IconButton>
      ) : (
        <IconButton label="Abrir em nova aba">
          <ArrowRight className="h-3.5 w-3.5" />
        </IconButton>
      )}
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
      {variant === "modal" && (
        <IconButton label="Fechar" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </IconButton>
      )}
    </div>
  );

  if (variant === "modal") {
    return (
      <header className="flex h-11 shrink-0 items-center justify-between px-4 border-b border-border">
        <nav className="flex items-center gap-1.5 text-[13px] min-w-0">
          <Box className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground tabular-nums">{code}</span>
          <span className="font-medium truncate">{i?.title ?? "..."}</span>
        </nav>
        {actions}
      </header>
    );
  }

  return (
    <header className="flex h-11 shrink-0 items-center justify-between px-8 border-b border-border">
      <nav className="flex items-center gap-1.5 text-[13px] min-w-0">
        <Box className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <Link
          href={`/projects/${projectId}`}
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
      {actions}
    </header>
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
