"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  ListChecks,
  MoreHorizontal,
  Plus,
  Settings2,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useProjects } from "@/lib/hooks/use-projects";
import { useAuthStore } from "@/lib/stores/auth-store";

/**
 * Seletor de projetos da sidebar — fica no TOPO da hierarquia.
 *
 * Visual segue padrao ClickUp:
 *  - Header com icone de pasta + chevron-on-hover, "..." e botao "+".
 *  - Cada projeto: icone de checklist, nome, contagem de tasks a direita.
 *  - Projeto "selecionado" derivado da URL (`/projects/[id]`) — sem store.
 *  - Sem sub-itens: clicar no projeto navega direto para o board.
 */
export function ProjectSelectorSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: projects, isLoading } = useProjects();
  const userRole = useAuthStore((s) => s.user?.role);
  const isAdmin = userRole?.toUpperCase() === "ADMIN";
  const [expanded, setExpanded] = useState(true);

  const sortedProjects = useMemo(
    () => [...(projects ?? [])].sort((a, b) => a.nome.localeCompare(b.nome)),
    [projects],
  );

  const activeProjectId = useMemo(() => {
    const match = pathname.match(/^\/projects\/([^\/]+)/);
    return match ? match[1] : null;
  }, [pathname]);

  return (
    <div className="mt-1">
      {/* Header — clique no titulo/icone alterna expand/collapse.
          No hover, o icone de pasta vira chevron (estilo ClickUp). */}
      <div className="group/header flex items-center gap-1 rounded-md px-2 py-1 transition-colors hover:bg-sidebar-accent/70">
        <button
          type="button"
          onClick={() => {
            setExpanded((v) => !v);
            router.push("/workspace");
          }}
          className="flex flex-1 items-center gap-1.5 text-left text-foreground/85 hover:text-foreground transition-colors"
          aria-expanded={expanded}
          aria-controls="sidebar-projects-list"
        >
          <span className="relative inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center">
            {/* Pasta — visivel por padrao, some no hover */}
            {expanded ? (
              <FolderOpen className="absolute h-3.5 w-3.5 text-muted-foreground transition-opacity group-hover/header:opacity-0" />
            ) : (
              <Folder className="absolute h-3.5 w-3.5 text-muted-foreground transition-opacity group-hover/header:opacity-0" />
            )}
            {/* Chevron — oculto por padrao, aparece no hover */}
            {expanded ? (
              <ChevronDown className="absolute h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover/header:opacity-100" />
            ) : (
              <ChevronRight className="absolute h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover/header:opacity-100" />
            )}
          </span>
          <span className="text-[13px] font-medium">Projetos</span>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground opacity-0 group-hover/header:opacity-100 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all"
              aria-label="Acoes de projetos"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem asChild className="text-[13px]">
              <Link href="/projects">
                <Settings2 className="mr-2 h-3.5 w-3.5" />
                Gerenciar projetos
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {isAdmin && (
          <Link
            href="/projects?new=1"
            className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
            aria-label="Novo projeto"
            title="Novo projeto"
          >
            <Plus className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      {/* Loading */}
      {expanded && isLoading && (
        <div className="space-y-1 px-2">
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-3/4" />
        </div>
      )}

      {/* Empty */}
      {expanded && !isLoading && sortedProjects.length === 0 && (
        <div className="px-2 py-2 text-[12px] text-muted-foreground">
          Nenhum projeto disponivel.
        </div>
      )}

      {/* Lista de projetos */}
      {expanded && !isLoading && sortedProjects.length > 0 && (
        <ul
          id="sidebar-projects-list"
          className="ml-3 space-y-px border-l border-sidebar-border/60 pl-1"
        >
          {sortedProjects.map((project) => {
            const selected = project.chave === activeProjectId;
            const projectHref = `/projects/${project.chave}`;
            return (
              <li key={project.chave}>
                <Link
                  href={projectHref}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1 transition-colors",
                    selected
                      ? "bg-sidebar-accent text-sidebar-foreground"
                      : "text-foreground/85 hover:bg-sidebar-accent/70",
                  )}
                  aria-current={selected ? "page" : undefined}
                >
                  <ListChecks className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate text-[13px]">
                    {project.nome}
                  </span>
                  {project.taskCount > 0 && (
                    <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                      {project.taskCount}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
