"use client";

import Link from "next/link";
import { ChevronLeft, ExternalLink, Sparkles, Terminal } from "lucide-react";

import { PageTransition } from "@/components/common/page-transition";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { Button } from "@/components/ui/button";

export default function ClaudeIntegrationPage() {
  usePageTitle("Connect Claude");

  return (
    <PageTransition className="h-full overflow-auto">
      <div className="flex flex-col">
        {/* Breadcrumb back */}
        <header className="flex h-11 shrink-0 items-center px-8 border-b border-border">
          <Link
            href="/integrations"
            className="flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Integrations
          </Link>
        </header>

        <div className="px-8 py-8">
          <div className="mx-auto max-w-3xl space-y-8">
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-600">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-semibold tracking-tight">
                  Claude
                </h1>
                <p className="text-[13px] text-muted-foreground mt-1">
                  Turn issues into pull requests with Claude Code, Cursor and
                  Claude Desktop via MCP.
                </p>
              </div>
            </div>

            {/* Meta + CTA */}
            <div className="rounded-md border border-border bg-card p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex flex-wrap gap-x-8 gap-y-3 text-[12px]">
                  <Meta
                    label="Built by"
                    value={
                      <span className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        Anthropic
                      </span>
                    }
                  />
                  <Meta
                    label="Website"
                    value={
                      <a
                        href="https://www.anthropic.com/claude-code"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-0.5 hover:underline"
                      >
                        anthropic.com/claude-code
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    }
                  />
                  <Meta label="Protocol" value="MCP (Model Context Protocol)" />
                </div>
                <Button asChild size="sm" className="text-[12px] h-8">
                  <Link href="/integrations">
                    Enable
                    <ExternalLink className="ml-1.5 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Screenshots stub */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <PreviewCard
                title="Issue properties"
                lines={[
                  { left: "Status", right: "In Progress" },
                  { left: "Assignee", right: "Claude" },
                  { left: "Estimate", right: "2d" },
                ]}
              />
              <PreviewCard
                title="Mention in editor"
                code="Can you take a stab at this @claude"
              />
            </div>

            {/* Overview */}
            <Section title="Overview">
              <p>
                Assign any Scrumban issue to Claude, and a cloud agent will get
                to work. You can track progress directly in Scrumban, the
                Claude Code CLI, ou no seu IDE. Once the task is complete,
                Claude updates the issue automatically with a PR link.
              </p>
            </Section>

            {/* How it works */}
            <Section title="How it works">
              <p>
                Quando voce conecta Claude com o Scrumban, voce pode pedir
                qualquer coisa em linguagem natural:{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-[12px]">
                  &quot;lista as issues abertas do projeto X&quot;
                </code>{" "}
                ou{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-[12px]">
                  &quot;cria um bug no ClickRifas&quot;
                </code>
                . O cliente Claude chama as 5 tools MCP automaticamente
                (list_projects, list_tasks, create_task, update_status,
                list_sprints).
              </p>
              <p className="mt-3">
                Conforme o agente trabalha, atualizacoes fluem de volta para o
                Scrumban — voce pode acompanhar progresso sem sair do seu
                workflow. Activity e resultados aparecem no Inbox e na timeline
                de cada issue.
              </p>
            </Section>

            {/* Setup CTA */}
            <div className="rounded-md border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                  <Terminal className="h-4 w-4" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-[13px] font-medium">
                    Pronto para conectar?
                  </p>
                  <p className="text-[12px] text-muted-foreground">
                    Gere sua MCP Key e copie o comando{" "}
                    <code className="rounded bg-muted px-1 py-0.5 text-[11px]">
                      claude mcp add scrumban
                    </code>
                    .
                  </p>
                </div>
                <Button asChild size="sm" className="text-[12px] h-8">
                  <Link href="/integrations">Abrir setup</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

// ============================================================
// Sub-components
// ============================================================

function Meta({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="space-y-0.5">
      <p className="uppercase tracking-wide text-[10px] text-muted-foreground/80">
        {label}
      </p>
      <p>{value}</p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-medium">{title}</h2>
      <div className="text-[13px] text-foreground/80 leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function PreviewCard({
  title,
  lines,
  code,
}: {
  title: string;
  lines?: { left: string; right: string }[];
  code?: string;
}) {
  return (
    <div className="rounded-md border border-border bg-card p-4 min-h-[140px] flex flex-col">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-3">
        {title}
      </p>
      {lines && (
        <dl className="space-y-2 text-[12px]">
          {lines.map((l) => (
            <div key={l.left} className="flex items-center justify-between">
              <dt className="text-muted-foreground">{l.left}</dt>
              <dd>{l.right}</dd>
            </div>
          ))}
        </dl>
      )}
      {code && (
        <div className="flex-1 flex items-center justify-center">
          <code className="rounded-md border border-border bg-background px-3 py-2 text-[12px] text-foreground">
            {code}
          </code>
        </div>
      )}
    </div>
  );
}
