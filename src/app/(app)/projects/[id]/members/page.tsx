"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";

import { PageTransition } from "@/components/common/page-transition";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { useProject } from "@/lib/hooks/use-projects";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Pagina de membros de um projeto especifico.
 *
 * Estado atual: placeholder. O backend V2 ainda nao expoe um endpoint
 * `/projects/:id/members` proprio — o detalhe de membros vive em DVincula
 * mas nao ha agregacao publica. Por enquanto, mostramos o nome do projeto
 * e um link para gerir membros pelo time vinculado (se houver) ou pelo
 * workspace.
 *
 * TODO (backend V2): expor endpoint dedicado de membros do projeto.
 * Ver LINEAR_PIVOT_GAPS.md.
 */
export default function ProjectMembersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: project, isLoading } = useProject(id);

  usePageTitle(
    project?.nome ? `Membros · ${project.nome}` : "Membros do projeto",
  );

  return (
    <PageTransition>
      <div className="px-8 py-8">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Breadcrumb */}
          <Link
            href={`/projects/${id}`}
            className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar ao projeto
          </Link>

          {/* Header */}
          <header>
            {isLoading ? (
              <Skeleton className="h-7 w-64" />
            ) : (
              <h1 className="text-2xl font-semibold tracking-tight">
                {project?.nome ?? "Projeto"}
                <span className="ml-2 text-base font-normal text-muted-foreground">
                  · Membros
                </span>
              </h1>
            )}
            <p className="text-[13px] text-muted-foreground mt-1">
              Pessoas com acesso a este projeto.
            </p>
          </header>

          {/* Placeholder ate o backend V2 expor o endpoint dedicado */}
          <section className="rounded-lg border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-[14px] font-medium">
              Detalhe de membros em construcao
            </p>
            <p className="mx-auto mt-2 max-w-md text-[12px] text-muted-foreground">
              A lista completa de membros do projeto sera exibida aqui assim que
              o backend V2 expuser o endpoint dedicado. Por enquanto, gerencie
              membros pelos times vinculados.
            </p>
            <Link
              href="/teams"
              className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-[12px] font-medium text-foreground/85 hover:bg-accent hover:text-foreground transition-colors"
            >
              <Users className="h-3.5 w-3.5" />
              Ir para Times
            </Link>
          </section>
        </div>
      </div>
    </PageTransition>
  );
}
