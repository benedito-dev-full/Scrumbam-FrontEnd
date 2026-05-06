"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, Check, ExternalLink, Plug, Terminal } from "lucide-react";
import { toast } from "sonner";

import { PageTransition } from "@/components/common/page-transition";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { McpKeyManager } from "@/components/integrations/mcp-key-manager";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MCP_TOOLS = [
  {
    name: "scrumban_list_projects",
    description: "Lista projetos da sua organizacao.",
  },
  {
    name: "scrumban_list_tasks",
    description: "Lista issues de um projeto, com filtros opcionais.",
  },
  {
    name: "scrumban_create_task",
    description: "Cria uma issue nova em um projeto.",
  },
  {
    name: "scrumban_update_status",
    description: "Move uma issue entre status (READY -> EXECUTING -> DONE).",
  },
  {
    name: "scrumban_list_sprints",
    description: "Lista sprints/cycles configurados em um projeto.",
  },
] as const;

function getMcpUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  // Extract host: strip /api/v1 or any path suffix.
  try {
    const u = new URL(apiUrl);
    return `${u.origin}/mcp`;
  } catch {
    return "https://<HOST>/mcp";
  }
}

export default function IntegrationsPage() {
  usePageTitle("Integrations");

  const mcpUrl = getMcpUrl();
  const snippet = `claude mcp add scrumban --header "X-MCP-Key: <SUA_MCP_KEY>" ${mcpUrl}`;
  const [copied, setCopied] = useState(false);

  const copySnippet = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      toast.success("Snippet copiado");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Falha ao copiar");
    }
  };

  return (
    <PageTransition className="h-full overflow-auto">
      <div className="flex flex-col">
        {/* Page header */}
        <header className="flex h-11 shrink-0 items-center px-6 border-b border-border">
          <h1 className="text-[13px] font-medium">Integrations</h1>
        </header>

        <div className="px-6 py-6">
          <div className="mx-auto max-w-3xl space-y-6">
            {/* Intro */}
            <section className="space-y-1">
              <h2 className="text-base font-semibold tracking-tight">
                Conecte agentes de IA ao Scrumban
              </h2>
              <p className="text-[13px] text-muted-foreground">
                Use o protocolo MCP para que Claude Code, Cursor e Claude
                Desktop leiam e modifiquem issues do Scrumban como voce.
              </p>
            </section>

            {/* MCP Key Section */}
            <section className="space-y-3">
              <SectionHeader
                icon={Plug}
                title="MCP Server"
                subtitle="1 key por usuario. Gerencie aqui."
              />
              <McpKeyManager />
            </section>

            {/* Connection Steps */}
            <section className="space-y-3">
              <SectionHeader
                icon={Terminal}
                title="Como conectar"
                subtitle="Cole no terminal apos gerar sua key."
              />
              <div className="rounded-md border border-border bg-card overflow-hidden">
                <ol className="divide-y divide-border">
                  <Step
                    n={1}
                    title="Gere sua MCP Key"
                    description="Use o card acima para gerar. Salve a key em texto plano que aparece no modal — depois nao volta."
                  />
                  <Step
                    n={2}
                    title="Adicione o servidor no seu cliente"
                    description="Rode o comando abaixo no terminal. Substitua <SUA_MCP_KEY> pela key que voce salvou."
                  >
                    <div className="mt-2 rounded-md border border-border bg-background p-3">
                      <pre className="font-mono text-[11px] sm:text-[12px] text-foreground whitespace-pre-wrap break-all">
                        {snippet}
                      </pre>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copySnippet}
                        className="mt-3 text-[12px]"
                      >
                        {copied ? (
                          <>
                            <Check className="mr-1.5 h-3 w-3" />
                            Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="mr-1.5 h-3 w-3" />
                            Copiar comando
                          </>
                        )}
                      </Button>
                    </div>
                  </Step>
                  <Step
                    n={3}
                    title="Use no Claude"
                    description='No Claude Code/Desktop/Cursor, peca tipo "lista os projetos do Scrumban" ou "cria issue de bug no projeto X". O cliente vai chamar as tools automaticamente.'
                  />
                </ol>
              </div>
            </section>

            {/* Available Tools */}
            <section className="space-y-3">
              <SectionHeader
                icon={Plug}
                title="Tools disponiveis"
                subtitle="O que o agente consegue fazer no Scrumban via MCP."
              />
              <div className="rounded-md border border-border bg-card overflow-hidden">
                <ul className="divide-y divide-border">
                  {MCP_TOOLS.map((tool) => (
                    <li
                      key={tool.name}
                      className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:gap-4"
                    >
                      <code className="font-mono text-[12px] text-foreground shrink-0">
                        {tool.name}
                      </code>
                      <span className="text-[12px] text-muted-foreground">
                        {tool.description}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Project API Key callout */}
            <section
              className={cn(
                "rounded-md border border-border bg-card p-4",
                "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between",
              )}
            >
              <div className="space-y-0.5">
                <h3 className="text-[13px] font-medium">
                  Automacao headless (sem humano)?
                </h3>
                <p className="text-[12px] text-muted-foreground">
                  Para CI/CD e agentes operacionais que rodam sem usuario,
                  use a Project API Key — uma por projeto, nao vinculada a
                  pessoa.
                </p>
              </div>
              <Button variant="outline" size="sm" asChild className="text-[12px]">
                <Link href="/projects">
                  Ver projetos
                  <ExternalLink className="ml-1.5 h-3 w-3" />
                </Link>
              </Button>
            </section>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

// ============================================================
// Sub-components
// ============================================================

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <h3 className="text-[13px] font-medium">{title}</h3>
        {subtitle && (
          <p className="text-[12px] text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

function Step({
  n,
  title,
  description,
  children,
}: {
  n: number;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <li className="flex gap-3 px-4 py-3">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-medium text-foreground">
        {n}
      </span>
      <div className="flex-1 min-w-0">
        <h4 className="text-[13px] font-medium">{title}</h4>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          {description}
        </p>
        {children}
      </div>
    </li>
  );
}
