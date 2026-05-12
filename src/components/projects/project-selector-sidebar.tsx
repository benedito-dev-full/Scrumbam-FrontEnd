"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, CircleDot, Plus, Settings2, Users } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useProjects } from "@/lib/hooks/use-projects";
import { useAuthStore } from "@/lib/stores/auth-store";
import { isNavItemActive } from "@/lib/navigation";

const FALLBACK_COLOR = "#64748b";

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
 * Comportamento:
 *  - Lista projetos do workspace via `useProjects()`.
 *  - Projeto "selecionado" e derivado da URL (`/projects/[id]`) — sem store.
 *  - Sub-itens (Issues, Membros) aparecem apenas para o projeto ativo no path.
 *  - Botao "+" e atalho de gestao apontam para `/projects` (cria via dialog la).
 *
 * Substitui semanticamente o antigo `<TeamSelectorSidebar />` no topo da
 * sidebar. Times agora viraram conceito de "cargo/funcao" e ficam dentro
 * da secao Workspace.
 */
export function ProjectSelectorSidebar() {
  const pathname = usePathname();
  const { data: projects, isLoading } = useProjects();
  const userRole = useAuthStore((s) => s.user?.role);
  const isAdmin = userRole?.toUpperCase() === "ADMIN";

  const sortedProjects = useMemo(
    () => [...(projects ?? [])].sort((a, b) => a.nome.localeCompare(b.nome)),
    [projects],
  );

  // Detecta projeto ativo a partir da URL: /projects/<id> ou /projects/<id>/...
  const activeProjectId = useMemo(() => {
    const match = pathname.match(/^\/projects\/([^\/]+)/);
    return match ? match[1] : null;
  }, [pathname]);

  return (
    <div className="mt-3">
      {/* Header */}
      <div className="flex items-center gap-1 px-2 py-1">
        <span className="flex-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Projetos
        </span>
        <Link
          href="/projects"
          className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          aria-label="Gerenciar projetos"
          title="Gerenciar projetos"
        >
          <Settings2 className="h-3 w-3" />
        </Link>
        {isAdmin && (
          <Link
            href="/projects?new=1"
            className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
            aria-label="Novo projeto"
            title="Novo projeto"
          >
            <Plus className="h-3 w-3" />
          </Link>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-1 px-2">
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-3/4" />
        </div>
      )}

      {/* Empty */}
      {!isLoading && sortedProjects.length === 0 && (
        <div className="px-2 py-2 text-[12px] text-muted-foreground">
          Nenhum projeto disponivel.
        </div>
      )}

      {/* Lista de projetos */}
      {!isLoading && sortedProjects.length > 0 && (
        <ul className="space-y-px px-2">
          {sortedProjects.map((project) => {
            const selected = project.chave === activeProjectId;
            const initial = project.nome.charAt(0).toUpperCase();
            const projectHref = `/projects/${project.chave}`;
            return (
              <li key={project.chave}>
                <Link
                  href={projectHref}
                  className={cn(
                    "group flex items-center gap-2 rounded-md px-2 py-1 transition-colors",
                    selected
                      ? "bg-sidebar-accent text-sidebar-foreground"
                      : "text-foreground/85 hover:bg-sidebar-accent/70",
                  )}
                  aria-current={selected ? "page" : undefined}
                >
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white"
                    style={{ backgroundColor: FALLBACK_COLOR }}
                    aria-hidden
                  >
                    {initial || <Box className="h-3 w-3" />}
                  </span>
                  <span className="truncate text-[13px] font-medium">
                    {project.nome}
                  </span>
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
