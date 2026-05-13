"use client";

import Link from "next/link";
import { ChevronRight, FolderGit2, Plug } from "lucide-react";

import { useAgentLinkedProjects } from "@/lib/hooks/use-agent-env";

/**
 * Lista projetos vinculados a esta VPS (DVincula -185). Endpoint
 * pré-existente `GET /agents/:id/projects`. Cada item linka para
 * `/projects/:id/automation`.
 */
export function LinkedProjectsPanel({ agentId }: { agentId: string }) {
  const { data, isLoading } = useAgentLinkedProjects(agentId);
  const projects = data?.projects ?? [];

  return (
    <section className="rounded-md border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/40">
        <h2 className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
          <Plug className="h-3.5 w-3.5" />
          Projetos vinculados
        </h2>
        {!isLoading && projects.length > 0 && (
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {projects.length}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="px-4 py-3">
          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
        </div>
      ) : projects.length === 0 ? (
        <div className="px-4 py-4 space-y-2">
          <p className="text-[13px] text-muted-foreground">
            Esta VPS não está vinculada a nenhum projeto.
          </p>
          <p className="text-[12px] text-muted-foreground/70">
            Vincule em{" "}
            <code className="text-[11px]">/projects/:id/automation</code> no
            projeto desejado.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {projects.map((p) => (
            <li key={p.projectId}>
              <Link
                href={`/projects/${p.projectId}/automation`}
                className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-card/60 transition-colors group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FolderGit2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-[13px] truncate">{p.nome}</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0 group-hover:text-muted-foreground transition-colors" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
