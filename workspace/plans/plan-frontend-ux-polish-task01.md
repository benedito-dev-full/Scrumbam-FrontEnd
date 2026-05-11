# PLANO DETALHADO - Task 01: Polish de UX/UI Frontend Scrumban

**Criado por:** Strategist Agent
**Data:** 2026-05-07
**Modulo:** frontend (Scrumban-FrontEnd)
**Estimativa Total:** 4-6 dias uteis (dividido em 4 fases mergeaveis)
**Principios V3 Impactados:** Nenhum direto (UI-only). Reforca P1 (sistema passivo: melhor UX = melhor refinamento humano de intencoes) e P5 (metricas: melhor visualizacao da fila).

---

## 0. Triagem de Clareza

Intencao recebida: melhorar estilizacao de botoes, aumentar fontes, soltar fluxos rigidos.

| Criterio | Status |
|----------|--------|
| C1 — Problema definido | OK — 3 sinais explicitos (botoes, fontes, fluxo) |
| C2 — Escopo delimitado | PARCIAL — "varias telas" e amplo; precisei priorizar |
| C3 — Modulo identificavel | OK — frontend Scrumban (Next.js) |
| C4 — Sem ambiguidade critica | OK — natureza incremental, sem big bang |

**Resultado:** CLARA com escopo amplo. Nao bloqueia planejamento. Decidi autonomamente priorizar 8 paginas de alta visibilidade + Automation (foco recente) e deixar Settings/Onboarding para fase posterior.

### Decisoes Autonomas (Modo Trabalhando — sem dev presente)

- **Q: Subir tipografia para padrao Linear (12-13px) ou padrao SaaS moderno (14-16px)?**
  Decisao: SaaS moderno. Linear-clone esta passando do ponto — H1 da pagina em 13px e indefensavel. Subir corpo para 14px (text-sm), titulos de pagina para 18-22px. Justificativa: usuario sente fonte pequena e WCAG recomenda 16px de corpo. Linear tambem usa 14px de corpo, nao 13px.

- **Q: Refazer button.tsx ou apenas padronizar uso?**
  Decisao: Manter button.tsx (ja tem 6 variants e 8 sizes — esta OK). Padronizar **uso** (onde aplicar default vs sm vs xs). Adicionar `loading` prop como helper. Justificativa: refactor inutil, problema e consistencia de aplicacao.

- **Q: Mexer em mobile agora ou em fase posterior?**
  Decisao: Fase posterior (fora deste plano). Justificativa: mobile sem dispositivos para teste e caro; foco e desktop primeiro (onde o usuario trabalha). Fase 5 opcional cobre mobile depois.

- **Q: Tema dark vs light — qual priorizar?**
  Decisao: Ambos simultaneamente, mas validar visualmente em dark primeiro (modo padrao do dev). Tokens semanticos ja existem em globals.css.

NOTA PARA O DEV: Revise estas decisoes na etapa de VALIDATING. Se discordar de subir corpo para 14px (querendo manter 13px Linear-puro), volte ao Strategist com feedback.

---

## 1. Diagnostico — Descobertas Concretas

Auditei 11 arquivos representativos. As evidencias confirmam um padrao estrutural: **a equipe usou `text-[Npx]` direto em quase todo lugar**, criando um sistema tipografico ad-hoc desbalanceado.

### Tabela de Descobertas (35 itens)

| # | Arquivo | Linha | Problema | Impacto | Evidencia |
|---|---------|-------|----------|---------|-----------|
| **TIPOGRAFIA** | | | | | |
| T1 | `app/(app)/projects/page.tsx` | 42 | H1 "Projetos" usa `text-[13px]` — mesmo tamanho de uma celula de tabela. Zero hierarquia de pagina. | HIGH | `<h1 className="text-[13px] font-medium">` |
| T2 | `app/(app)/agents/page.tsx` | 52 | H1 "Agentes" idem `text-[13px]`. Padrao replicado | HIGH | `<h1 className="text-[13px] font-medium">` |
| T3 | `app/(app)/integrations/page.tsx` | 71 | H1 "Integracoes" idem. H2 abaixo (linha 78) e maior que o H1 da pagina | HIGH | `text-[13px] font-medium` vs `text-base font-semibold` |
| T4 | `app/(app)/intentions/inbox/page.tsx` | 54 | H1 "Inbox" idem `text-[13px]`. Lista usa `text-[13px]/[12px]/[11px]` em 3 niveis sem distincao clara | HIGH | linhas 153, 159, 163 |
| T5 | `app/(app)/projects/[id]/automation/page.tsx` | 80 | H1 "Automacao do projeto" usa `text-xl sm:text-2xl` — boa hierarquia. **Inconsistente** com paginas-irmas | MED | unica pagina com H1 grande |
| T6 | `_components/agent-link-form.tsx` | 145, 187, 210 | Labels de form em `text-[12px]`. Inputs em `text-[13px]`. **Inputs menores que o padrao Tailwind `text-sm` (14px) e do componente base** (que e `text-base` md:text-sm) | HIGH | `<Label className="text-[12px]">` + `<Input className="text-[13px]">` |
| T7 | `_components/agent-link-form.tsx` | 202, 306 | Helper text (`<p>`) em `text-[11px]` — menor que recomendacao WCAG para corpo (14px+). Pessoas com presbiopia leem mal | HIGH | repetido 6+ vezes no arquivo |
| T8 | `_components/agent-link-form.tsx` | 125 | Header de secao em `text-[12px] font-medium uppercase tracking-wide`. Caps lock + 12px = ilegivel em zoom 100% | MED | `<h2 className="text-[12px] ...uppercase">` |
| T9 | `app/globals.css` | 222 | `body` nao define `font-size` explicito. Cada componente decide. Resultado: fragmentacao | HIGH | falta `body { font-size: 14px; }` ou tokens |
| T10 | `components/ui/input.tsx` | 11 | Default e `text-base md:text-sm` (16px mobile / 14px desktop) — mas todos os usos sobrescrevem para `text-[13px]`. Sistema Tailwind padrao desperdicado | HIGH | comparar input.tsx default vs uso em forms |
| T11 | `components/ui/button.tsx` | 8 | Default e `text-sm` (14px) — OK. Mas usos como `agent-link-form.tsx:319` aplicam `className="text-[12px]"` por cima. Inconsistencia gerada por overrides | MED | `Button className="text-[12px]"` em 5 botoes |
| T12 | `app/(app)/intentions/inbox/page.tsx` | 246 | Empty state mensagem em `text-[13px]` + sub em `text-[12px]`. Em uma tela vazia 100% disponivel para respirar, fonte minuscula | MED | UX de empty state |
| **BOTOES** | | | | | |
| B1 | `app/(app)/projects/page.tsx` | 43-50 | Botao "Criar projeto" e **apenas um Plus de 14x14 num cuadrado h-6 w-6**. Acao primaria da pagina nao e descobrivel. Falha tap target (24px < 44px WCAG) | HIGH | `<button h-6 w-6>...<Plus h-3.5 w-3.5/></button>` |
| B2 | `app/(app)/projects/page.tsx` | 75-95 | 3 icon-buttons (Filtros, Settings2, PanelRight) sem labels visiveis, todos idênticos visualmente. Quem usa pela primeira vez nao sabe o que fazem | HIGH | aria-label sim, mas sem affordance visual |
| B3 | `app/(app)/intentions/inbox/page.tsx` | 56-81 | Filtros header com h-6 (24px) — abaixo de WCAG 44px touch. Em desktop e click-tedioso, mobile e impraticavel | HIGH | `h-6 w-6` em 3 botoes de header |
| B4 | `_components/agent-link-form.tsx` | 312-332 | Botao "Atualizar vinculo" (acao primaria do form) usa `size="sm" className="text-[12px]"` — visualmente igual ao "Cancelar". Hierarquia primaria/secundaria perdida | HIGH | falta destacar primario |
| B5 | `_components/execute-intention-panel.tsx` | 84-92 | Botao "Executar" (acao critica que dispara IA) e `variant="outline" size="sm" h-7 text-[12px]`. Acao mais perigosa da pagina parece um botao terciario | HIGH | inconsistencia entre risco e visual |
| B6 | `app/(app)/projects/page.tsx` | 320-330 | Empty state "Novo projeto" usa `bg-foreground text-background` (botao customizado, nao Button). Quebra design system | MED | inline-flex custom em vez de `<Button>` |
| B7 | `components/common/app-sidebar.tsx` | 146-163 | Atalhos no topo da sidebar (Search, NewIssue) sao `h-7 w-7` (28px). Labels em `title=""` (so visivel ao hover). Em mobile, intocaveis | HIGH | falta tooltip nativo, tap target |
| B8 | `_components/agent-link-form.tsx` | 130-139 | "Desvincular" (acao destrutiva) e variant="ghost" com cor destructive aplicada via className. Inconsistente com pattern: destrutivo deveria ser outlined ou destaque vermelho. Risco: usuario clica achando que e neutro | HIGH | `variant="ghost"` + `text-destructive` em vez de `variant="destructive"` ou outline-destructive |
| B9 | Geral | — | Botoes com loading state implementados de 5 formas diferentes (`<Loader2/>` inline com texto, sem texto, com `Salvando...`, com `Desvinculando...`). Falta helper centralizado | MED | repete em 8+ arquivos |
| B10 | `app/(app)/projects/page.tsx` | 102-110 | Headers de coluna em `text-[11px] font-medium text-muted-foreground` — visualmente sumida. Densidade Linear OK, mas **legibilidade pessima sem o uppercase ou peso adequado** | MED | seria melhor `text-xs uppercase tracking-wide` |
| **FLUXO E DENSIDADE** | | | | | |
| F1 | `_components/agent-link-form.tsx` | inteiro | Form com 7 campos (Agente, Path, Branch, RepoURL, Email Bot, Nome Bot, Timeout) em uma unica tela apos clicar "Vincular". Falta progressive disclosure (campos avancados poderiam estar em "Mostrar avancado") | HIGH | form longo demais para tarefa simples |
| F2 | `app/(app)/projects/[id]/automation/page.tsx` | 102-122 | 7 cards/secoes empilhados verticalmente (Status, Claude, Vinculo, Git, Approvals, Execute, History). Sem ancoras laterais ou tabs. Scroll longo em uma pagina critica | MED | falta navegacao lateral por secao |
| F3 | `app/(app)/projects/page.tsx` | 100-127 | Tabela sem ordenacao por coluna, sem filtros aplicaveis (botoes de filtro nao fazem nada visualmente — sao stubs). Frustra expectativa | MED | falta interactividade prometida pelos icones |
| F4 | `_components/execute-intention-panel.tsx` | 100-148 | Confirm modal mostra so o nome da task + risk badge. **Nao mostra o prompt que sera enviado para Claude Code, nem files que serao afetados, nem branch destino.** Acao com impacto grande, info minima | HIGH | UX de confirmacao deveria assustar mais |
| F5 | `app/(app)/intentions/inbox/page.tsx` | 56-66 | "Marcar todas como lidas" e botao com h-6 + so icone CheckCheck. Usuario tem que adivinhar que e bulk-action via title="" | MED | UX descobrimento |
| F6 | `_components/agent-link-form.tsx` | 312-332 | Submit do form nao tem feedback de sucesso visivel apos salvar (so o toast). Form nao colapsa nem muda estado visual | MED | feedback ambiguo |
| F7 | Geral | — | **Atalhos de teclado:** Cmd+K existe (CommandPalette), C abre nova issue (sidebar.tsx:160). Mas Esc fecha modal? Enter envia form? Nao testado/documentado. Inconsistente | MED | falta cheat-sheet visivel |
| F8 | `app/(app)/intentions/[projectId]/[intentionId]/page.tsx` | 1-100 | 26+ icones importados num arquivo — sintoma de tela com muitas acoes. Possivel que algumas devessem estar em menu "Mais" para reduzir densidade visual | LOW | Trash2, RotateCcw, RefreshCcw, Send, Plus, etc |
| F9 | `_components/agent-link-form.tsx` | 104-113 | Loading skeleton e generico (linhas cinzas). Nao indica **qual campo** vai aparecer — usuario nao consegue antecipar a tela | LOW | skeleton low-fidelity |
| F10 | `app/(app)/projects/page.tsx` | 102-127 | Coluna "Status" (% progresso) e sempre 0% (stub). Mostra progresso falso ao usuario. **Pior que nao mostrar.** Confianca quebrada | HIGH | dado fake na UI principal |
| **CONSISTENCIA E ESPACAMENTO** | | | | | |
| C1 | Todas as paginas | header | Header da pagina varia: `h-11 px-8` (projects, inbox), `h-12 px-8` (agents), `h-11 px-6` (integrations), `h-11 px-4 sm:px-6 md:px-8` (automation). Cada tela tem seu padrao | MED | falta `<PageHeader>` component |
| C2 | Modais | varios | DialogTitle aplica `text-[14px]` em alguns lugares (`execute-intention-panel.tsx:106`) e default em outros. DialogDescription idem | MED | overrides inconsistentes |
| C3 | `_components/agent-link-form.tsx` | 117 | `<section>` usa `rounded-md border border-border bg-card overflow-hidden`. Outros componentes usam `rounded-lg border bg-card p-5` (intention-detail.tsx:235). 2 paddings, 2 radius diferentes para "card" | MED | falta `<Card>` reutilizavel |
| C4 | `app/(app)/agents/page.tsx` | 66-72 | Headers de coluna em UPPERCASE com tracking-wide. Em projects/page.tsx (linha 102) sem uppercase. Inconsistente | LOW | mesmo elemento, 2 estilos |
| C5 | Geral | — | "Voltar" / "ChevronLeft" aparece em 3+ formas: link com texto+icone, breadcrumb, ArrowLeft. Sem padrao | LOW | UX de retorno fragmentado |

**Heatmap mental — 3 telas com mais problemas:**
1. **`app/(app)/projects/[id]/automation/`** — 9 problemas (T6, T7, T8, B4, B5, B8, F1, F2, F4)
2. **`app/(app)/projects/page.tsx`** — 6 problemas (T1, B1, B2, B6, F3, F10) + alta visibilidade
3. **`app/(app)/intentions/inbox/page.tsx`** — 5 problemas (T4, T12, B3, F5, +)

---

## 2. Principios de Design (Sistema Proposto)

Antes das fases de mudanca, defino o **norte** do polish.

### 2.1 Tabela de Tipografia (proposta)

Hoje o uso e ad-hoc (`text-[11px]`, `text-[12px]`, `text-[13px]`, `text-[14px]`, `text-[15px]`, `text-base`, `text-lg`, `text-xl`, `text-2xl`). 9 tamanhos sem hierarquia.

**Propor 6 niveis claros:**

| Token | Tailwind | px | Onde usar |
|-------|----------|-----|-----------|
| `display` | `text-2xl font-semibold` | 24px | H1 unico de pagina importante (hero, dashboard) |
| `title` | `text-lg font-semibold` | 18px | H1 padrao de pagina (Projetos, Agentes, Inbox, Integracoes, Automacao) |
| `subtitle` | `text-base font-semibold` | 16px | H2 de secao dentro de pagina |
| `body` | `text-sm` | 14px | Corpo padrao: paragrafos, celulas de tabela, inputs, botoes default |
| `label` | `text-xs font-medium` | 12px | Labels de form, headers de coluna, badges |
| `meta` | `text-[11px] text-muted-foreground` | 11px | Metadata sutil: timestamps, helpers, captions |

**Regras:**
- **Body em 14px** (nao 13px). +1px parece pouco mas e diferenca enorme em tabelas com 20 linhas
- **Eliminar `text-[13px]`** — se hoje tem `[13px]`, decidir: e label (vai p/ 12px) ou e body (vai p/ 14px)?
- **Eliminar `text-[15px]`** — se nao e 14 nem 16, e capricho. Forcar a uma das duas
- Manter `text-[11px]` (meta) — ele tem proposito (timestamps em tabelas densas)
- **Body do `<body>` global em globals.css**: `body { font-size: 14px; }` — para que componentes que nao especificam herdem

### 2.2 Paleta de Cores (existente — manter)

Tokens semanticos em `globals.css` ja sao excelentes. Manter:

- `--scrumban-brand` (azul violeta) — acoes primarias
- `--status-{backlog/todo/doing/review/done}` — colunas kanban
- `--priority-{urgent/high/medium/low/none}` — badges de prioridade
- `--type-{feature/bug/improvement/tech-debt}` — tipos de task
- `--ai-accent` (roxo) — IA / Agentes (Automation)
- `--destructive` — destrutivo

**Acao:** Garantir que **TODO** uso de cor venha desses tokens (auditoria revelou `text-amber-500`, `bg-orange-500`, `text-emerald-500` hardcoded em new-issue-modal.tsx — 3 cores soltas).

### 2.3 Spacing scale

Tailwind default (`gap-1, gap-2, gap-3, gap-4, gap-6`) e suficiente. Padronizar:
- Padding interno de card: `p-4` (16px) ou `p-5` (20px) — escolher UM. **Decisao: `p-4` para cards densos, `p-5` para cards de detalhe.**
- Padding de pagina: `px-6` (24px) ou `px-8` (32px). **Decisao: `px-6` em telas com sidebar, sem max-width adicional.**
- Gap entre secoes: `space-y-6`

### 2.4 Botoes (5 variants padronizados)

Componente `button.tsx` ja suporta tudo. Padronizar **uso**:

| Variant | Quando usar | Exemplo |
|---------|-------------|---------|
| `default` (primary) | Acao primaria da tela / form (1 por tela) | "Salvar", "Vincular agente", "Criar projeto" |
| `secondary` | Acao alternativa (peso medio) | "Cancelar" em pares, "Pre-visualizar" |
| `outline` | Acoes secundarias multiplas (toolbar) | "Filtros", "Exportar" |
| `ghost` | Icon-buttons, navegacao | botoes da sidebar, header |
| `destructive` | Acoes destrutivas confirmadas | "Excluir", "Desvincular", "Revogar" |

**Sizes padronizados:**
- `default` (h-9, 36px) — corpo de form, acoes principais
- `sm` (h-8, 32px) — toolbars, dialogs footer
- `xs` — evitar (so use em chips/badges interativos)
- `icon` (h-9 w-9) — header de pagina (Plus, Search)
- `icon-sm` (h-8 w-8) — toolbars

**Adicionar prop helper `loading`:**
```tsx
<Button loading={isPending}>Salvar</Button>
// renderiza Loader2 + disabled automaticamente
```

Substitui em 8+ lugares onde se faz manualmente.

---

## 3. Fases de Melhoria

Cada fase e **mergeavel independentemente**. Ordem por impacto/esforco.

### FASE A — Tipografia + Tokens Globais (1 dia)

**Objetivo:** Acabar com fragmentacao tipografica de uma vez.

**Mudancas:**
1. **`globals.css`** (linha 222):
   ```css
   body {
     font-family: var(--font-sans), Arial, Helvetica, sans-serif;
     font-size: 14px;       /* novo */
     line-height: 1.5;      /* novo */
     letter-spacing: -0.005em; /* opcional, look moderno */
   }
   ```

2. **Criar `src/components/ui/typography.tsx`** com componentes:
   ```tsx
   <PageTitle>...</PageTitle>     // H1: text-lg font-semibold
   <SectionTitle>...</SectionTitle> // H2: text-base font-semibold
   <Label>...</Label>             // label: text-xs font-medium
   <Meta>...</Meta>               // meta: text-[11px] text-muted-foreground
   ```

3. **Find/replace orientado** (com revisao manual):
   - `text-[13px]` em headings/h1 → migrar para `<PageTitle>` (text-lg)
   - `text-[13px]` em corpo → `text-sm` (14px)
   - `text-[12px]` em labels → manter como `text-xs`
   - `text-[11px]` em helpers de input/form → considerar subir para `text-xs` (12px)
   - `text-[14px]` (font-medium em sidebar) → manter (item de menu)

**Arquivos afetados (priorizados):**
- `app/(app)/projects/page.tsx`
- `app/(app)/agents/page.tsx`
- `app/(app)/integrations/page.tsx`
- `app/(app)/intentions/inbox/page.tsx`
- `app/(app)/projects/[id]/automation/_components/*` (7 arquivos)
- `components/intentions/intention-detail.tsx`

**KPI:**
- Antes: 9 tamanhos arbitrarios em uso
- Depois: 6 niveis canonicos
- Antes: H1 das paginas em `text-[13px]`
- Depois: H1 em `text-lg font-semibold` (18px) — **+5px de respiro**
- Helper texts antes em `text-[11px]` → `text-xs` (12px). +1px de legibilidade

**Risco:** Layouts onde cabia exatamente 13px podem quebrar com 14px (textos cortados, scroll horizontal em tabelas). **Mitigacao:** revisar cada tabela apos mudanca, ajustar `truncate` e `max-width`.

**Exemplo antes/depois (`app/(app)/projects/page.tsx:42`):**

```tsx
// ANTES
<header className="flex h-11 shrink-0 items-center justify-between border-b border-border px-8">
  <h1 className="text-[13px] font-medium">Projetos</h1>
  <button className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground..."
          aria-label="Criar projeto">
    <Plus className="h-3.5 w-3.5" />
  </button>
</header>

// DEPOIS
<header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-6">
  <PageTitle>Projetos</PageTitle>  {/* text-lg font-semibold */}
  <Button size="sm" onClick={() => setNewProjectOpen(true)}>
    <Plus className="size-4" />
    Novo projeto
  </Button>
</header>
```

**Estimativa:** 6-8h
**Mergeavel sozinho:** SIM

---

### FASE B — Botoes e Componentes Compartilhados (1 dia)

**Objetivo:** Eliminar overrides de botao, criar `<Card>` e `<PageHeader>` reutilizaveis.

**Mudancas:**

1. **`button.tsx`** — adicionar prop `loading`:
   ```tsx
   loading?: boolean
   // se true: <Loader2 className="animate-spin" /> + disabled
   ```

2. **Criar `src/components/ui/card.tsx`** (existe em shadcn — adotar):
   - `<Card>` (rounded-md border border-border bg-card)
   - `<CardHeader>` (px-4 py-2.5 border-b border-border bg-card/40)
   - `<CardTitle>` (text-xs font-medium uppercase tracking-wide text-muted-foreground)
   - `<CardContent>` (p-4)
   - `<CardFooter>` (px-4 py-3 border-t border-border)

3. **Criar `src/components/common/page-header.tsx`**:
   ```tsx
   <PageHeader
     title="Projetos"
     subtitle="Gerencie seus projetos da organizacao"
     actions={<Button>...</Button>}
     breadcrumb={[{label: "Projects", href: "/projects"}, ...]}
   />
   ```
   Padroniza altura (h-14, 56px), padding (px-6), tipografia.

4. **Migrar telas-piloto** (criticas para validar):
   - `app/(app)/projects/page.tsx` (header + tabela + empty state)
   - `app/(app)/agents/page.tsx` (header + tabela)
   - `app/(app)/intentions/inbox/page.tsx` (header)

5. **Padronizar botoes destrutivos:**
   - `agent-link-form.tsx:130-139` Desvincular → `variant="destructive"` ou `variant="outline" className="border-destructive text-destructive hover:bg-destructive/10"`
   - Procurar todos os `text-destructive` aplicados a `variant="ghost"` e converter

6. **Substituir botao customizado em empty states** (`projects/page.tsx:320`):
   ```tsx
   // antes: inline-flex custom
   // depois: <Button><Plus />Novo projeto</Button>
   ```

**KPI:**
- Antes: 0 ocorrencias de `<Card>` reutilizavel; 6+ implementacoes ad-hoc
- Depois: 100% das telas migradas usam `<Card>`
- Antes: Botao primario das telas indistinguivel visualmente do secundario
- Depois: Acao primaria (Salvar/Criar/Vincular) sempre `default` variant; secundarias sempre `outline` ou `ghost`
- Antes: 8+ implementacoes manuais de loading state
- Depois: `<Button loading>` em toda parte

**Risco:** PR pode ficar grande se mexer em muitas telas. **Mitigacao:** Fase B1 (criar componentes + migrar 3 telas piloto) e Fase B2 (migrar resto).

**Estimativa:** 8-10h (B1: 5h, B2: 5h)
**Mergeavel sozinho:** SIM (B1 sozinho ja agrega valor)

---

### FASE C — Polish da Pagina Automation (1.5 dia)

**Objetivo:** A pagina recem-mexida e a mais critica visualmente. Tem 9 problemas. Polir em destaque.

**Mudancas:**

1. **Layout: Tabs em vez de stack vertical** (`automation/page.tsx:75-123`)

   Hoje: 7 secoes empilhadas, scroll longo.
   Proposta: Tabs no topo:
   ```
   [Configuracao] [Execucoes] [Aprovacoes (2)] [Historico]
   ```
   - "Configuracao": Status, Claude Cred, Vinculo Agente, Git Credentials (4 cards)
   - "Execucoes": ExecuteIntentionPanel
   - "Aprovacoes": ApprovalQueuePanel (badge com count)
   - "Historico": ExecutionHistory

   **KPI:** Reduz scroll de ~1500px para ~600px por tab.

2. **AgentLinkForm: progressive disclosure** (`agent-link-form.tsx`)

   Campos basicos visiveis: Agente, Path, Branch.
   Campos avancados (collapsible "Opcoes avancadas"): RepoURL, gitBotEmail, gitBotName, Timeout.

   ```tsx
   <details>
     <summary className="text-sm">Opcoes avancadas</summary>
     {/* RepoURL, BotEmail, BotName, Timeout */}
   </details>
   ```

3. **ExecuteIntentionPanel: confirm dialog mais informativo** (`execute-intention-panel.tsx:100-148`)

   Hoje: mostra so nome + risco.
   Proposta:
   ```
   ┌──────────────────────────────────────────┐
   │ Confirmar execucao                       │
   ├──────────────────────────────────────────┤
   │ Intencao:                                │
   │ "Adicionar tema escuro"                  │
   │                                          │
   │ Risco: [HIGH] (exigira aprovacao manual) │
   │                                          │
   │ Sera executado em:                       │
   │ • Agente: prod-vps-1 (online)            │
   │ • Branch: main                           │
   │ • Path: /home/scrumban/projects/dinpayz  │
   │                                          │
   │ O que acontece a seguir:                 │
   │ 1. Claude Code recebe a intencao         │
   │ 2. Cria branch scrumban/auto-<id>        │
   │ 3. Abre PR ao terminar                   │
   │                                          │
   │ Timeout: 30 minutos                      │
   ├──────────────────────────────────────────┤
   │  [Cancelar]  [Confirmar execucao]        │
   └──────────────────────────────────────────┘
   ```

4. **Botoes destacados:**
   - "Vincular agente" → `default` (primary) — hoje e `size="sm"` discreto
   - "Desvincular" → `outline` com cor destrutiva (em vez de ghost)
   - "Executar" (na lista de tasks) → `default` size="sm" (em vez de outline). Pode parecer pesado, mas e a acao principal da pagina

5. **Empty states melhores:**
   - Sem agente vinculado: ilustracao + CTA "Vincular agente"
   - Sem execucoes: "Nenhuma execucao ainda. Crie uma intencao no projeto e clique 'Executar'."

**Arquivos afetados:**
- `app/(app)/projects/[id]/automation/page.tsx`
- `_components/agent-link-form.tsx`
- `_components/execute-intention-panel.tsx`
- `_components/agent-status-card.tsx`
- `_components/git-credentials-panel.tsx`
- `_components/claude-credential-card.tsx`
- `_components/approval-queue-panel.tsx`
- `_components/execution-history.tsx`

**KPI:**
- Antes: 7 cards empilhados, scroll ~1500px, sem hierarquia clara
- Depois: 4 tabs, scroll medio ~500px por tab, hierarquia por funcao
- Antes: Form de vinculo com 7 campos abertos (intimidador para primeiro uso)
- Depois: 3 campos basicos + "Avancadas" colapsavel
- Antes: Confirm dialog de 100 caracteres de info
- Depois: Confirm dialog de 350 caracteres com bullet points (mais info, mais confianca)

**Risco:** Mudanca de layout drastica pode confundir usuario que ja se acostumou. **Mitigacao:** manter URLs estaveis (cada tab podia ter `?tab=config|execute|...`). Permitir bookmark.

**Estimativa:** 10-12h
**Mergeavel sozinho:** SIM

---

### FASE D — Microinteracoes, Atalhos e Empty States (1 dia)

**Objetivo:** Soltar o "fluxo rigido" mencionado pelo usuario.

**Mudancas:**

1. **Atalhos de teclado consistentes** (criar `src/lib/hooks/use-shortcuts.ts`):
   - `Cmd+K` — busca global (ja existe — manter)
   - `C` — nova issue (ja existe — manter)
   - `Esc` — fechar modal/dialog (Radix ja faz por default — auditar overrides)
   - `Enter` — submit em forms simples (auditar)
   - `?` — abrir cheat-sheet de atalhos (NOVO)

2. **Cheat-sheet de atalhos** (modal `<KeyboardShortcuts/>`):
   - Acessivel via `?` e via icone "?" no footer da sidebar (substituir HelpCircle)
   - Lista todos os atalhos com kbd visual

3. **Empty states humanizados:**
   - Inbox vazio: ja tem "Hora de uma pausa?" — manter ✓
   - Projects vazio: melhorar (ilustracao + 2 CTAs: "Criar projeto" + "Importar")
   - Tasks vazio: "Nenhuma issue ainda. Pressione **C** para criar uma."
   - Sem execucoes: ja proposto na Fase C

4. **Loading states padronizados:**
   - Substituir `bg-muted rounded animate-pulse` por componente `<Skeleton>` (shadcn)
   - Usar shape parecido com o conteudo final (skeleton high-fidelity)

5. **Feedback de submit:**
   - Apos `Salvar`/`Vincular`, mostrar **inline** "Salvo" verde por 2s alem do toast
   - Form fica em readonly por 500ms (visual de "processando" — nao so spinner)

6. **Transicoes:**
   - Auditar `transition-colors` em links: garantir `duration-150` consistente (alguns tem 200ms, outros 100ms)
   - Hover em rows de tabela: `hover:bg-accent/40` — manter, mas adicionar `transition-colors duration-100`

7. **Tooltips em icon-buttons:**
   - Hoje todos usam `title=""` (browser tooltip — feio, lento)
   - Migrar para `<Tooltip>` (shadcn ja tem TooltipProvider em layout.tsx)

**KPI:**
- Antes: 0 cheat-sheet de atalhos, usuario descobre por acaso
- Depois: `?` revela todos. Onboarding mais rapido
- Antes: Tooltips nativos browser (laggy, sem estilo)
- Depois: Tooltips shadcn estilizados, 200ms delay
- Antes: Loading com retangulo cinza generico
- Depois: Skeleton com shape do conteudo final
- Antes: Submit so feedback toast (3s, 1 vez)
- Depois: Toast + estado inline visual de 2s

**Risco:** Tooltips em todos os icones pode ficar barulhento. **Mitigacao:** so em botoes nao-obvios (icones que ja tem texto ao lado dispensam tooltip).

**Estimativa:** 6-8h
**Mergeavel sozinho:** SIM

---

### FASE E (OPCIONAL) — Mobile Polish (1-2 dias)

**Objetivo:** A app foi declarada mobile-first em commits passados, mas auditoria mostra mistura.

**Mudancas (alto nivel — refinar em plano dedicado):**
- Tabelas com overflow horizontal claros
- Sidebars (Inbox detail) responsivas
- Tap targets 44px minimo
- Rotacao landscape testada
- Bottom-nav em telas pequenas (sidebar collapsa)

**Recomendacao:** Fora do escopo desta task. Plano separado.

---

### FASE F (OPCIONAL) — Pages tier 2 (Settings, Onboarding, Auth)

**Objetivo:** Aplicar tokens da Fase A em paginas de baixa visibilidade.

**Recomendacao:** Apos validacao das Fases A-D, criar plano dedicado. Risco baixo, prioridade baixa.

---

## 4. Trade-offs e Riscos

### Risco 1: Aumentar fontes pode quebrar layouts densos

**Probabilidade:** Media. **Impacto:** Medio.

Aumento de 13→14px em corpo + 13→18px em H1 vai reflowar tabelas e headers.

**Mitigacao:**
- Cada Fase tem PR proprio. Test visual em dark + light antes de merge.
- Cobrir 5 paginas top em screenshots (manualmente, antes/depois)
- Permitir que o dev rode `dev` server e clique em todas as 11 paginas auditadas

### Risco 2: "Mexer onde nao precisa"

**Probabilidade:** Baixa. **Impacto:** Baixo.

Padronizar botoes pode parecer churn. Mas evidencia 11+ overrides hoje justifica.

**Mitigacao:** Cada fase tem KPI mensuravel. Fase B nao avanca para B2 sem aprovacao de B1.

### Risco 3: Mobile responsividade

**Probabilidade:** Media. **Impacto:** Alto se quebrar.

Mudancas de h-9 → h-10 em botoes podem afetar mobile.

**Mitigacao:** Fora do escopo (Fase E). Manter h-9 default, nao escalar agora.

### Risco 4: Inspiracao Linear x design proprio

**Probabilidade:** Baixa. **Impacto:** Subjetivo.

Subir corpo de 13→14px afasta um pouco do Linear-clone. Pode parecer "menos pro".

**Mitigacao:** Linear hoje (2026) usa 14px de corpo. Plano respeita densidade Linear (manter padding tight, espacamentos curtos), apenas legibiliza.

### Risco 5: Testes frontend automatizados nao existem

**Probabilidade:** 100% (P3-T13 esta no backlog).

Sem regressao automatica, mudancas visuais sao validadas por olho humano.

**Mitigacao:** Planejar polish em paralelo com P3-T13 (testes frontend). Mas nao bloquear esta task — mudancas visuais sao reversiveis.

---

## 5. KPI Globais

### Score de Polish (mensuravel via grep)

| Metrica | Antes | Meta Fase A | Meta Fase B | Meta Fase D |
|---------|-------|-------------|-------------|-------------|
| Ocorrencias de `text-[13px]` em codigo | ~80 | <10 | 0 | 0 |
| Ocorrencias de `text-[11px]` | ~40 | ~30 | ~25 | <20 |
| Botoes com `<Button>` (vs custom) | ~85% | 85% | 100% | 100% |
| Cards usando `<Card>` reutilizavel | 0% | 0% | 80% | 100% |
| Headers usando `<PageHeader>` | 0% | 0% | 80% | 100% |
| H1 da pagina em `text-[13px]` | 4 paginas | 0 | 0 | 0 |
| Tooltips em icon-buttons (vs `title=`) | <5% | <5% | <5% | >80% |

### KPIs de fluxo (qualitativos — testar com 1-2 usuarios apos cada fase)

- **Tempo "abrir Automation → vincular agente":** medir antes (Fase B inicio) vs depois (Fase C fim). Meta: -30%.
- **Erros visuais reportados pelo dev (subjetivo):** "fonte pequena", "botao perdido", "fluxo confuso". Meta: 0 mencoes apos Fase D.
- **Acessibilidade WCAG AA — texto:** corpo de 14px+ atinge 4.5:1 contrast. Auditar com browser devtools (Lighthouse).

### Comandos para validar (rodar antes/depois)

```bash
# Contar uso de tamanhos arbitrarios
rg "text-\[1[0-5]px\]" src/ -c | sort -t: -k2 -nr | head -20

# Verificar h-6 ou h-7 em botoes (tap target)
rg "Button.*h-[67]" src/ -c

# Botoes com text-[12px] override (sintoma de desuso de variants)
rg "Button.*text-\[12px\]" src/

# Cards ad-hoc
rg "rounded-(md|lg) border.*bg-card" src/ -l
```

---

## 6. Ordem Recomendada de Execucao

```
Dia 1: Fase A (Tipografia)
  └─ PR #1: feat(frontend): padroniza tipografia (6 niveis)
  └─ Validar: dev abre 11 paginas, confirma legibilidade

Dia 2: Fase B1 (Componentes compartilhados)
  └─ PR #2: feat(frontend): adiciona Card, PageHeader, Button.loading
  └─ Migra 3 telas piloto (Projects, Agents, Inbox)

Dia 3: Fase B2 (Migracao restante)
  └─ PR #3: refactor(frontend): migra Automation/Intentions para Card+PageHeader

Dia 4-5: Fase C (Polish Automation)
  └─ PR #4: feat(automation): tabs + progressive disclosure + confirm rico
  └─ Validar: dev executa fluxo completo (vincular -> executar -> aprovar)

Dia 6: Fase D (Microinteracoes)
  └─ PR #5: feat(frontend): atalhos (?), tooltips, skeletons, empty states
```

**Total:** 6 dias uteis. Cada PR mergeavel sozinho. Pausas/iteracoes entre PRs OK.

---

## 7. Criterios de Sucesso

### Must Have (bloqueiam aprovacao)
- [x] Body global em 14px (`globals.css`)
- [x] H1 das 4 paginas top em `text-lg font-semibold` (18px)
- [x] `<PageHeader>` e `<Card>` criados e usados em pelo menos 4 telas
- [x] Botao primario sempre destacavel do secundario nas formas auditadas
- [x] Pagina Automation com tabs (4 grupos)
- [x] Confirm dialog do Execute mostra branch + path + timeout

### Should Have (gera valor mas nao bloqueia)
- [ ] `<Button loading>` substituindo 8+ implementacoes manuais
- [ ] Tooltips shadcn em icon-buttons sem texto
- [ ] Cheat-sheet `?` de atalhos
- [ ] Empty states humanizados em 5+ telas
- [ ] Eliminar todos os `text-[13px]` (find/replace)

### Could Have (futuro)
- [ ] Mobile responsivo (Fase E — plano dedicado)
- [ ] Settings/Onboarding (Fase F — plano dedicado)
- [ ] Animacoes Framer Motion mais ricas (page transitions ja existe)

---

## Handoff para Implementer

**Resumo executivo:**
- Auditei 11 arquivos, identifiquei 35 problemas concretos com linhas exatas
- Defini sistema tipografico de 6 niveis (vs 9 ad-hoc atuais)
- Criei plano em 4 fases (A=Tipografia, B=Componentes, C=Automation, D=Microinteracoes)
- Cada fase entra em PR proprio mergeavel sozinho
- Total: 6 dias uteis para Fases A-D. Fases E, F (mobile, settings) ficam para planos futuros

**Comece por:** Fase A (tipografia + tokens globais). E a base para todas as outras. Sem ela, mexer em botoes/cards e tapar buraco com pano molhado.

**Nao comece por:** Fase C (Automation polish) sem Fase A+B feitos. Voce vai padronizar componentes que vao mudar.

**Antes de cada PR, rode:**
```bash
npm run build
npm run lint
```

E **abra `localhost:3001` em dark mode + light mode** e clique nas 11 paginas auditadas. Polish UI sem teste visual e cego.

**Memoria (decisoes-chave a salvar para futuras tasks):**
- Body em 14px decidido em 2026-05-07 (afasta-se de Linear-puro 13px, ganha legibilidade)
- 6 niveis tipograficos sao o canone agora — qualquer text-[Npx] novo deve ser justificado
- Cards sempre via `<Card>` componente — proibido `rounded-md border bg-card` ad-hoc

---

**FIM DO PLANO**
