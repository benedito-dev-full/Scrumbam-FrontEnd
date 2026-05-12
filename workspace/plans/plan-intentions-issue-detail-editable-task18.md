# PLANO DETALHADO — Task 18: Tornar página de detalhe da issue editável (Frontend)

**Criado por:** Strategist Agent V2
**Data:** 2026-05-11
**Módulo:** intentions (frontend Next.js — escopo Scrumban V3)
**Fase V2:** N/A (trabalho de frontend, V2 backend já pronto)
**ADRs vinculados:** ADR-V2-009 (Sprints/Workflow Statuses como wrappers thin — princípio da UI espelhar V2), naming `intentions` ↔ `tasks` (memória `project_frontend_routes_naming_decisao`)
**Estimativa Total:** 45-60 min (impl) + 10 min smoke
**Complexidade:** Média

---

## 1. Análise

### Contexto

O CEO autorizou tornar editável a página `/projects/[id]/issues/[issueId]/page.tsx` (746 linhas). Hoje TODOS os campos são read-only, exibindo dados que o V2 já persiste mas não permitindo mutação. Pior: a página renderiza condicionalmente um `DescriptionBody` com campos V3 (`problema`, `contexto`, `solucaoProposta`, `criteriosAceite`, `naoObjetivos`, `riscos`) que o V2 **não persiste** — esses campos sempre retornam vazios do backend, então o fallback "Adicione uma descricao..." é sempre exibido para issues criadas via V2.

O V2 já aceita 5 campos editáveis via `PUT /tasks/:id` (`nome`, `descricao`, `priority`, `assigneeId`, `taskType`) + `PUT /tasks/:id/status` (state machine com 9 estados V3) + `PUT /tasks/:id/sprint` (fora deste escopo). O frontend já tem todos os hooks necessários implementados — falta apenas wire-up na UI.

### Estado Atual

**Arquivo:** `src/app/(app)/projects/[id]/issues/[issueId]/page.tsx`

| Elemento | Linha aprox. | Comportamento atual | Comportamento desejado |
|---|---|---|---|
| `<h1>{i.title}</h1>` | 188-190 | Display puro | Inline editor (clica → input → salva on-blur) |
| `i.problema \|\| i.contexto \|\| i.solucaoProposta ? <DescriptionBody/> : <p>Adicione...</p>` | 192-198 | Render condicional inútil (V2 não persiste esses campos) | Textarea editável com auto-save debounced (`descricao` real do V2) |
| `<PropRow label="Status" ...>` | 499-503 | Display | Popover com 9 opções V3 → `useMoveStatus` |
| `<PropRow label="Prioridade" ...>` | 504-511 | Display | Popover com 4 opções → `useUpdateTask({priority})` |
| `<PropRow label="Responsavel" ...>` | 512-519 | Display | Popover com membros da org + "Sem responsável" → `useUpdateTask({assigneeId})` |
| `<PropRow label="Projeto" ...>` | 520-524 | Display | **Mantém read-only** (mover task entre projetos fora escopo) |
| `<PropRow label="Estimativa" ...>` | 525-532 | Display de `i.apetiteDias` (V2 não persiste) | **REMOVER** |
| `<PropRow label="Etiquetas" ...>` | 533-541 | Display stub (Gap #14) | **REMOVER** |
| `<SubscribersPanel/>` | 547-566 | Stub "Em breve" (Gap #8) | **REMOVER do JSX** |
| `<LinkedIssuesPanel/>` | 568-589 | Stub "Em breve" (Gap #17) | **REMOVER do JSX** |
| `<SubIssuesPanel/>` | 591-612 | Stub "Em breve" (Gap #19) | **REMOVER do JSX** |
| **Falta:** Tipo (taskType) | — | Não exibido | **ADICIONAR** PropRow "Tipo" com popover (5 opções) → `useUpdateTask({taskType})` |

### Decisões Passadas Relevantes (ADRs V2)

- **Memória `project_frontend_routes_naming_decisao`:** path técnico `/projects/[id]/issues/[issueId]` mantém "intentions" como copy UI (cross-project) e "issues" como rota dentro do projeto. Confirmado aplicar.
- **Memória `project_frontend_typography_decisao`:** body=14px (`text-[13px]` é OK), reusar componentes, evitar tamanhos ad-hoc. Aplicar.
- **`intentionsApi.update()` em `src/lib/api/intentions.ts`:** já mapeia `title→nome`, `priority→V2 enum`, `type→taskType` — não inventar nova rota. Reusar.
- **`useMoveStatus()` em `use-intentions.ts` (linha 284):** já invalida query `["intentions"]` e mostra toast de erro. Não tem toast de sucesso — adicionar inline ou aceitar silêncio.
- **`useUpdateIntention()` em `use-intentions.ts` (linha 176):** **este é o hook canônico para este caso**, não `useUpdateTask` (que invalida `QUERY_KEYS.tasks(projectId)` — chave errada para a tela de detalhe). Confirmação crítica: `useUpdateIntention` invalida `["intentions"]` (correto para o page).
- **`useOrgMembers(orgId)`:** retorna `{ data: OrgMember[], isLoading }`. orgId vem do `auth-store`. Se ausente na primeira render, popover fica vazio com loading state.

---

## 2. Abordagem Escolhida

### Solução

Refatorar **apenas** `src/app/(app)/projects/[id]/issues/[issueId]/page.tsx` para:

1. **Título:** componente inline novo `EditableTitle` (não reusar `CardTitleEditor` — esse depende do tipo `Task` legado e tem estilo de h2; aqui queremos h1 24px).
2. **Descrição:** componente inline novo `EditableDescription` (textarea com debounce de 1500ms + save on-blur). Não reusar `CardDescriptionEditor` — esse depende do tipo `Task` legado e tem label `Descricao` fixo; aqui queremos sem label (UX Linear-like).
3. **Status / Prioridade / Responsável / Tipo:** **um único componente genérico** `EditableProperty` que renderiza um `<button>` (com ícone + valor) e, ao clicar, abre um `Popover` com lista de opções clicáveis. Mesma estrutura do `new-issue-modal.tsx`.
4. **Mutations:** usar `useUpdateIntention()` (existente) para `title`, `description`, `priority`, `type` (taskType). Para `assigneeId`, **estender `useUpdateIntention`** OU adicionar override local — ver Subseção F2 abaixo.
5. **Status:** usar `useMoveStatus()` (existente).
6. **Remoções:** deletar JSX dos três Panels stub + 2 PropRows (Estimativa, Etiquetas) + DescriptionBody condicional.

### Justificativa

- **Inline editor em vez de componentes reusáveis (`CardTitleEditor`/`CardDescriptionEditor`):** esses componentes aceitam tipo `Task` (não `IntentionDocument`) e têm estilos fixos (h2, label "Descricao"). Adaptar custaria mais que escrever inline novo (~40 linhas cada). Os componentes legados continuam existindo para outras telas.
- **Popover único `EditableProperty`:** 4 campos (Status/Prioridade/Responsável/Tipo) compartilham 100% do padrão UI (botão → popover → lista). Componente genérico evita duplicação. ~60 linhas.
- **`useUpdateIntention` em vez de `useUpdateTask`:** este último invalida `QUERY_KEYS.tasks(projectId)` (board) mas **não** invalida `QUERY_KEYS.intentions.detail(id)` (tela atual). `useUpdateIntention` invalida `["intentions"]` (prefix match → invalida list E detail). Correto para esta página.
- **Re-fetch em vez de optimistic update:** simplicidade > UX micro-otimizada. React Query com `staleTime: 30s` + invalidate gera re-fetch <100ms na maioria dos casos. Optimistic adicionaria ~30 linhas e risco de rollback (R1). Não vale para esta primeira iteração.
- **Auto-save em vez de botão "Salvar":** alinhado com Linear/Notion (UX que o CEO admira) e com o `CardDescriptionEditor` existente (precedente interno).

### Alternativas Consideradas

| # | Alternativa | Prós | Contras | Decisão |
|---|---|---|---|---|
| 1 | **(ESCOLHIDA)** Inline editors + Popover genérico + re-fetch | Mínimo código novo, reusa hooks/API, baixo risco | Sem UX instantâneo (espera response) | ✅ |
| 2 | Reusar `CardTitleEditor`/`CardDescriptionEditor` | Menos linhas novas | Forçaria adapter `IntentionDocument → Task` ou refator dos componentes (~80 linhas a mais total) | ❌ Custo > benefício |
| 3 | Optimistic updates em todas as mutations | UX instantâneo | +30 linhas, rollback complexo se V2 rejeitar (R1). Riscoso para state machine de status. | ❌ Adiar (Documenter pode anotar como follow-up) |
| 4 | Botão "Salvar" explícito em cada campo | Clareza de intenção | Quebra padrão Linear/Notion, mais cliques, mais código | ❌ |
| 5 | Mover lógica para `<IssueDetailEditor>` (componente externo) | Page.tsx fica mais limpa | +1 arquivo, +imports, sem benefício de reuso (página é única) | ❌ Manter inline no page.tsx |

---

## 3. Avaliação dos 3 Pilares

### Pilar 1: Engine/Operação

**N/A.** Esta é mudança 100% frontend. Backend V2 já implementa `PUT /tasks/:id` e `PUT /tasks/:id/status` (que internamente passam pelo Engine quando aplicável). Frontend só consome.

### Pilar 2: Endpoints Genéricos

**N/A para esta task.** Os endpoints `/tasks/:id` e `/tasks/:id/status` são específicos (controllers próprios justificados por lógica de Engine + state machine). Frontend reusa hooks que já apontam para esses endpoints.

### Pilar 3: Seed de Classes

**N/A.** Nenhuma DClasse nova. Listas de opções (status/priority/type) usam enums hardcoded no frontend que já espelham os seeds V2 (`STATUS_IDS`, `PRIORITY_IDS`, `TYPE_IDS` em `src/types/intention.ts`).

### Genericidade (template vs V2-específico)

Mudança 100% V2-frontend-específica. Sem impacto no template Devari-Core.

---

## 4. Estrutura Técnica

### Arquivos a Criar

Nenhum. Tudo inline em `page.tsx`.

### Arquivos a Modificar

| Arquivo | Mudança | Linhas estimadas |
|---|---|---|
| `src/app/(app)/projects/[id]/issues/[issueId]/page.tsx` | Refatorar título, descrição, PropertiesPanel; remover 3 panels; adicionar mutations | +180 / -90 (net +90) |

### Possíveis Arquivos Auxiliares a Modificar (verificar durante impl)

| Arquivo | Verificar | Ação esperada |
|---|---|---|
| `src/lib/api/intentions.ts` | `update()` aceita `assigneeId`? **NÃO aceita hoje** (linha 143-169 só processa `title/priority/type`). | **Estender** `update()` para aceitar `assigneeId` (string) e `description` (mapear para `descricao`). Ver F2 abaixo. |
| `src/types/intention.ts` | `IntentionDocument` tem `assignee`? Não — só `assigneeId` implícito via mapper. | Adicionar `assigneeId?: string \| null` ao tipo (já vem do `task-to-intention` adapter? verificar). |

### Endpoints REST consumidos (já existentes — sem alteração no backend)

```
PUT /tasks/:id            { nome?, descricao?, priority?, assigneeId?, taskType? }
PUT /tasks/:id/status     { status }   (V3 enum maiúsculo)
```

### Queries Prisma

N/A (frontend).

### Eventos Emitidos

N/A (backend já emite — sem mudança).

---

## 5. Plano de Implementação

### Fase 1 — Estender `intentionsApi.update()` para aceitar `assigneeId` e `descricao` (BLOQUEANTE)

**Arquivo:** `src/lib/api/intentions.ts` (linhas 143-169).

Adicionar no `update()`:

```ts
// Após o bloco de `fields.type`:
if ('assigneeId' in fields) {
  // null/undefined explicitamente removem o responsável
  payload.assigneeId = fields.assigneeId ?? null;
}
// Aceitar descrição (V2 persiste `descricao`)
if ('description' in fields || 'descricao' in (fields as Record<string, unknown>)) {
  payload.descricao = (fields as { description?: string; descricao?: string }).description
    ?? (fields as { descricao?: string }).descricao;
}
```

**Justificativa:** `IntentionDocument` não tem `assigneeId` no tipo, mas o adapter `mapTaskToIntention` já popula `assignee.chave`. A page precisa passar `assigneeId` no update. Aceitar via `Partial<IntentionDocument>` exige ampliar o tipo OU fazer cast no caller.

**Decisão de tipo:** ampliar `IntentionDocument`:

```ts
// src/types/intention.ts (adicionar ao IntentionDocument)
assigneeId?: string | null;
description?: string;  // alias para "descricao" — frontend pode usar qualquer um
```

Verificar se `task-to-intention.ts` popula esse campo. Se não, adicionar.

### Fase 2 — Refatorar `<h1>{i.title}</h1>` para `<EditableTitle/>`

**Componente novo (inline no page.tsx):**

```tsx
function EditableTitle({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setText(value), [value]);
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const trimmed = text.trim();
    if (trimmed.length < 3) {
      toast.error("Titulo precisa ter ao menos 3 caracteres");
      setText(value);
      return;
    }
    if (trimmed.length > 512) {
      toast.error("Titulo nao pode passar de 512 caracteres");
      setText(value);
      return;
    }
    if (trimmed !== value) onSave(trimmed);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); commit(); }
          if (e.key === "Escape") { setText(value); setEditing(false); }
        }}
        className="w-full bg-transparent text-2xl font-semibold tracking-tight border-none outline-none focus:ring-0 px-0"
      />
    );
  }

  return (
    <h1
      role="button"
      tabIndex={0}
      onClick={() => setEditing(true)}
      onKeyDown={(e) => { if (e.key === "Enter") setEditing(true); }}
      className="text-2xl font-semibold tracking-tight cursor-text rounded -mx-1 px-1 hover:bg-muted/40 transition-colors"
    >
      {value}
    </h1>
  );
}
```

Substituir linhas 188-190 por:
```tsx
<EditableTitle value={i.title} onSave={(nome) => updateIntention(intentionId, { title: nome })} />
```

### Fase 3 — Refatorar descrição para `<EditableDescription/>`

**Componente novo (inline):**

```tsx
function EditableDescription({
  value,
  onSave,
}: {
  value: string;
  onSave: (v: string) => void;
}) {
  const [text, setText] = useState(value);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  useEffect(() => setText(value), [value]);

  const triggerSave = (newVal: string) => {
    if (newVal === value) return;
    if (newVal.length > 10000) {
      toast.error("Descricao nao pode passar de 10000 caracteres");
      return;
    }
    setStatus("saving");
    onSaveRef.current(newVal);
    setTimeout(() => setStatus("saved"), 500);
    setTimeout(() => setStatus("idle"), 2500);
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-end h-3">
        {status === "saving" && (
          <span className="text-[11px] text-muted-foreground animate-pulse">Salvando...</span>
        )}
        {status === "saved" && (
          <span className="text-[11px] text-emerald-500">Salvo</span>
        )}
      </div>
      <textarea
        value={text}
        onChange={(e) => {
          const v = e.target.value;
          setText(v);
          setStatus("idle");
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => triggerSave(v), 1500);
        }}
        onBlur={() => {
          if (debounceRef.current) {
            clearTimeout(debounceRef.current);
            debounceRef.current = null;
          }
          triggerSave(text);
        }}
        placeholder="Adicione uma descricao..."
        rows={5}
        className="w-full resize-y rounded-md border border-transparent hover:border-border focus:border-border bg-transparent px-2 py-1.5 text-[13px] leading-relaxed focus:outline-none placeholder:text-muted-foreground/60 transition-colors"
      />
    </div>
  );
}
```

Substituir linhas 192-198 por:
```tsx
<EditableDescription
  value={i.description ?? ""}
  onSave={(descricao) => updateIntention(intentionId, { description: descricao })}
/>
```

**REMOVER completamente** as funções `DescriptionBody`, `Block`, `ListBlock` (linhas 258-301). Não são mais usadas.

### Fase 4 — Componente genérico `<EditableProperty/>` + Popover

**Componente novo (inline):**

```tsx
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface EditableOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

function EditableProperty({
  label,
  current,
  options,
  icon,
  onChange,
  loading,
  placeholder,
}: {
  label: string;
  current: { value: string; label: string } | null;
  options: EditableOption[];
  icon: React.ReactNode;
  onChange: (value: string) => void;
  loading?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const display = current?.label ?? placeholder ?? "Definir";
  const isStub = !current;

  return (
    <div className="flex items-center gap-2 py-0.5">
      <dt className="w-16 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="flex-1 min-w-0">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={loading}
              className={cn(
                "flex w-full items-center gap-1.5 rounded px-1 -mx-1 py-0.5 hover:bg-accent text-left truncate transition-colors",
                isStub && "text-muted-foreground/60",
              )}
            >
              {icon}
              <span className="truncate">{display}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-56 p-1">
            <ul className="max-h-72 overflow-auto">
              {options.map((opt) => (
                <li key={opt.value}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded px-2 py-1.5 text-[12px] hover:bg-accent transition-colors text-left",
                      current?.value === opt.value && "bg-accent/50 font-medium",
                    )}
                  >
                    {opt.icon}
                    <span className="truncate">{opt.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>
      </dd>
    </div>
  );
}
```

### Fase 5 — Refatorar `<PropertiesPanel/>` (linhas 480-545)

```tsx
function PropertiesPanel({
  intention: i,
  project,
  orgId,
  onUpdate,
  onMoveStatus,
}: {
  intention: (IntentionDocument & { assignee?: { chave: string; nome: string } | null }) | undefined;
  project: { nome: string } | undefined;
  orgId: string | undefined;
  onUpdate: (fields: Partial<IntentionDocument>) => void;
  onMoveStatus: (s: IntentionStatus) => void;
}) {
  const { data: members } = useOrgMembers(orgId);

  const statusOptions: EditableOption[] = (
    ["inbox", "ready", "validating", "validated", "executing", "done", "failed", "cancelled", "discarded"] as IntentionStatus[]
  ).map((s) => ({
    value: s,
    label: statusLabel(s),
    icon: <StatusIcon status={s} />,
  }));

  const priorityOptions: EditableOption[] = (
    ["urgent", "high", "medium", "low"] as IntentionPriority[]
  ).map((p) => ({ value: p, label: priorityLabel(p) }));

  const typeOptions: EditableOption[] = [
    { value: "feature", label: "Feature" },
    { value: "bug", label: "Bug" },
    { value: "improvement", label: "Melhoria" },
    { value: "review", label: "Review" },
    { value: "analysis", label: "Explain" },
  ];

  const assigneeOptions: EditableOption[] = [
    { value: "__none__", label: "Sem responsavel" },
    ...((members ?? []).map((m) => ({
      value: m.userId ?? m.chave ?? "",  // confirmar shape de OrgMember na impl
      label: m.nome ?? m.email ?? "Membro",
    }))),
  ];

  return (
    <section className="border-b border-border px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
          Propriedades
        </h3>
      </div>
      <dl className="space-y-2 text-[12px]">
        <EditableProperty
          label="Status"
          current={i?.status ? { value: i.status, label: statusLabel(i.status) } : null}
          options={statusOptions}
          icon={<StatusIcon status={i?.status ?? "inbox"} />}
          onChange={(v) => onMoveStatus(v as IntentionStatus)}
          placeholder="Definir status"
        />
        <EditableProperty
          label="Prioridade"
          current={i?.priority ? { value: i.priority, label: priorityLabel(i.priority) } : null}
          options={priorityOptions}
          icon={<MoreHorizontal className="h-3 w-3 shrink-0 text-muted-foreground/60" />}
          onChange={(v) => onUpdate({ priority: v as IntentionPriority })}
          placeholder="Definir prioridade"
        />
        <EditableProperty
          label="Responsavel"
          current={
            i?.assignee
              ? { value: i.assignee.chave, label: i.assignee.nome }
              : null
          }
          options={assigneeOptions}
          icon={<CircleDashed className="h-3 w-3 shrink-0 text-muted-foreground/60" />}
          onChange={(v) => onUpdate({ assigneeId: v === "__none__" ? null : v })}
          placeholder="Atribuir"
        />
        <EditableProperty
          label="Tipo"
          current={i?.type ? { value: i.type, label: typeLabel(i.type) } : null}
          options={typeOptions}
          icon={<CircleDashed className="h-3 w-3 shrink-0 text-muted-foreground/60" />}
          onChange={(v) => onUpdate({ type: v as IntentionType })}
          placeholder="Definir tipo"
        />
        {/* Projeto: read-only — mover task entre projetos fora de escopo */}
        <div className="flex items-center gap-2 py-0.5">
          <dt className="w-16 shrink-0 text-muted-foreground">Projeto</dt>
          <dd className="flex items-center gap-1.5 truncate">
            <Box className="h-3 w-3 shrink-0 text-muted-foreground" />
            {project?.nome ?? "—"}
          </dd>
        </div>
      </dl>
    </section>
  );
}

function typeLabel(t: IntentionType): string {
  const map: Record<string, string> = {
    feature: "Feature",
    bug: "Bug",
    improvement: "Melhoria",
    review: "Review",
    analysis: "Explain",
    code: "Code",
    documentation: "Documentacao",
    test: "Teste",
    refactor: "Refactor",
  };
  return map[t] ?? t;
}
```

**REMOVER** `PropRow Estimativa` (linhas 525-532) e `PropRow Etiquetas` (linhas 533-541) — não existem no `IntentionDocument` editável via V2.

### Fase 6 — Remover JSX dos 3 Panels stub

Em `<aside>` (linha 213-218), remover:
```tsx
<SubscribersPanel />
<LinkedIssuesPanel />
<SubIssuesPanel />
```

Manter apenas `<PropertiesPanel ... />`.

**Funções a deletar** (já não mais referenciadas):
- `SubscribersPanel` (linhas 547-566)
- `LinkedIssuesPanel` (linhas 568-589)
- `SubIssuesPanel` (linhas 591-612)
- `DescriptionBody` (linhas 258-275)
- `Block` (linhas 277-286)
- `ListBlock` (linhas 288-301)
- `PropRow` (linhas 618-645) — não mais usado

### Fase 7 — Wire-up no componente `IssueDetailPage`

Adicionar no topo do componente (linha ~78):

```tsx
import { useAuthStore } from "@/lib/auth-store";  // ou caminho equivalente
import { useUpdateIntention, useMoveStatus } from "@/lib/hooks/use-intentions";
import { useOrgMembers } from "@/lib/hooks/use-organization";

// dentro do componente:
const { update: updateIntentionFn } = useUpdateIntention();
const { move: moveStatusFn } = useMoveStatus();
const orgId = useAuthStore((s) => s.currentOrgId);  // confirmar nome do selector na impl

const handleUpdate = useCallback(
  (fields: Partial<IntentionDocument>) => {
    updateIntentionFn(intentionId, fields);
  },
  [intentionId, updateIntentionFn],
);

const handleMoveStatus = useCallback(
  (status: IntentionStatus) => {
    moveStatusFn(intentionId, status);
  },
  [intentionId, moveStatusFn],
);
```

Passar para `<EditableTitle>`, `<EditableDescription>`, `<PropertiesPanel>`.

### Fase 8 — Build + Lint

```bash
cd /Users/devaritecnologia/Documents/Benedito/Scrumbam-FrontEnd
npx tsc --noEmit
npx eslint src/app/\(app\)/projects/\[id\]/issues/\[issueId\]/page.tsx src/lib/api/intentions.ts src/types/intention.ts
```

**Aceitação:** zero erros, zero warnings novos.

---

## 6. Estimativa de Tempo (com buffer 20%)

| Fase | Estimativa base | Com buffer |
|---|---|---|
| Fase 1 (estender API + tipo) | 5 min | 6 min |
| Fase 2 (EditableTitle) | 8 min | 10 min |
| Fase 3 (EditableDescription) | 8 min | 10 min |
| Fase 4 (EditableProperty genérico) | 10 min | 12 min |
| Fase 5 (refator PropertiesPanel) | 10 min | 12 min |
| Fase 6 (remoções) | 3 min | 4 min |
| Fase 7 (wire-up no page) | 5 min | 6 min |
| Fase 8 (build + lint) | 5 min | 6 min |
| **Total** | **54 min** | **~66 min** |

---

## 7. Riscos e Mitigações

### Alto

**R-A1: Shape de `OrgMember` desconhecido.** O hook `useOrgMembers` retorna `organizationsApi.listUsers()`. Não inspecionei o tipo `OrgMember`. Campos prováveis: `userId`, `nome`, `email`, `chave`. **Mitigação:** Implementer deve abrir `src/types/index.ts` (ou onde `OrgMember` estiver definido) **antes** de codar a Fase 5 e ajustar `assigneeOptions` para mapear o campo correto que corresponde ao `assigneeId` esperado pelo V2 (chave DEntidade).

**R-A2: `assigneeId` no `IntentionDocument` pode estar ausente do adapter.** `mapTaskToIntention` em `src/lib/adapters/task-to-intention.ts` precisa expor `assigneeId` para o frontend ler o valor atual. **Mitigação:** Implementer deve abrir o adapter e adicionar `assigneeId: task.assigneeId ?? null` se ausente. Verificar também se `i.assignee.chave` (já usado na linha 514) é o mesmo que `assigneeId`.

### Médio

**R-M1: V2 valida `descricao` 0-10000 chars; UI valida só no upper bound.** Empty string vs null: V2 deve aceitar string vazia? **Mitigação:** Frontend envia `descricao: ""` (string vazia) em vez de `null` para limpar. Se V2 rejeitar, ajustar para enviar `null`.

**R-M2: `useMoveStatus` rejeita transições inválidas (V2 state machine).** Ex: `DONE → READY` retorna 400. UI hoje mostraria todas as 9 opções; usuário pode clicar em qualquer uma. **Mitigação:** Aceitar essa UX — o toast de erro do `useMoveStatus` (`Erro ao mover: ${error.message}`) informa o usuário. Não filtrar opções no frontend (V2 é fonte da verdade, evita drift). Documentar como follow-up: "futuramente, exibir só transições válidas via endpoint `/tasks/:id/allowed-transitions`" (não existe ainda).

**R-M3: `useMoveStatus` não mostra toast de sucesso.** Usuário pode achar que clique não fez nada. **Mitigação:** No `handleMoveStatus` do page, adicionar `toast.success("Status atualizado")` após chamar `moveStatusFn` (otimista; se falhar, o toast de erro do hook substitui). Trade-off aceitável.

### Baixo

**R-B1: `orgId` indisponível na primeira render.** `useOrgMembers(undefined)` retorna `data: undefined`. **Mitigação:** `assigneeOptions` fica com só `[{ value: "__none__", label: "Sem responsavel" }]` enquanto carrega. Aceitável — orgId carrega em <50ms na sessão autenticada.

**R-B2: `wipWarning` do `useMoveStatus`.** O `useMoveStatus` em `use-intentions.ts` (linha 284) **não trata `wipWarning`** — diferente do `useMoveTaskStatusFromDetail` em `use-card-detail.ts`. **Mitigação:** Aceitar comportamento atual (sem warning visível). Documenter pode anotar como follow-up.

**R-B3: Title com 0-2 chars no `onBlur` é rejeitado pelo V2 (3-512).** UI já valida client-side (Fase 2). **Mitigação:** Toast informativo + restaurar valor anterior. Já implementado no `commit()`.

---

## 8. Critérios de Sucesso

### MUST HAVE (sem isso, REJEITAR)

- [x] Título: clica → input editável → blur/Enter salva via `useUpdateIntention({ title })`
- [x] Título: Escape cancela edição
- [x] Título: validação 3-512 chars com toast de erro
- [x] Descrição: textarea sempre visível, auto-save após 1500ms de idle OU on-blur
- [x] Descrição: indicador visual "Salvando..." / "Salvo"
- [x] Status: popover com 9 opções V3 → `useMoveStatus` (toast de erro em 400)
- [x] Prioridade: popover com 4 opções → `useUpdateIntention({ priority })`
- [x] Responsável: popover com membros da org + "Sem responsável" → `useUpdateIntention({ assigneeId })`
- [x] Tipo: popover com 5 opções (Feature/Bug/Melhoria/Review/Explain) → `useUpdateIntention({ type })`
- [x] Projeto: read-only (mantém UX atual)
- [x] **REMOVIDOS** do JSX: PropRow Estimativa, PropRow Etiquetas, SubscribersPanel, LinkedIssuesPanel, SubIssuesPanel, render condicional DescriptionBody
- [x] **DELETADAS** as funções não mais usadas: `DescriptionBody`, `Block`, `ListBlock`, `SubscribersPanel`, `LinkedIssuesPanel`, `SubIssuesPanel`, `PropRow`
- [x] `npx tsc --noEmit` passa sem erros
- [x] `npx eslint` passa sem erros novos
- [x] React Query invalida `["intentions"]` em todas as mutations (re-fetch < 200ms)
- [x] Cada mutation tem toast de erro no `onError` (já garantido pelos hooks existentes)

### SHOULD HAVE

- [x] Toast de sucesso em mudança de status ("Status atualizado")
- [x] Hover state visível em todos os campos editáveis (cursor: text para texto, hover bg-accent para popover triggers)
- [x] Acessibilidade básica: `role="button"` + `tabIndex={0}` + `onKeyDown` Enter no título

### COULD HAVE (não bloqueia merge)

- [ ] Optimistic updates (rejeitado — adiar)
- [ ] Filtrar status options por transições válidas V2 (rejeitado — V2 não expõe ainda)
- [ ] Markdown rendering na descrição em modo read-only (fora escopo)
- [ ] Atalho `E` para focar título / `D` para focar descrição (fora escopo)

### WILL NOT HAVE (escopo desta task)

- [ ] Editar Projeto (mover task entre projetos)
- [ ] Editar Sprint (existe endpoint mas fora escopo)
- [ ] Editar Estimativa (V2 não persiste `apetiteDias`)
- [ ] Editar Etiquetas (Gap #14, sem backing V2)
- [ ] Inscritos / Linked Issues / Sub-issues (Gaps #8/#17/#19, sem backing V2)
- [ ] Editar `failureReason` (campo legado V3, sem editor)
- [ ] Hill chart inline editor (fora escopo)
- [ ] Markdown editor rico (fora escopo)
- [ ] Drag-and-drop de status (fora escopo)

---

## Handoff para Implementer

### Comandos para começar

```bash
cd /Users/devaritecnologia/Documents/Benedito/Scrumbam-FrontEnd

# 1. Confirmar shape de OrgMember (RISCO ALTO — fazer ANTES de codar Fase 5)
grep -rn "OrgMember\|orgMember\|listUsers" src/types/ src/lib/api/organizations.ts

# 2. Confirmar adapter mapTaskToIntention expõe assigneeId
grep -n "assigneeId\|assignee" src/lib/adapters/task-to-intention.ts

# 3. Confirmar nome do selector do auth-store para orgId
grep -rn "currentOrgId\|orgId" src/lib/auth-store.ts src/providers/

# 4. Após ajustes, build + lint
npx tsc --noEmit
npx eslint src/app/\(app\)/projects/\[id\]/issues/\[issueId\]/page.tsx
```

### Ordem de execução (estrita)

1. **Fase 1** — estender `intentionsApi.update()` + tipo `IntentionDocument` (BLOQUEANTE)
2. **Pré-Fase 5** — resolver R-A1 e R-A2 (5 min de leitura de tipos)
3. **Fase 2** — `EditableTitle`
4. **Fase 3** — `EditableDescription`
5. **Fase 4** — `EditableProperty`
6. **Fase 5** — refator `PropertiesPanel`
7. **Fase 6** — remoções JSX + funções mortas
8. **Fase 7** — wire-up no `IssueDetailPage`
9. **Fase 8** — build + lint

### Smoke test mental antes de entregar ao Reviewer

1. Abrir `/projects/<id>/issues/<issueId>` → ver título, descrição, painel direito reduzido (4 EditableProperties + Projeto read-only)
2. Clicar no título → vira input → digitar → blur → toast some, título atualiza
3. Digitar título com 2 chars → blur → toast erro, valor restaura
4. Clicar na descrição → digitar → ver "Salvando..." → "Salvo" → blur → fica salvo
5. Clicar em Status → popover abre com 9 opções → escolher uma → toast (ou silêncio se sucesso já — manter consistente)
6. Clicar em Prioridade → popover abre com 4 → escolher → atualiza
7. Clicar em Responsável → popover abre com membros + "Sem responsavel" → escolher um → atualiza
8. Clicar em Tipo → popover abre com 5 → escolher → atualiza
9. Verificar que NÃO existem mais: PropRow Estimativa, PropRow Etiquetas, blocos Inscritos/Issues Relacionadas/Sub-issues
10. F5 / refresh → todos os valores persistem (V2 salvou)

### Convencional commit (entregar ao Documenter)

```
feat(intentions): torna pagina de detalhe da issue editavel

- EditableTitle inline (clica -> input -> save on-blur/Enter, valida 3-512 chars)
- EditableDescription com auto-save debounced 1500ms + flush on-blur
- EditableProperty genérico (popover) para Status, Prioridade, Responsavel, Tipo
- Status usa useMoveStatus (state machine V2 valida transicoes)
- Prioridade/Tipo/Responsavel usam useUpdateIntention
- Responsavel popula via useOrgMembers + opcao "Sem responsavel"
- Remove PropRow Estimativa, PropRow Etiquetas (V2 nao persiste)
- Remove SubscribersPanel, LinkedIssuesPanel, SubIssuesPanel (Gaps #8/#17/#19)
- Remove DescriptionBody condicional (campos V3 problema/contexto/etc nao persistidos pelo V2)
- Estende intentionsApi.update() para aceitar assigneeId e descricao

Refs task#18
```

---

**Fim do plano.**
