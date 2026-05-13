"use client";

import { useState } from "react";
import { Check, Copy, Hash } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAgentLink } from "@/lib/hooks/use-automation";

interface ProjectSlugCardProps {
  projectId: string;
}

/**
 * Mostra o `projectSlug` canônico do projeto (auto-derivado de `project.nome`
 * no backend — ADR-V2-035) e fornece um snippet pronto para colar no
 * `~/.claude/CLAUDE.md` da VPS:
 *
 *     - <slug>: /home/dev/projetos/<slug>
 *
 * O backend NUNCA recebe o path absoluto (ADR-V2-030) — o agente resolve
 * localmente lendo o CLAUDE.md global. Esta caixinha é o único caminho do
 * operador para registrar onde o projeto está clonado na VPS.
 */
export function ProjectSlugCard({ projectId }: ProjectSlugCardProps) {
  const { data: link, isLoading } = useAgentLink(projectId);
  const [copied, setCopied] = useState(false);

  const slug = link?.projectSlug ?? null;
  const snippet = slug ? `- ${slug}: /home/dev/projetos/${slug}` : "";

  const handleCopy = async () => {
    if (!snippet) return;
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      toast.success("Linha copiada — cole no CLAUDE.md da VPS");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar. Selecione e copie manualmente.");
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-md border border-border bg-card p-4">
        <div className="h-5 w-40 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (!link?.agent) return null;

  return (
    <section className="rounded-md border border-border bg-card overflow-hidden">
      <header className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border bg-card/40">
        <div className="flex items-center gap-2 min-w-0">
          <Hash className="h-3.5 w-3.5 text-muted-foreground" />
          <h2 className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
            Project slug
          </h2>
        </div>
      </header>

      <div className="p-4 space-y-3">
        {slug ? (
          <>
            <div className="flex items-center gap-2">
              <code className="text-[12px] font-mono bg-muted px-2 py-0.5 rounded">
                {slug}
              </code>
              <span className="text-[11px] text-muted-foreground">
                gerado automaticamente do nome do projeto
              </span>
            </div>

            <div className="space-y-1.5">
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                Cole esta linha em{" "}
                <code className="text-[11px] bg-muted px-1 rounded">
                  ~/.claude/CLAUDE.md
                </code>{" "}
                na VPS para que o agente saiba onde encontrar o repositório
                clonado:
              </p>

              <div className="flex items-stretch gap-2">
                <pre className="flex-1 overflow-x-auto rounded-sm border border-border bg-muted/50 px-3 py-2 text-[12px] font-mono leading-relaxed">
                  {snippet}
                </pre>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleCopy}
                  className="shrink-0 text-[12px]"
                >
                  {copied ? (
                    <>
                      <Check className="mr-1 h-3 w-3" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1 h-3 w-3" />
                      Copiar
                    </>
                  )}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground/80">
                Ajuste o path (
                <code className="text-[10px]">/home/dev/...</code>) para onde o
                repositório <strong>realmente</strong> está clonado na VPS — o
                backend não conhece esse caminho (ADR-V2-030).
              </p>
            </div>
          </>
        ) : (
          <p className="text-[12px] text-muted-foreground">
            O projectSlug aparecerá aqui após vincular uma VPS ao projeto.
          </p>
        )}
      </div>
    </section>
  );
}
