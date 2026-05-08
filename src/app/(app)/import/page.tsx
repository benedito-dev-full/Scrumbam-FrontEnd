"use client";

import { useMemo, useState } from "react";
import {
  Download,
  Upload,
  FileSpreadsheet,
  Construction,
  ArrowRight,
  CheckCircle2,
  X,
  Github,
  Inbox,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { PageTransition } from "@/components/common/page-transition";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ============================================================
// Sources catalogo
// ============================================================

interface ImportSource {
  id: string;
  name: string;
  description: string;
  /** Letra exibida no quadrado de logo (mock — sem SVGs de marca) */
  initial: string;
  /** Cor do quadrado de logo */
  color: string;
  /** Formatos aceitos (display only) */
  formats: string[];
  /** Mapeamento ilustrativo do que cairia em cada campo do Scrumban */
  mapping: { from: string; to: string }[];
  /** Volume de issues importaveis num teste fictício — so ilustra o dialog */
  sampleVolume: number;
}

const SOURCES: ImportSource[] = [
  {
    id: "jira",
    name: "Jira",
    description: "Importar projetos e issues exportados como JSON",
    initial: "J",
    color: "bg-blue-600",
    formats: ["JSON", "XML"],
    mapping: [
      { from: "summary", to: "title" },
      { from: "description", to: "description" },
      { from: "issueType.name", to: "type" },
      { from: "priority.name", to: "priority" },
      { from: "status.name", to: "status" },
      { from: "assignee.emailAddress", to: "assignee (matched by email)" },
    ],
    sampleVolume: 312,
  },
  {
    id: "asana",
    name: "Asana",
    description: "Importar tarefas exportadas como CSV ou JSON",
    initial: "A",
    color: "bg-rose-500",
    formats: ["CSV", "JSON"],
    mapping: [
      { from: "Name", to: "title" },
      { from: "Notes", to: "description" },
      { from: "Section/Column", to: "status" },
      { from: "Priority custom field", to: "priority" },
      { from: "Assignee", to: "assignee" },
    ],
    sampleVolume: 187,
  },
  {
    id: "github",
    name: "GitHub Issues",
    description: "Conectar repositorio e importar issues abertas/fechadas",
    initial: "G",
    color: "bg-zinc-700 dark:bg-zinc-600",
    formats: ["URL do repo", "JSON"],
    mapping: [
      { from: "title", to: "title" },
      { from: "body", to: "description" },
      { from: "labels[]", to: "type + tags" },
      { from: "state", to: "status" },
      { from: "assignee.login", to: "assignee (matched by username)" },
    ],
    sampleVolume: 84,
  },
  {
    id: "trello",
    name: "Trello",
    description: "Importar boards inteiros como CSV ou JSON",
    initial: "T",
    color: "bg-sky-500",
    formats: ["CSV", "JSON"],
    mapping: [
      { from: "Card name", to: "title" },
      { from: "Description", to: "description" },
      { from: "List name", to: "status" },
      { from: "Labels", to: "tags" },
      { from: "Members", to: "assignee" },
    ],
    sampleVolume: 56,
  },
  {
    id: "linear",
    name: "Linear",
    description: "Migrar diretamente de outra workspace Linear via CSV",
    initial: "L",
    color: "bg-violet-500",
    formats: ["CSV"],
    mapping: [
      { from: "Title", to: "title" },
      { from: "Description", to: "description" },
      { from: "Status", to: "status" },
      { from: "Priority", to: "priority" },
      { from: "Assignee", to: "assignee" },
      { from: "Labels", to: "tags" },
    ],
    sampleVolume: 423,
  },
  {
    id: "notion",
    name: "Notion",
    description: "Importar databases exportadas como CSV ou Markdown",
    initial: "N",
    color: "bg-zinc-800 dark:bg-zinc-700",
    formats: ["CSV", "Markdown"],
    mapping: [
      { from: "Name", to: "title" },
      { from: "Body (markdown)", to: "description" },
      { from: "Status property", to: "status" },
      { from: "Priority property", to: "priority" },
    ],
    sampleVolume: 98,
  },
  {
    id: "csv",
    name: "CSV generico",
    description: "Upload de qualquer .csv com mapeamento manual de colunas",
    initial: "C",
    color: "bg-emerald-500",
    formats: ["CSV"],
    mapping: [
      { from: "Voce escolhe", to: "title (obrigatorio)" },
      { from: "Voce escolhe", to: "description" },
      { from: "Voce escolhe", to: "priority" },
      { from: "Voce escolhe", to: "type" },
    ],
    sampleVolume: 0,
  },
];

// ============================================================
// Page
// ============================================================

export default function ImportPage() {
  usePageTitle("Importar issues");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(
    () => SOURCES.find((s) => s.id === selectedId) ?? null,
    [selectedId],
  );

  return (
    <PageTransition className="h-full">
      <div className="flex h-full flex-col">
        {/* Header */}
        <header className="flex h-11 shrink-0 items-center justify-between px-8 border-b border-border">
          <h1 className="text-[13px] font-medium">Importar issues</h1>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300">
            <Construction className="h-3 w-3" />
            Mock — sem backend ainda
          </span>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-auto">
          <div className="mx-auto max-w-5xl px-8 py-8 space-y-10">
            {/* Intro */}
            <section className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight">
                Migre seu backlog em minutos
              </h2>
              <p className="max-w-2xl text-[13px] text-muted-foreground">
                Conecte sua ferramenta atual ou faca upload de um arquivo
                exportado. O Scrumban mapeia os campos automaticamente — voce
                revisa antes de confirmar.
              </p>
            </section>

            {/* Sources grid */}
            <section className="space-y-3">
              <h3 className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                Escolha a origem
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {SOURCES.map((source) => (
                  <SourceCard
                    key={source.id}
                    source={source}
                    onClick={() => setSelectedId(source.id)}
                  />
                ))}
              </div>
            </section>

            {/* How it works */}
            <section className="space-y-3">
              <h3 className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                Como funciona
              </h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <Step
                  num={1}
                  icon={Upload}
                  title="Conecte ou envie"
                  description="Cole a URL do repo ou faca upload do arquivo exportado."
                />
                <Step
                  num={2}
                  icon={Sparkles}
                  title="Mapeamento automatico"
                  description="Detectamos titulo, descricao, prioridade e responsavel. Voce ajusta o que estiver fora."
                />
                <Step
                  num={3}
                  icon={CheckCircle2}
                  title="Revise e confirme"
                  description="Dry-run mostra o que sera criado. Confirma e as issues entram no projeto."
                />
              </div>
            </section>

            {/* Recent imports */}
            <section className="space-y-3">
              <h3 className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                Importacoes recentes
              </h3>
              <div className="rounded-lg border border-dashed border-border bg-card/30 px-6 py-10 text-center">
                <Inbox className="mx-auto h-8 w-8 text-muted-foreground/40" />
                <p className="mt-3 text-[13px] font-medium">
                  Nenhuma importacao ainda
                </p>
                <p className="mt-1 text-[12px] text-muted-foreground max-w-sm mx-auto">
                  Quando o backend estiver pronto, voce vai ver aqui o historico
                  com data, origem, quantas issues vieram e quantas falharam.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Source detail dialog */}
      <SourceDialog
        source={selected}
        onClose={() => setSelectedId(null)}
      />
    </PageTransition>
  );
}

// ============================================================
// Source card
// ============================================================

function SourceCard({
  source,
  onClick,
}: {
  source: ImportSource;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col gap-3 rounded-lg border border-border bg-card p-4 text-left transition-all hover:border-foreground/20 hover:bg-accent/30 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-md text-[14px] font-bold text-white shrink-0",
              source.color,
            )}
          >
            {source.id === "github" ? (
              <Github className="h-4 w-4" />
            ) : source.id === "csv" ? (
              <FileSpreadsheet className="h-4 w-4" />
            ) : (
              source.initial
            )}
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-medium truncate">{source.name}</p>
            <p className="text-[11px] text-muted-foreground">
              {source.formats.join(" · ")}
            </p>
          </div>
        </div>
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
      </div>
      <p className="text-[12px] text-muted-foreground leading-relaxed">
        {source.description}
      </p>
    </button>
  );
}

// ============================================================
// Step
// ============================================================

function Step({
  num,
  icon: Icon,
  title,
  description,
}: {
  num: number;
  icon: typeof Upload;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-2">
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[11px] font-bold tabular-nums text-foreground">
          {num}
        </span>
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-[13px] font-medium">{title}</p>
      </div>
      <p className="text-[12px] text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}

// ============================================================
// Source detail dialog (preview do flow real)
// ============================================================

function SourceDialog({
  source,
  onClose,
}: {
  source: ImportSource | null;
  onClose: () => void;
}) {
  const open = !!source;

  const handleStartImport = () => {
    toast.info("Importador real em desenvolvimento — aguarde proxima sprint", {
      duration: 4000,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-lg p-0 gap-0 overflow-hidden border-border"
      >
        {source && (
          <>
            {/* Header */}
            <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-md text-[14px] font-bold text-white shrink-0",
                    source.color,
                  )}
                >
                  {source.id === "github" ? (
                    <Github className="h-4 w-4" />
                  ) : source.id === "csv" ? (
                    <FileSpreadsheet className="h-4 w-4" />
                  ) : (
                    source.initial
                  )}
                </span>
                <div className="min-w-0">
                  <DialogTitle className="text-[14px] truncate">
                    Importar de {source.name}
                  </DialogTitle>
                  <DialogDescription className="text-[11px] mt-0.5">
                    {source.formats.join(" · ")}
                  </DialogDescription>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                aria-label="Fechar"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </header>

            {/* Body */}
            <div className="px-5 py-4 space-y-5 max-h-[60vh] overflow-auto">
              {/* Upload area (mock) */}
              <div className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-8 text-center">
                <Upload className="mx-auto h-6 w-6 text-muted-foreground/50" />
                <p className="mt-2 text-[12px] font-medium">
                  Arraste o arquivo aqui ou{" "}
                  <span className="text-blue-400 underline-offset-2 hover:underline">
                    clique para selecionar
                  </span>
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Aceita {source.formats.join(", ")} ate 50MB
                </p>
              </div>

              {/* Mapping preview */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Mapeamento de campos
                </h4>
                <div className="rounded-md border border-border overflow-hidden">
                  {source.mapping.map((m, i) => (
                    <div
                      key={i}
                      className={cn(
                        "grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-2 text-[12px]",
                        i > 0 && "border-t border-border/50",
                      )}
                    >
                      <span className="font-mono text-muted-foreground truncate">
                        {m.from}
                      </span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground/40" />
                      <span className="font-mono text-foreground truncate">
                        {m.to}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Volume preview */}
              {source.sampleVolume > 0 && (
                <div className="flex items-center gap-3 rounded-md border border-border bg-muted/30 px-3 py-2.5">
                  <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
                  <p className="text-[12px] text-muted-foreground">
                    Numa exportacao tipica, o Scrumban detecta cerca de{" "}
                    <span className="font-semibold text-foreground tabular-nums">
                      {source.sampleVolume.toLocaleString("pt-BR")}
                    </span>{" "}
                    issues prontas para importar.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <footer className="flex items-center justify-between gap-3 border-t border-border px-5 py-3">
              <span className="inline-flex items-center gap-1.5 text-[11px] text-amber-300">
                <Construction className="h-3 w-3" />
                Mock — botao abaixo nao executa import real
              </span>
              <Button
                size="sm"
                onClick={handleStartImport}
                className="text-[12px] h-8 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Download className="mr-1.5 h-3 w-3" />
                Iniciar importacao
              </Button>
            </footer>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
