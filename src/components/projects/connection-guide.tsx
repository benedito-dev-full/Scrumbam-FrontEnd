"use client";

import { useState } from "react";
import {
  Terminal,
  Key,
  FolderGit2,
  CheckCircle2,
  Copy,
  Check,
  ChevronDown,
  Download,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { toast } from "sonner";

// ============================================================
// CopySnippet — reusable code block with copy button
// ============================================================

function CopySnippet({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Copiado para a area de transferencia");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      {label && (
        <span className="text-[11px] font-medium text-muted-foreground mb-1 block">
          {label}
        </span>
      )}
      <div className="flex items-start gap-2 rounded-lg bg-muted/70 border border-border/50 p-3">
        <pre className="flex-1 overflow-x-auto text-xs font-mono leading-relaxed whitespace-pre-wrap break-all text-foreground/90">
          {code}
        </pre>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 h-7 w-7 p-0"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// Step data
// ============================================================

interface StepDef {
  number: number;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: { label: string; variant: "default" | "secondary" | "outline" };
  content: React.ReactNode;
}

function buildSteps(): StepDef[] {
  return [
    {
      number: 1,
      title: "Instalar o /trabalhar",
      icon: Terminal,
      badge: { label: "Obrigatorio", variant: "default" },
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            O Scrumban usa o comando{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono font-semibold">
              /trabalhar
            </code>{" "}
            para conectar o Claude Code com suas intencoes. Este arquivo contem
            o protocolo completo de gestao de intencoes e deve estar na sua
            maquina.
          </p>

          <Button variant="outline" className="w-full gap-2" asChild>
            <a href="/trabalhar.md" download="trabalhar.md">
              <Download className="h-4 w-4" />
              Baixar trabalhar.md
            </a>
          </Button>

          <CopySnippet
            code="~/.claude/commands/trabalhar.md"
            label="Coloque o arquivo baixado neste caminho"
          />

          <CopySnippet
            code={`# Criar pasta se nao existir e mover o arquivo\nmkdir -p ~/.claude/commands\nmv ~/Downloads/trabalhar.md ~/.claude/commands/`}
            label="Comando rapido"
          />

          <p className="text-xs text-muted-foreground italic">
            O comando ficara disponivel em TODOS os projetos da maquina.
          </p>
        </div>
      ),
    },
    {
      number: 2,
      title: "Configurar Acesso",
      icon: Key,
      badge: { label: "Obrigatorio", variant: "default" },
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            O{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono font-semibold">
              /trabalhar
            </code>{" "}
            precisa de credenciais para acessar o Scrumban. A forma recomendada
            e usar uma <strong>API Key</strong> do projeto.
          </p>

          <div className="space-y-3">
            <p className="text-sm font-medium">
              Opcao A: API Key (Recomendado)
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                1. Va em <strong>Projetos</strong> e clique em{" "}
                <strong>&quot;Gerar API Key&quot;</strong> no card do projeto
              </p>
              <p>
                2. Copie a key gerada (ela aparece apenas{" "}
                <strong>uma vez</strong>)
              </p>
              <p>
                3. Adicione no{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">
                  .env
                </code>{" "}
                do projeto:
              </p>
            </div>
            <CopySnippet code="SCRUMBAN_API_KEY=scrumban_pk_2_sua_key_aqui" />
          </div>

          <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3">
            <p className="text-xs text-green-600 dark:text-green-400 font-medium">
              Com API Key, o projeto e detectado automaticamente (esta embutido
              na key). Mais seguro: funciona apenas no projeto especifico e pode
              ser revogada a qualquer momento.
            </p>
          </div>

          <Collapsible>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronDown className="h-3.5 w-3.5" />
                Opcao B: Email + Senha (Alternativo)
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-3 pt-3">
                <p className="text-sm text-muted-foreground">
                  Se preferir autenticar com credenciais:
                </p>

                <Button variant="outline" className="w-full gap-2" asChild>
                  <a
                    href="/settings-local-example.json"
                    download="settings.local.json"
                  >
                    <Download className="h-4 w-4" />
                    Baixar template settings.local.json
                  </a>
                </Button>

                <CopySnippet
                  code={`{
  "env": {
    "SCRUMBAN_EMAIL": "seu-email@empresa.com",
    "SCRUMBAN_PASSWORD": "sua-senha"
  }
}`}
                  label="Edite com seus dados e coloque em ~/.claude/settings.local.json"
                />

                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                    Importante: Este arquivo e LOCAL e nao deve ser commitado. A
                    API Key e mais segura: funciona apenas no projeto especifico
                    e pode ser revogada a qualquer momento.
                  </p>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      ),
    },
    {
      number: 3,
      title: "Mapear Projeto ao Diretorio",
      icon: FolderGit2,
      badge: { label: "Por projeto", variant: "secondary" },
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Para que o{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono font-semibold">
              /trabalhar
            </code>{" "}
            detecte automaticamente em qual projeto voce esta, adicione seu
            projeto na tabela de mapeamento dentro do{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
              trabalhar.md
            </code>
            :
          </p>

          <CopySnippet
            code="| nome-do-repo | Nome do Projeto | ID | Backend/Frontend |"
            label="Adicione esta linha na tabela de mapeamento"
          />

          <div className="space-y-2">
            <p className="text-sm font-medium">Onde encontrar o ID:</p>
            <p className="text-sm text-muted-foreground">
              O ID do projeto aparece na URL do Scrumban quando voce acessa o
              projeto. Por exemplo:{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                /intentions/5
              </code>{" "}
              indica que o ID e <strong>5</strong>.
            </p>
          </div>

          <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              Com API Key, o projeto ja esta embutido na key. O mapeamento
              continua necessario para o /trabalhar saber o diretorio, mas a
              autenticacao e automatica.
            </p>
          </div>

          <p className="text-xs text-muted-foreground italic">
            Repita este passo para cada novo projeto que quiser conectar.
          </p>
        </div>
      ),
    },
    {
      number: 4,
      title: "Verificar que Funciona",
      icon: CheckCircle2,
      badge: { label: "Verificacao", variant: "outline" },
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            No terminal, dentro do diretorio de um projeto mapeado, abra o
            Claude Code e execute o comando:
          </p>

          <CopySnippet
            code={`# No terminal, dentro do diretorio do projeto:\nclaude\n# Depois digitar:\n/trabalhar\n# Deve mostrar: "Projeto detectado: {nome}"`}
            label="Testar a conexao"
          />

          <div className="space-y-3">
            <p className="text-sm font-medium">Troubleshooting:</p>
            <div className="space-y-2">
              <TroubleshootItem
                problem="Credenciais nao encontradas"
                solution="Verifique SCRUMBAN_API_KEY no .env do projeto ou ~/.claude/settings.local.json (Step 2)"
              />
              <TroubleshootItem
                problem="API Key invalida"
                solution="Verifique se a key nao foi revogada. Gere uma nova na pagina de Projetos."
              />
              <TroubleshootItem
                problem="Sem permissao para gerar key"
                solution="Apenas administradores podem gerar API Keys."
              />
              <TroubleshootItem
                problem="Backend fora do ar"
                solution="Inicie o backend com: cd scrumban-be && npm run dev"
              />
              <TroubleshootItem
                problem="Projeto nao detectado"
                solution="Verifique a tabela de mapeamento no trabalhar.md (Step 3)"
              />
            </div>
          </div>
        </div>
      ),
    },
  ];
}

function TroubleshootItem({
  problem,
  solution,
}: {
  problem: string;
  solution: string;
}) {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-2.5">
      <span className="text-xs font-mono text-destructive shrink-0 mt-0.5">
        !
      </span>
      <div>
        <p className="text-xs font-medium">&quot;{problem}&quot;</p>
        <p className="text-xs text-muted-foreground">{solution}</p>
      </div>
    </div>
  );
}

// ============================================================
// ConnectionGuide — main component
// ============================================================

export function ConnectionGuide() {
  const steps = buildSteps();
  const [openSteps, setOpenSteps] = useState<Set<number>>(new Set([1]));

  const toggleStep = (num: number) => {
    setOpenSteps((prev) => {
      const next = new Set(prev);
      if (next.has(num)) {
        next.delete(num);
      } else {
        next.add(num);
      }
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {/* Stepper visual */}
      <div className="flex items-center justify-center gap-0 py-4">
        {steps.map((step, i) => (
          <div key={step.number} className="flex items-center">
            <button
              type="button"
              onClick={() => toggleStep(step.number)}
              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                openSteps.has(step.number)
                  ? "bg-[var(--scrumban-brand)] text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {step.number}
            </button>
            {i < steps.length - 1 && (
              <div className="h-px w-8 md:w-12 bg-border" />
            )}
          </div>
        ))}
      </div>

      {/* Steps */}
      {steps.map((step) => {
        const Icon = step.icon;
        const isOpen = openSteps.has(step.number);

        return (
          <Collapsible
            key={step.number}
            open={isOpen}
            onOpenChange={() => toggleStep(step.number)}
          >
            <Card
              className={`transition-colors ${
                isOpen ? "border-[var(--scrumban-brand)]/30" : ""
              }`}
            >
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors rounded-t-lg"
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                      isOpen ? "bg-[var(--scrumban-brand-muted)]" : "bg-muted"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 ${
                        isOpen
                          ? "text-[var(--scrumban-brand)]"
                          : "text-muted-foreground"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">
                        Step {step.number}: {step.title}
                      </span>
                      <Badge
                        variant={step.badge.variant}
                        className="text-[10px] h-5"
                      >
                        {step.badge.label}
                      </Badge>
                    </div>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 pb-4 px-4">
                  <div className="pl-11">{step.content}</div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}
    </div>
  );
}
