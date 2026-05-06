"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { ChevronRight } from "lucide-react";

import { PageTransition } from "@/components/common/page-transition";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { usePreference } from "@/lib/hooks/use-preference";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function PreferencesPage() {
  usePageTitle("Preferencias");

  // Theme via next-themes
  const { theme, setTheme } = useTheme();

  // Persisted preferences (localStorage; cross-device sync = gap #21)
  const [defaultHomeView, setDefaultHomeView] = usePreference(
    "defaultHomeView",
    "active",
  );
  const [displayNames, setDisplayNames] = usePreference(
    "displayNames",
    "fullName",
  );
  const [firstDayOfWeek, setFirstDayOfWeek] = usePreference(
    "firstDayOfWeek",
    "sunday",
  );
  const [convertEmoticons, setConvertEmoticons] = usePreference(
    "convertEmoticons",
    true,
  );
  const [sendCommentOn, setSendCommentOn] = usePreference(
    "sendCommentOn",
    "enter",
  );
  const [fontSize, setFontSize] = usePreference("fontSize", "default");
  const [pointerCursors, setPointerCursors] = usePreference(
    "pointerCursors",
    false,
  );
  const [autoAssignToSelf, setAutoAssignToSelf] = usePreference(
    "autoAssignToSelf",
    false,
  );
  const [onMoveStartedAssignSelf, setOnMoveStartedAssignSelf] = usePreference(
    "onMoveStartedAssignSelf",
    false,
  );

  return (
    <PageTransition>
      <div className="px-8 py-8">
        <div className="mx-auto max-w-3xl space-y-8">
          <h1 className="text-2xl font-semibold tracking-tight">Preferencias</h1>

          {/* ============ GERAL ============ */}
          <Section title="Geral">
            <Card>
              <Row
                label="Tela inicial padrao"
                description="Escolha qual tela exibir ao abrir o Scrumban"
                control={
                  <SelectControl
                    value={defaultHomeView}
                    onChange={setDefaultHomeView}
                    options={[
                      { value: "active", label: "Issues ativas" },
                      { value: "inbox", label: "Inbox" },
                      { value: "myIssues", label: "Minhas issues" },
                      { value: "projects", label: "Projetos" },
                    ]}
                  />
                }
              />
              <Row
                label="Exibicao de nomes"
                description="Como os nomes aparecem na interface"
                control={
                  <SelectControl
                    value={displayNames}
                    onChange={setDisplayNames}
                    options={[
                      { value: "fullName", label: "Nome completo" },
                      { value: "username", label: "Username" },
                      { value: "firstName", label: "Primeiro nome" },
                    ]}
                  />
                }
              />
              <Row
                label="Primeiro dia da semana"
                description="Usado nos seletores de data"
                control={
                  <SelectControl
                    value={firstDayOfWeek}
                    onChange={setFirstDayOfWeek}
                    options={[
                      { value: "sunday", label: "Domingo" },
                      { value: "monday", label: "Segunda" },
                    ]}
                  />
                }
              />
              <Row
                label="Converter emoticons em emojis"
                description="Sequencias como :) viram 🙂"
                control={
                  <Switch
                    checked={convertEmoticons}
                    onCheckedChange={setConvertEmoticons}
                  />
                }
              />
              <Row
                label="Enviar comentario com..."
                description="Tecla usada para enviar um comentario"
                control={
                  <SelectControl
                    value={sendCommentOn}
                    onChange={setSendCommentOn}
                    options={[
                      { value: "enter", label: "Enter" },
                      { value: "cmdEnter", label: "Cmd/Ctrl+Enter" },
                    ]}
                  />
                }
                noBorder
              />
            </Card>
          </Section>

          {/* ============ INTERFACE E TEMA ============ */}
          <Section title="Interface e tema">
            <Card>
              <Row
                label="Sidebar"
                description="Personalize visibilidade, ordem e estilo dos itens da sidebar"
                control={
                  <button
                    type="button"
                    disabled
                    title="Em breve"
                    className="text-[12px] text-muted-foreground cursor-not-allowed"
                  >
                    Personalizar
                  </button>
                }
              />
              <Row
                label="Tamanho da fonte"
                description="Ajusta o tamanho do texto em todo o app"
                control={
                  <SelectControl
                    value={fontSize}
                    onChange={setFontSize}
                    options={[
                      { value: "small", label: "Pequena" },
                      { value: "default", label: "Padrao" },
                      { value: "large", label: "Grande" },
                    ]}
                  />
                }
              />
              <Row
                label="Cursor de ponteiro"
                description="Mostra cursor de ponteiro ao passar sobre elementos clicaveis"
                control={
                  <Switch
                    checked={pointerCursors}
                    onCheckedChange={setPointerCursors}
                  />
                }
                noBorder
              />
            </Card>

            <Card>
              <Row
                label="Tema da interface"
                description="Escolha ou personalize o esquema de cores"
                control={
                  <SelectControl
                    value={theme ?? "system"}
                    onChange={setTheme}
                    options={[
                      { value: "system", label: "Padrao do sistema" },
                      { value: "light", label: "Claro" },
                      { value: "dark", label: "Escuro" },
                    ]}
                  />
                }
              />
              <Row
                label="Claro"
                description="Tema usado quando o sistema esta em modo claro"
                control={
                  <SelectControl
                    value="light"
                    onChange={() => {}}
                    options={[{ value: "light", label: "Claro" }]}
                    disabled
                  />
                }
              />
              <Row
                label="Escuro"
                description="Tema usado quando o sistema esta em modo escuro"
                control={
                  <SelectControl
                    value="dark"
                    onChange={() => {}}
                    options={[{ value: "dark", label: "Escuro" }]}
                    disabled
                  />
                }
                noBorder
              />
            </Card>

            <Card>
              <Row
                label="Tema do codigo"
                description="Syntax highlighting em diffs e visualizadores de codigo"
                stub
                title="Em breve — depende de termos diff/code blocks na UI"
                control={
                  <SelectControl
                    value="linear-dark"
                    onChange={() => {}}
                    options={[{ value: "linear-dark", label: "Linear Dark" }]}
                    disabled
                  />
                }
                noBorder
              />
            </Card>
          </Section>

          {/* ============ APP DESKTOP ============ */}
          <Section title="App desktop">
            <Card>
              <Row
                label="Abrir no app desktop"
                description="Abrir links automaticamente no app desktop quando possivel"
                stub
                title="Gap #22 — sem app desktop"
                control={<Switch checked={false} disabled />}
                noBorder
              />
            </Card>
          </Section>

          {/* ============ FERRAMENTAS DE CODIGO ============ */}
          <Section title="Ferramentas de codigo">
            <Card>
              <Link
                href="/integrations"
                className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-accent/40 transition-colors"
              >
                <div>
                  <p className="text-[13px] font-medium">
                    Configurar ferramentas de codigo
                  </p>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    Configure ferramentas que abrem do Scrumban (MCP, etc.)
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </Card>
          </Section>

          {/* ============ AUTOMACOES E WORKFLOWS ============ */}
          <Section title="Automacoes e workflows">
            <Card>
              <Row
                label="Atribuir a si mesmo automaticamente"
                description="Ao criar issues, atribuir automaticamente para voce"
                control={
                  <Switch
                    checked={autoAssignToSelf}
                    onCheckedChange={setAutoAssignToSelf}
                  />
                }
              />
              <Row
                label="Formato de anexo Git"
                description="Formato dos anexos GitHub/GitLab nas issues"
                stub
                title="Gap #23 — sem integracao Git"
                control={
                  <SelectControl
                    value="title"
                    onChange={() => {}}
                    options={[{ value: "title", label: "Titulo" }]}
                    disabled
                  />
                }
              />
              <Row
                label="Ao copiar branch git, mover para iniciada"
                description="Apos copiar o nome da branch, status muda para o primeiro estado de iniciado"
                stub
                title="Gap #23 — sem integracao Git"
                control={<Switch checked={false} disabled />}
              />
              <Row
                label="Ao abrir em IDE, mover para iniciada"
                description="Apos abrir issue na IDE, status muda para iniciada"
                stub
                title="Gap #23 — sem integracao Git"
                control={<Switch checked={false} disabled />}
              />
              <Row
                label="Ao mover para iniciada, atribuir a si mesmo"
                description="Mover issue sem responsavel para iniciada atribui automaticamente para voce"
                control={
                  <Switch
                    checked={onMoveStartedAssignSelf}
                    onCheckedChange={setOnMoveStartedAssignSelf}
                  />
                }
              />
              <Row
                label="Auto-converter PRs em rascunho"
                description="Marcar PRs em rascunho como prontos quando review for solicitado ou aprovado"
                stub
                title="Gap #23 — sem integracao Git"
                control={<Switch checked={false} disabled />}
                noBorder
              />
            </Card>
          </Section>
        </div>
      </div>
    </PageTransition>
  );
}

// ============================================================
// Layout primitives
// ============================================================

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-medium">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-card overflow-hidden">
      {children}
    </div>
  );
}

function Row({
  label,
  description,
  control,
  noBorder,
  stub,
  title,
}: {
  label: string;
  description?: string;
  control: React.ReactNode;
  noBorder?: boolean;
  stub?: boolean;
  title?: string;
}) {
  return (
    <div
      title={title}
      className={cn(
        "flex items-center justify-between gap-6 px-4 py-3",
        !noBorder && "border-b border-border",
        stub && "opacity-70",
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium">{label}</p>
        {description && (
          <p className="text-[12px] text-muted-foreground mt-0.5">
            {description}
          </p>
        )}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

// ============================================================
// SelectControl wrapper (Linear-like compact)
// ============================================================

interface Option {
  value: string;
  label: string;
}

function SelectControl({
  value,
  onChange,
  options,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  disabled?: boolean;
}) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="h-8 min-w-[160px] text-[12px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem
            key={opt.value}
            value={opt.value}
            className="text-[12px]"
          >
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
