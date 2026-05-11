# IMPL — Properties Panel no detalhe do projeto

**Data:** 2026-05-08
**Modulo:** projects (frontend-only)
**Backend:** ZERO mudancas — reusa `PATCH /projects/:id` (existente)
**Plan:** seguido sem desvios estruturais

## Arquivos

### Criados (1)
- `src/components/projects/project-properties-panel.tsx` (~410 linhas)
  - Sheet right, responsive, `showCloseButton={false}`, X custom no top-LEFT
  - Width 420px desktop / full mobile
  - Sub-componente `EditableField` (text | textarea | date | team-select)
  - Sub-componente `ReadonlyField` (com copy para `chave`)
  - Sub-componente `FieldRow` (layout label 96px + valor + spinner)
  - Save aguarda resposta (nao otimista), spinner localizado por campo
  - ADMIN edita / MEMBER ve display sem hover-lapis nem click-to-edit

### Modificados (1)
- `src/app/(app)/projects/[id]/page.tsx`
  - Import `SlidersHorizontal` (lucide) + `ProjectPropertiesPanel`
  - State `propertiesOpen` / `setPropertiesOpen`
  - Botao no header (apos Bell, antes do Cpu de Automacao) com `h-6 w-6` + icon `h-3.5 w-3.5` (mesmo padrao dos demais)
  - Render do `<ProjectPropertiesPanel>` no fim do JSX

### NAO modificados (conforme plano)
- `src/components/ui/sheet.tsx`
- `src/components/projects/edit-project-modal.tsx`
- `src/lib/hooks/use-projects.ts` (reusa `useUpdateProject`)
- `src/lib/api/projects.ts`
- Backend, schema, migrations

## Tipo do project — observacao importante

`useProject(id)` retorna `ProjectDetail` (de `src/types/project.ts`), nao `Project`. Em runtime os campos `taskCount` e `teamId` existem (graças ao spread `...mapProject(data)` em `projectsApi.getById`), mas o tipo TS declarado nao os tem.

Para nao mexer no contrato existente, declarei prop type localmente:
```ts
type ProjectLike =
  | Project
  | (ProjectDetail & { taskCount?: number; teamId?: string | null });
```

## Padrao de save por campo

- **Nome (text):** Enter / blur dispara `mutate({ id: project.chave, dto: { nome } })`
- **Descricao (textarea):** Cmd/Ctrl+Enter / blur dispara `dto: { descricao }`. Enter normal insere quebra de linha
- **Time (team-select):** abre Select aberto auto, onValueChange salva imediato com `idTeam: id` ou `idTeam: null` (para "Sem time")
- **Data (date):** input nativo `type="date"`, Enter / blur salva com `dto: { startDate: 'YYYY-MM-DD' }` (camelCase, conforme `UpdateProjectDto`)

Esc cancela e restaura valor original.

`savingField` (state local) controla qual campo mostra `Loader2`. Ao concluir mutation (`onSettled`), `setSavingField(null)`.

## RBAC

`useAuthStore((s) => s.user?.role)` + `userRole?.toUpperCase() === "ADMIN"` (mesmo padrao de `/projects/page.tsx`). Quando `disabled=true`:
- Sem hover-lapis
- Click no campo nao faz nada (`disabled` no botao)
- `title="Apenas administradores podem editar"`

## Verificacoes

- TypeScript: 0 errors (`npx tsc --noEmit` exit 0)
- ESLint: 0 warnings nos arquivos modificados (max-warnings 0)
- Next build: PASS (35 rotas)
- Backend: ZERO mudancas (confirmado)

## Coordenacao

Antes de comecar, `git status` mostrou que `src/app/(app)/projects/[id]/page.tsx` e `src/components/ui/sheet.tsx` NAO estavam modificados por outras tasks. Nenhum conflito.

Existem outros plans paralelos no workspace (routes-refactor, error-boundaries, ux-polish, edit-project, mock-data) — nenhum toca a area afetada por esta task.

## Decisoes incrementais (nao documentadas no plano)

1. **`SheetTitle` com `sr-only`** — Radix exige por acessibilidade. Plano falava de "header com X custom + titulo 'Propriedades'", entao usei o titulo sem `sr-only` no header visual + `SheetTitle` invisivel para screen readers. Isso evita duplicacao visual e mantem a11y.

2. **`team-select` com `open` controlado** — Para UX melhor, ao entrar em modo edicao do team, o Select ja abre automaticamente; fechado sem selecao volta ao modo display.

3. **Width 420px** — usei `sm:w-[420px] sm:max-w-[420px]` conforme plano. Sheet com `responsive` da full-width em mobile (`inset-0` < sm) e largura customizada em sm+.

4. **`shape ProjectLike`** — necessario porque `useProject` retorna `ProjectDetail` (que NAO declara `taskCount`/`teamId` no tipo, embora existam em runtime). Plano nao previa isso; resolvi sem refatorar tipos compartilhados (escopo limpo).

## Surpresas / desvios

Nenhum desvio funcional do plano. Tipo `ProjectLike` adicionado e a unica deviation, justificada pela divergencia entre tipo declarado e dados reais ja existente no codebase.

## NAO commitado

Conforme instrucoes — nao foi criado commit. Arquivos prontos para review.
