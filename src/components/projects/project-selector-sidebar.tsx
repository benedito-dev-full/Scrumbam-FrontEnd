"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CircleDot,
  Folder,
  FolderOpen,
  ListChecks,
  MoreHorizontal,
  Plus,
  Settings2,
  Users,
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
import { isNavItemActive } from "@/lib/navigation";

type SubItem = {
  hrefSuffix: string;
  label: string;
  icon: typeof CircleDot;
};

const subItems: SubItem[] = [
  { hrefSuffix: "", label: "Issues", icon: CircleDot },
  { hrefSuffix: "/members", label: "Membros", icon: Users },
];

/**
 * Seletor de projetos da sidebar — fica no TOPO da hierarquia.
 *
 * Visual segue padrao ClickUp:
 *  - Header com icone de pasta, label "Projetos", menu "..." e botao "+".
 *  - Cada projeto: icone de checklist, nome, contagem de tasks a direita.
 *  - Projeto "selecionado" derivado da URL (`/projects/[id]`) — sem store.
 *  - Sub-itens (Issues, Membros) aparecem apenas para o projeto ativo.
 */
export function ProjectSelectorSidebar() {
  const pathname = usePathname();
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
    <div className="mt-3">
      {/* Header — clique no titulo/icone alterna expand/collapse */}
      <div className="group/header flex items-center gap-1 px-2 py-1">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex flex-1 items-center gap-1.5 text-left text-foreground/85 hover:text-foreground transition-colors"
          aria-expanded={expanded}
          aria-controls="sidebar-projects-list"
        >
          {expanded ? (
            <FolderOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <Folder className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
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
        <ul id="sidebar-projects-list" className="space-y-px px-2">
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

                {/* Sub-itens — so para o projeto ativo */}
                {selected && (
                  <ul className="ml-2 mt-px space-y-px border-l border-sidebar-border pl-2">
                    {subItems.map((item) => {
                      const href = `${projectHref}${item.hrefSuffix}`;
                      const active = isNavItemActive(
                        pathname,
                        href,
                        item.hrefSuffix === "",
                      );
                      const Icon = item.icon;
                      return (
                        <li key={href}>
                          <Link
                            href={href}
                            className={cn(
                              "flex items-center gap-2 rounded-md px-2 py-1 text-[13px] transition-colors",
                              active
                                ? "bg-sidebar-accent text-sidebar-foreground font-medium"
                                : "text-foreground/85 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
                            )}
                          >
                            <Icon className="h-3.5 w-3.5 shrink-0" />
                            <span className="flex-1 truncate">
                              {item.label}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
