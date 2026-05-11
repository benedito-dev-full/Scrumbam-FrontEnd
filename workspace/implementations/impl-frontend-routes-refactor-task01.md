# IMPL - Task 01: Frontend Routes Refactor

**Implementado por:** Implementer Agent
**Data:** 2026-05-07
**Plano:** `workspace/plans/plan-frontend-routes-refactor-task01.md`
**Repositorio:** `/Users/devaritecnologia/Documents/Benedito/Scrumbam-FrontEnd`
**Tempo:** ~50min

---

## Resumo

Refactor de rotas separando semantica por escopo:

- `/intentions/[projectId]` -> `/projects/[id]` (overview do projeto)
- `/intentions/[projectId]/[intentionId]` -> `/projects/[id]/issues/[issueId]` (detalhe da issue)
- `/intentions/inbox` e `/intentions/new` -> intactos (rotas globais cross-project)
- Redirects 308 em `next.config.ts` preservam bookmarks externos
- Param names atualizados (`projectId` -> `id`, `intentionId` -> `issueId`) com destructuring rename interno pra minimizar diff

---

## Fase 1 - Reconhecimento

Grep abrangente revelou refs em 12 arquivos. Lista exata:

```
src/app/(app)/projects/page.tsx:122                            (router.push)
src/app/(app)/projects/[id]/automation/page.tsx:63             (Link href)
src/app/(app)/intentions/[projectId]/page.tsx:258              (Link href interno)
src/app/(app)/intentions/[projectId]/[intentionId]/page.tsx:108,122 (router.push + Link interno)
src/app/(app)/intentions/page.tsx:292                          (root global, ref a issue)
src/app/(app)/intentions/inbox/page.tsx:318,321,324            (3 hrefs em buildEntityHref)
src/app/(app)/views/[viewId]/page.tsx:348                      (Link href)
src/components/intentions/intention-detail.tsx:197             (Link "voltar")
src/components/intentions/intention-list-item.tsx:118          (Link href)
src/components/intentions/views-toggle.tsx:24,30               (2 getHref)
src/components/intentions/new-issue-modal.tsx:73               (comentario JSDoc)
src/components/inbox/inbox-refinement.tsx:274                  (Link href)
src/components/common/command-palette.tsx:113,139              (2 router.push)
```

Refs que **NAO foram tocados** (legitimos):
- `src/app/(app)/settings/account/notifications/page.tsx:43` (`/intentions/inbox`)
- `src/lib/navigation.ts:70` (`/intentions/inbox`)
- `src/components/intentions/intention-list.tsx:141,173` (`/intentions/new`)
- `src/components/common/command-palette.tsx:202,210` (`/intentions/new`, `/intentions/inbox`)
- `src/app/(app)/intentions/page.tsx:293` (fallback `/intentions` quando sem projectSlug)
- Todos os imports `@/components/intentions/...` (paths de modulo, sem ligacao com URL)

---

## Fase 2 - Move (git mv)

```bash
mkdir -p "src/app/(app)/projects/[id]/issues/[issueId]"
git mv "src/app/(app)/intentions/[projectId]/page.tsx" \
       "src/app/(app)/projects/[id]/page.tsx"
git mv "src/app/(app)/intentions/[projectId]/[intentionId]/page.tsx" \
       "src/app/(app)/projects/[id]/issues/[issueId]/page.tsx"
rmdir "src/app/(app)/intentions/[projectId]/[intentionId]"
rmdir "src/app/(app)/intentions/[projectId]"
```

History do git preservado nos 2 arquivos movidos.

### Adaptacoes nos arquivos movidos

**`src/app/(app)/projects/[id]/page.tsx`:**
- `params: Promise<{ projectId: string }>` -> `params: Promise<{ id: string }>`
- `const { projectId } = use(params);` -> `const { id: projectId } = use(params);` (preserva variavel local)
- Linha 258: href `/intentions/${projectId}/${i.id}` -> `/projects/${projectId}/issues/${i.id}`

**`src/app/(app)/projects/[id]/issues/[issueId]/page.tsx`:**
- `params: Promise<{ projectId: string; intentionId: string }>` -> `params: Promise<{ id: string; issueId: string }>`
- `const { projectId, intentionId } = use(params);` -> `const { id: projectId, issueId: intentionId } = use(params);`
- Linha 108: `router.push('/intentions/${projectId}')` -> `router.push('/projects/${projectId}')`
- Linha 122: `href={'/intentions/${projectId}'}` -> `href={'/projects/${projectId}'}`

---

## Fase 3 - Refs externos atualizados

| Arquivo | Linha (original) | Mudanca |
|---|---|---|
| `src/app/(app)/projects/page.tsx` | 122 | `router.push('/intentions/${p.chave}')` -> `router.push('/projects/${p.chave}')` |
| `src/app/(app)/projects/[id]/automation/page.tsx` | 63 | `href={'/intentions/${id}'}` -> `href={'/projects/${id}'}` |
| `src/app/(app)/intentions/inbox/page.tsx` | 318 | `'/intentions/${pid}/${iid}'` -> `'/projects/${pid}/issues/${iid}'` |
| `src/app/(app)/intentions/inbox/page.tsx` | 321 | `'/intentions/${pid}/${tid}'` -> `'/projects/${pid}/issues/${tid}'` |
| `src/app/(app)/intentions/inbox/page.tsx` | 324 | `'/intentions/${pid}'` -> `'/projects/${pid}'` |
| `src/app/(app)/intentions/page.tsx` | 292 | `'/intentions/${slug}/${id}'` -> `'/projects/${slug}/issues/${id}'` (fallback `/intentions` mantido em 293) |
| `src/app/(app)/views/[viewId]/page.tsx` | 348 | `'/intentions/${slug}/${id}'` -> `'/projects/${slug}/issues/${id}'` |
| `src/components/inbox/inbox-refinement.tsx` | 274 | `href={'/intentions/${slug}/${id}'}` -> `href={'/projects/${slug}/issues/${id}'}` |
| `src/components/intentions/intention-detail.tsx` | 197 | `href={'/intentions/${projectId}'}` -> `href={'/projects/${projectId}'}` |
| `src/components/intentions/intention-list-item.tsx` | 118 | `href={'/intentions/${slug}/${id}'}` -> `href={'/projects/${slug}/issues/${id}'}` |
| `src/components/intentions/views-toggle.tsx` | 24 | `getHref: (pid) => '/intentions/${pid}'` -> `'/projects/${pid}'` |
| `src/components/intentions/views-toggle.tsx` | 30 | `getHref: (pid) => '/intentions/${pid}?view=hill'` -> `'/projects/${pid}?view=hill'` |
| `src/components/intentions/new-issue-modal.tsx` | 73 | comentario JSDoc atualizado pra `/projects/[id]` |
| `src/components/common/command-palette.tsx` | 113 | `router.push('/intentions/${task.project.id}')` -> `router.push('/projects/${task.project.id}')` |
| `src/components/common/command-palette.tsx` | 139 | `router.push('/intentions/${project.id}')` -> `router.push('/projects/${project.id}')` |

### Cleanup adicional

- `src/components/common/command-palette.tsx`: removido import `PieChart` nao usado (warning ESLint pre-existente que bloqueava o hook). Sem impacto funcional.

---

## Fase 4 - Redirects em next.config.ts

Adicionado bloco `redirects()` apos `headers()`:

```typescript
async redirects() {
  return [
    {
      source: '/intentions/:projectId(\\d+)',
      destination: '/projects/:projectId',
      permanent: true, // 308
    },
    {
      source: '/intentions/:projectId(\\d+)/:intentionId(\\d+)',
      destination: '/projects/:projectId/issues/:intentionId',
      permanent: true, // 308
    },
  ];
}
```

Regex `(\\d+)` garante que `/intentions/inbox` e `/intentions/new` (strings nao numericas) NAO entram nos redirects, seguindo direto pras paginas correspondentes.

---

## Fase 5 - Validacao

### TypeScript

```
$ rm -rf .next && npx tsc --noEmit
(zero output, exit code 0)
```

**Resultado: 0 erros.** (cache do Next foi limpo antes — tipos antigos do `.next/types/validator.ts` referenciavam paths removidos)

### Build

```
$ npm run build
Creating an optimized production build ...
✓ Compiled successfully in 4.1s
  Running TypeScript ...
  Finished TypeScript in 4.8s ...
✓ Generating static pages using 7 workers (37/37) in 309ms
```

**Rotas relevantes geradas (sample):**
```
○  /intentions
○  /intentions/inbox
○  /intentions/new
○  /projects
ƒ  /projects/[id]
ƒ  /projects/[id]/automation
ƒ  /projects/[id]/issues/[issueId]
```

Sem `/intentions/[projectId]` (foi removida com sucesso).
Sem warnings, sem erros.

### ESLint

```
$ npm run lint
> scrumban-frontend@0.1.0 lint
> eslint
(zero output, exit code 0)
```

**Resultado: clean.**

### Grep final de validacao

```
$ grep -rn "/intentions/" src/ --include="*.tsx" --include="*.ts" | grep -v ".test\."
```

Output (todos legitimos):
```
src/app/(app)/settings/account/notifications/page.tsx:43:    href: "/intentions/inbox",
src/app/(app)/projects/[id]/page.tsx:28:import { NewIssueModal } from "@/components/intentions/new-issue-modal";
src/app/(app)/intentions/new/page.tsx:3:import { IntentionWizard } from "@/components/intentions/intention-wizard";
src/components/intentions/intention-list.tsx:141:        <Link href="/intentions/new">
src/components/intentions/intention-list.tsx:173:          <Link href="/intentions/new">
src/components/common/command-palette.tsx:202:                  handleSelect(() => router.push("/intentions/new"))
src/components/common/command-palette.tsx:210:                  handleSelect(() => router.push("/intentions/inbox"))
src/components/common/app-sidebar.tsx:39:import { NewIssueModal } from "@/components/intentions/new-issue-modal";
src/lib/navigation.ts:70:    href: "/intentions/inbox",
```

Todas referencias restantes sao:
- `/intentions/inbox` (rota global preservada)
- `/intentions/new` (rota global preservada)
- imports `@/components/intentions/...` (paths de modulo, nao URLs)

**Zero refs residuais a `/intentions/[projectId]` ou `/intentions/[projectId]/[intentionId]`.**

---

## Fluxos pra usuario testar manualmente

Rodar `npm run dev` e validar:

### Navegacao basica
- [ ] Acessar `/projects` -> lista de projetos carrega
- [ ] Click em um projeto -> URL vira `/projects/<id>` (overview carrega: tabs, propriedades, painel direito)
- [ ] Tabs (Visao geral / Atividade / Issues / Metricas / Relatorios) funcionam
- [ ] Click numa issue listada na overview -> URL vira `/projects/<id>/issues/<issueId>` (detalhe carrega)
- [ ] No detalhe da issue, link "voltar" no breadcrumb -> volta pra `/projects/<id>` (nome do projeto)
- [ ] Botao "Excluir issue" -> apos confirmar, redireciona pra `/projects/<id>`
- [ ] Botao "Automacao" no header -> vai pra `/projects/<id>/automation`
- [ ] Em `/projects/<id>/automation`, breadcrumb "<projeto>" -> volta pra `/projects/<id>`

### Rotas globais (NAO podem redirecionar)
- [ ] `/intentions/inbox` abre normalmente (lista de notificacoes/triagem)
- [ ] `/intentions/new` abre normalmente (wizard)
- [ ] `/intentions` (root) abre normalmente (lista global)
- [ ] Click em item da inbox com `projectId+intentionId` -> vai pra `/projects/<pid>/issues/<iid>`
- [ ] Click em notificacao com so `projectId` -> vai pra `/projects/<pid>`

### Backward compat (redirects 308)
- [ ] Acessar `http://localhost:3001/intentions/39` -> deve redirecionar pra `/projects/39` (status 308 no DevTools Network)
- [ ] Acessar `http://localhost:3001/intentions/39/123` -> deve redirecionar pra `/projects/39/issues/123` (308)
- [ ] `http://localhost:3001/intentions/inbox` -> NAO redireciona, abre direto a inbox
- [ ] `http://localhost:3001/intentions/new` -> NAO redireciona, abre direto o wizard

### Search e command-palette
- [ ] Cmd+K -> abre command palette
- [ ] Buscar por task -> click leva pra `/projects/<projectId>` (overview do projeto, comportamento mantido)
- [ ] Buscar por projeto -> click leva pra `/projects/<id>`
- [ ] "Nova intencao" no palette -> abre `/intentions/new`
- [ ] "Inbox" no palette -> abre `/intentions/inbox`

### Componentes intermediarios
- [ ] `/views/<viewId>` -> click em issue da lista vai pra `/projects/<slug>/issues/<id>`
- [ ] Componente IntentionListItem (onde for usado) -> link funciona com novo path
- [ ] InboxRefinement -> click em intencao funciona com novo path
- [ ] ViewsToggle (se for usado em pagina) -> abas "Intencoes" e "Hill Chart" levam pra `/projects/<id>` e `/projects/<id>?view=hill`

### Modal Nova issue
- [ ] Em `/projects/<id>`, botao "Nova issue" abre modal com `defaultProjectId` preenchido
- [ ] Submeter o modal cria a issue corretamente

---

## Arquivos modificados (resumo)

```
Movidos (git mv, history preservado):
  src/app/(app)/intentions/[projectId]/page.tsx
    -> src/app/(app)/projects/[id]/page.tsx
  src/app/(app)/intentions/[projectId]/[intentionId]/page.tsx
    -> src/app/(app)/projects/[id]/issues/[issueId]/page.tsx

Removidos (diretorios vazios):
  src/app/(app)/intentions/[projectId]/[intentionId]/
  src/app/(app)/intentions/[projectId]/

Editados:
  next.config.ts                                            (+18 linhas, redirects)
  src/app/(app)/projects/page.tsx                           (1 linha)
  src/app/(app)/projects/[id]/page.tsx                      (3 linhas: params + href interno)
  src/app/(app)/projects/[id]/automation/page.tsx           (1 linha)
  src/app/(app)/projects/[id]/issues/[issueId]/page.tsx     (4 linhas: params + 2 hrefs internos)
  src/app/(app)/intentions/page.tsx                         (1 linha)
  src/app/(app)/intentions/inbox/page.tsx                   (3 linhas)
  src/app/(app)/views/[viewId]/page.tsx                     (1 linha)
  src/components/inbox/inbox-refinement.tsx                 (1 linha)
  src/components/intentions/intention-detail.tsx            (1 linha)
  src/components/intentions/intention-list-item.tsx         (1 linha)
  src/components/intentions/views-toggle.tsx                (2 linhas)
  src/components/intentions/new-issue-modal.tsx             (1 linha de comentario)
  src/components/common/command-palette.tsx                 (3 linhas: 2 hrefs + 1 import limpo)
```

---

## Criterios de Sucesso (do plano)

**MUST (todos atendidos):**
- [x] 2 page.tsx movidos com `git mv` (history preservado)
- [x] `params.projectId` -> `params.id` e `params.intentionId` -> `params.issueId`
- [x] Diretorios `intentions/[projectId]/` removidos
- [x] `/intentions/inbox` e `/intentions/new` intactos
- [x] `next.config.ts` com redirects 308 (regex `\\d+`)
- [x] `npm run build` PASS (37 rotas geradas)
- [x] `npx tsc --noEmit` 0 erros (apos limpar `.next` cache)
- [x] `npm run lint` clean
- [x] Grep `/intentions/[0-9]` em src retorna 0 matches
- [x] Grep `'/intentions/${'` em src retorna 0 matches

**SHOULD (atendidos):**
- [x] Comentario em `new-issue-modal.tsx:73` atualizado
- [x] Sem testes E2E identificados (skipped)

**Smoke test manual:** delegado ao usuario (lista acima).

---

## Observacoes

1. **ESLint warning pre-existente fixed:** `command-palette.tsx` tinha import `PieChart` nao usado, que bloqueava o hook ESLint do harness apos editar o arquivo. Removi pra desbloquear (fora do escopo, mas necessario pra concluir).
2. **Cache do Next.js:** `tsc --noEmit` reportou 4 erros iniciais apontando pra `validator.ts` em `.next/dev/types/` e `.next/types/`. Esses arquivos sao gerados pelo dev mode anterior e referenciavam paths antigos. `rm -rf .next` resolveu — comportamento esperado, ja antecipado pelo plano (R-G).
3. **Comportamento search/command-palette preservado:** click em task no palette continua indo pra overview do projeto (nao pro detalhe da issue), igual ao comportamento antigo. Se isso for desejavel mudar, e nova task.
4. **Variaveis locais `projectId` e `intentionId` mantidas** dentro dos page components movidos (via destructuring rename), o que minimizou o diff e preservou semantica do codigo interno.
