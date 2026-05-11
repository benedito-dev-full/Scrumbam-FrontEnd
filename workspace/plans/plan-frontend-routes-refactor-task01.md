# PLANO DETALHADO - Task 01: Frontend Routes Refactor

**Criado por:** Strategist Agent
**Data:** 2026-05-07
**Modulo:** frontend (Next.js App Router)
**Repositorio:** /Users/devaritecnologia/Documents/Benedito/Scrumbam-FrontEnd
**Estimativa Total:** 1h30 a 2h
**Principios V3 Impactados:** Nenhum direto (refactor estrutural de UI). Indireto P5/P9 — URLs estaveis melhoram experiencia de fluxo.

---

## 0. Triagem de Clareza

Intencao avaliada como **CLARA** — todos criterios atendidos:

- C1 Problema: definido (rotas semanticamente confusas)
- C2 Escopo: delimitado (paths, restricoes, entregaveis explicitos)
- C3 Modulo: identificavel (frontend, App Router)
- C4 Ambiguidade critica: resolvida pelo dev — naming final eh `/projects/[id]/issues/[issueId]`

**Decisao herdada do dev (registrada para memoria):**
- Path da issue usa segmento `issues` (nao `intentions`) na URL final, mas componentes e copy interna podem manter "intencao/intencoes" (vocabulario de produto). URL eh ingles tecnico; UI eh pt-BR.
- Justificativa: alinhamento com convencoes de issue tracker (GitHub/Jira), facilita compreensao em logs/links externos.

---

## 1. Analise

### Contexto

O frontend Scrumban tem hoje uma divisao confusa entre `/intentions/*` e `/projects/*`:

- `/projects` lista projetos, mas ao clicar redireciona para `/intentions/[projectId]` (overview do projeto). Isso quebra a expectativa do usuario.
- `/intentions/[projectId]/[intentionId]` segura o detalhe da issue dentro de uma rota cujo nome (`intentions`) sugere algo global, nao escopado a projeto.
- `/intentions/inbox` e `/intentions/new` SAO realmente globais (cross-project) — esses ficam como estao.

A solucao eh **separar semantica por escopo**:

- `/intentions/*` = operacoes cross-project (inbox, criacao global)
- `/projects/[id]/*` = tudo escopado a um projeto (overview, issues, automation)

### Estado Atual (verificado pelo dev no enunciado)

- `src/app/(app)/projects/page.tsx` lista projetos, com `router.push` apontando para `/intentions/${chave}` (linha 122)
- `src/app/(app)/projects/[id]/page.tsx` NAO EXISTE (gap arquitetural)
- `src/app/(app)/projects/[id]/automation/*` JA existe
- `src/app/(app)/intentions/[projectId]/page.tsx` segura overview do projeto
- `src/app/(app)/intentions/[projectId]/[intentionId]/page.tsx` segura detalhe da issue
- Refs cruzados em `src/components/intentions/intention-detail.tsx`, `new-issue-modal.tsx`, `inbox/page.tsx`

### Principios V3 Relevantes

- **P9 (Projeto Autonomo):** URLs do tipo `/projects/[id]/*` reforcam que cada projeto eh uma unidade autonoma de navegacao
- **Pilar 2 do Devari (DRY):** sem impacto — backend nao muda, eh refactor 100% frontend

---

## 2. Abordagem Escolhida

### Solucao

Refactor sistematico em 4 ondas:

1. **Onda 1 (estrutura):** Mover os 2 page.tsx de `intentions/[projectId]` para `projects/[id]`, adaptando param name (`projectId` -> `id`) e segmento `[intentionId]` -> `issues/[issueId]`.
2. **Onda 2 (refs):** Atualizar TODOS os `Link href`, `router.push`, e qualquer string magica apontando pras URLs antigas.
3. **Onda 3 (compat):** Adicionar redirects 308 em `next.config.ts` para preservar bookmarks externos.
4. **Onda 4 (validacao):** Smoke test manual + build + lint + grep final para garantir 0 ocorrencias residuais.

### Justificativa

- Move arquivos antes de atualizar refs: minimiza janela de quebra (refs antigos quebram primeiro, mostrando erros TS/build claros que guiam a busca)
- Redirects 308 (permanent) preservam SEO e bookmarks
- Regex `(\\d+)` evita conflito com `/intentions/inbox` e `/intentions/new` (palavras nao numericas)

### Alternativas Consideradas

| Alternativa | Pros | Contras | Decisao |
|---|---|---|---|
| Refactor incremental (deixar /intentions/[projectId] como redirect Next page) | Zero risco de quebra durante migracao | Codigo duplicado durante transicao, dois lugares pra manter | REJEITADA — escopo eh small (1-2h), refactor direto eh mais limpo |
| Manter `intentions` no path final (so renomear hierarquia) | Menor diff | Nao resolve o problema semantico (rota continua confusa) | REJEITADA — perde o ponto da task |
| Refactor + remover redirects (URLs antigas dao 404) | Mais limpo | Quebra bookmarks externos, links em emails antigos | REJEITADA — backward compat eh requisito explicito |
| **Refactor + redirects 308 (escolhida)** | Limpa estrutura, preserva compat, baixo risco | Adiciona ~10 linhas em next.config.ts | ESCOLHIDA |

---

## 3. Avaliacao de Pilares

### Pilar 1: Engine/Operacao — N/A
Refactor 100% frontend, zero toque em backend ou banco.

### Pilar 2: Endpoints Genericos — N/A
APIs backend nao mudam. Hooks `useProject`, `useTasks`, etc. continuam consumindo as mesmas rotas REST.

### Pilar 3: Seed de Classes — N/A
Sem mudanca de schema, classes ou taxonomia.

---

## 4. Estrutura Tecnica

### 4.1 Arquivos a Mover

| Origem | Destino |
|---|---|
| `src/app/(app)/intentions/[projectId]/page.tsx` | `src/app/(app)/projects/[id]/page.tsx` |
| `src/app/(app)/intentions/[projectId]/[intentionId]/page.tsx` | `src/app/(app)/projects/[id]/issues/[issueId]/page.tsx` |

**Adaptacoes obrigatorias dentro dos arquivos movidos:**

a) **Param name:** Next.js App Router le params via `useParams()` ou prop `params`. Trocar todas as ocorrencias internas:
   - `params.projectId` -> `params.id`
   - `params.intentionId` -> `params.issueId`
   - Tipos: `{ projectId: string }` -> `{ id: string }`, `{ projectId: string; intentionId: string }` -> `{ id: string; issueId: string }`

b) **Refs internos do proprio page** (ex: link "voltar" que apontava pra `/intentions/${projectId}` deve virar `/projects/${id}`).

c) **Variaveis locais:** se o componente tinha `const projectId = params.projectId`, manter esse nome interno (`projectId` faz sentido semanticamente), mas vir de `params.id`. Ex:
   ```ts
   const { id: projectId } = params; // ou via useParams
   ```
   Isso minimiza diff dentro do componente.

### 4.2 Diretorios a Remover (apos move)

```
src/app/(app)/intentions/[projectId]/[intentionId]/  -> deletar (apos mover)
src/app/(app)/intentions/[projectId]/                -> deletar (apos mover, ficara vazio)
```

**Manter:**
```
src/app/(app)/intentions/inbox/     -> NAO TOCAR
src/app/(app)/intentions/new/       -> NAO TOCAR (se existir)
src/app/(app)/intentions/page.tsx   -> NAO TOCAR (se existir, eh global)
```

### 4.3 Refs a Atualizar (mapeamento minimo conhecido)

| Arquivo | Linha | Mudanca |
|---|---|---|
| `src/app/(app)/projects/page.tsx` | 122 | `router.push(\`/intentions/${p.chave}\`)` -> `router.push(\`/projects/${p.chave}\`)` |
| `src/app/(app)/intentions/inbox/page.tsx` | 318-324 | 3 hrefs `/intentions/${X}` -> `/projects/${X}` (verificar cada um, manter se for inbox-internal) |
| `src/app/(app)/projects/[id]/page.tsx` (apos move) | 258 | `href={\`/intentions/${projectId}/${i.id}\`}` -> `href={\`/projects/${projectId}/issues/${i.id}\`}` |
| `src/app/(app)/projects/[id]/issues/[issueId]/page.tsx` (apos move) | 108, 122 | `push` + `href` apontando pra `/intentions/${projectId}` -> `/projects/${projectId}` |
| `src/components/intentions/intention-detail.tsx` | 197 | `href={\`/intentions/${projectId}\`}` -> `href={\`/projects/${projectId}\`}` |
| `src/components/intentions/new-issue-modal.tsx` | 73 | comentario — atualizar texto pra `/projects/[id]` |

### 4.4 Grep Adicional Obrigatorio (Implementer DEVE rodar)

Antes de fechar a task, rodar TODOS estes greps no `src/`:

```bash
# 1. Strings literais com numero (URLs hardcoded)
grep -rn "/intentions/[0-9]" src/

# 2. Template literals que usam path /intentions/
grep -rn 'intentions/\${' src/
grep -rn '`/intentions/' src/

# 3. router.push e Link href apontando pra intentions com param
grep -rnE "(href|push)\\(?[\"'\`]/intentions/" src/

# 4. Possiveis menções em testes (se houver Playwright/Cypress/Vitest)
grep -rn "/intentions/" tests/ e2e/ __tests__/ 2>/dev/null

# 5. Arquivos que usam useParams com projectId/intentionId (sera renomeado)
grep -rn "intentionId" src/
grep -rn "useParams" src/ | grep -i intention
```

**Regra:** Apos refactor, os greps 1-4 devem retornar APENAS:
- `/intentions/inbox` (OK, mantido)
- `/intentions/new` (OK, mantido se existir)
- Comentarios explicativos sobre o redirect

Qualquer outro match indica ref residual nao migrada.

### 4.5 next.config.ts — Redirects

Adicionar (ou estender se ja existir bloco `redirects`):

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // ... config existente

  async redirects() {
    return [
      // Backward compat: rotas antigas /intentions/[projectId] -> /projects/[id]
      // Regex (\\d+) garante que /intentions/inbox e /intentions/new NAO sejam afetados
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
  },
};

export default nextConfig;
```

**Nota tecnica:** `(\\d+)` no source casa apenas digitos. `inbox` e `new` (strings) nao casam, entao essas rotas seguem normalmente para a pagina /intentions/inbox/page.tsx e /intentions/new/page.tsx.

**Atencao:** Se `next.config.ts` ja tiver outras configs (basePath, headers, images), apenas adicionar a chave `redirects` no objeto, NAO sobrescrever.

### 4.6 Endpoints REST — Sem Mudanca

```
GET /api/v1/projects/:id              (sem mudanca)
GET /api/v1/tasks?projectId=X         (sem mudanca)
PUT /api/v1/tasks/:id/status          (sem mudanca)
```

Refactor eh 100% client-side. Hooks TanStack Query (`useProject`, `useTasks`, `useIntention`) seguem como estao.

### 4.7 Queries Prisma — N/A

Sem mudanca de banco.

---

## 5. Plano de Implementacao (Fases)

### Fase 1 — Reconhecimento (10min)

1. Rodar todos os greps da secao 4.4 e salvar output. Esse vira a checklist da Fase 3.
2. Confirmar que `src/app/(app)/intentions/page.tsx` (root) nao existe ou eh trivial. Se existir, decidir: manter como eh (root global) ou avaliar.
3. Ler ambos os page.tsx que serao movidos pra entender se ha `'use client'`, `metadata`, ou imports relativos que vao quebrar.

### Fase 2 — Mover Arquivos (15min)

1. Criar diretorios destino:
   ```bash
   mkdir -p src/app/(app)/projects/[id]/issues/[issueId]
   ```
2. Mover (preservar git history com `git mv`):
   ```bash
   git mv "src/app/(app)/intentions/[projectId]/page.tsx" "src/app/(app)/projects/[id]/page.tsx"
   git mv "src/app/(app)/intentions/[projectId]/[intentionId]/page.tsx" "src/app/(app)/projects/[id]/issues/[issueId]/page.tsx"
   ```
3. Remover diretorios vazios:
   ```bash
   rmdir "src/app/(app)/intentions/[projectId]/[intentionId]"
   rmdir "src/app/(app)/intentions/[projectId]"
   ```
4. **Dentro de `projects/[id]/page.tsx`:** trocar `params.projectId` por `params.id` (manter variavel local `projectId` mapeada de `params.id` se isso minimiza diff).
5. **Dentro de `projects/[id]/issues/[issueId]/page.tsx`:** trocar `params.projectId` -> `params.id` e `params.intentionId` -> `params.issueId`. Atualizar tipos.
6. Atualizar imports relativos se algum quebrou (provavel zero — imports devem ser via alias `@/`).

### Fase 3 — Atualizar Refs (30min)

1. Tomar a lista de matches do grep da Fase 1.
2. Para cada match, decidir:
   - Se eh URL `/intentions/<numero>/<numero>` -> trocar pra `/projects/<numero>/issues/<numero>`
   - Se eh URL `/intentions/<numero>` -> trocar pra `/projects/<numero>`
   - Se eh `/intentions/inbox` ou `/intentions/new` -> NAO TOCAR
   - Se eh comentario de codigo -> atualizar texto se mencionar URL antiga
3. Atualizar param destructuring onde aparece `intentionId`:
   ```ts
   // antes
   const { projectId, intentionId } = params;
   // depois
   const { id, issueId } = params;
   const projectId = id;        // se quiser preservar nome local
   const intentionId = issueId; // se quiser preservar nome local
   ```
4. Atualizar comentario em `new-issue-modal.tsx:73` que menciona path antigo.

### Fase 4 — Adicionar Redirects (10min)

1. Abrir `next.config.ts`.
2. Adicionar bloco `redirects` conforme secao 4.5.
3. Se config ja tiver redirects, mesclar (nao sobrescrever).

### Fase 5 — Validacao (25min)

1. **TypeScript:** `npm run typecheck` ou `tsc --noEmit` -> 0 erros
2. **Build:** `npm run build` -> PASS, todas as rotas listadas
3. **ESLint:** `npm run lint` -> clean
4. **Grep final:** rodar greps da secao 4.4 -> apenas `inbox`, `new`, e referencias intencionais devem aparecer
5. **Smoke test manual** (rodar `npm run dev`):
   - [ ] `/projects` lista projetos
   - [ ] Click num projeto -> URL vira `/projects/<id>` (overview do projeto carrega)
   - [ ] Kanban da overview funciona
   - [ ] Click numa issue do kanban -> URL vira `/projects/<id>/issues/<issueId>` (detalhe carrega)
   - [ ] Botao "voltar" no detalhe -> volta pra `/projects/<id>`
   - [ ] `/intentions/inbox` abre normalmente (nao redireciona)
   - [ ] Botao "Nova issue" / modal funciona com `defaultProjectId`
   - [ ] `/projects/<id>/automation` continua funcionando
6. **Validar redirects:**
   - [ ] Acessar `http://localhost:3000/intentions/39` direto -> deve cair em `/projects/39` (308)
   - [ ] Acessar `http://localhost:3000/intentions/39/123` direto -> deve cair em `/projects/39/issues/123` (308)
   - [ ] Verificar via DevTools Network que status code eh 308

---

## 6. Estimativa de Tempo

| Fase | Tempo |
|---|---|
| Fase 1 — Reconhecimento (greps) | 10 min |
| Fase 2 — Mover arquivos + adaptar params | 15 min |
| Fase 3 — Atualizar refs | 30 min |
| Fase 4 — Redirects | 10 min |
| Fase 5 — Validacao + smoke | 25 min |
| **Subtotal** | **1h30** |
| Buffer 20% (imprevistos: refs escondidos, tipos quebrando) | 20 min |
| **Total** | **~1h50** |

---

## 7. Riscos e Mitigacoes

| ID | Risco | Probabilidade | Impacto | Mitigacao |
|---|---|---|---|---|
| R-A | Link em componente nao-obvio (sidebar, breadcrumb, card embutido) quebra | Media | Medio | Grep abrangente (4.4) cobre 95%; smoke manual da Fase 5 captura o resto |
| R-B | Dynamic import com path string magica (raro mas possivel) | Baixa | Alto | Grep `'/intentions/'` (com aspas simples e templates) cobre. Se aparecer, tratar caso a caso |
| R-C | Testes E2E (Playwright/Cypress) com URLs hardcoded | Media | Baixo | Grep em `tests/`, `e2e/`, `__tests__/`. Se houver, atualizar URLs |
| R-D | sitemap.xml ou OG metadata com URL hardcoded | Baixa | Baixo | Grep em `public/`, `app/sitemap.ts`, `metadata` exports. Atualizar se houver |
| R-E | TanStack Query cache key dependendo de path (raro) | Muito baixa | Baixo | TanStack Query usa query keys explicitas, nao path. Validar se algum hook usa `usePathname` como key |
| R-F | Param name inconsistente entre Next.js e codigo do componente | Alta | Medio | Documentado na secao 4.1 — usar destructuring com rename: `const { id: projectId } = params` |
| R-G | Build do Next.js falhar por causa de [intentionId] residual em filesystem | Baixa | Alto | Fase 2 inclui `rmdir` explicito. Se Next.js detectar diretorio fantasma, rebuild limpo (`rm -rf .next`) |
| R-H | next.config.ts ja ter `redirects()` e merge ser sobrescrito | Baixa | Medio | Fase 4 instrui mesclar, nao sobrescrever. Implementer deve ler antes de editar |

---

## 8. Criterios de Sucesso

**MUST (bloqueante):**

- [ ] Os 2 page.tsx movidos com `git mv` (history preservado)
- [ ] `params.projectId` -> `params.id` e `params.intentionId` -> `params.issueId` em ambos os arquivos movidos
- [ ] Diretorios `src/app/(app)/intentions/[projectId]/` removidos
- [ ] `/intentions/inbox` e `/intentions/new` (se existir) intactos
- [ ] `next.config.ts` com redirects 308 funcionando
- [ ] Acesso direto a `/intentions/39` redireciona pra `/projects/39` com status 308
- [ ] `npm run build` PASS
- [ ] `npm run typecheck` (ou `tsc --noEmit`) com 0 erros
- [ ] `npm run lint` clean
- [ ] Grep `/intentions/[0-9]` em `src/` retorna 0 matches
- [ ] Grep `intentions/\${` em `src/` retorna 0 matches (exceto eventual comentario explicito)
- [ ] Smoke test manual: 5 fluxos da Fase 5 passam
- [ ] Modal "Nova issue" continua funcionando com `defaultProjectId`

**SHOULD (importante mas nao bloqueante):**

- [ ] Comentario em `new-issue-modal.tsx:73` atualizado pra refletir nova URL
- [ ] Se houver testes E2E, URLs antigas atualizadas
- [ ] PR com diff limpo (commits semanticos: 1 commit pra mover, 1 pra refs, 1 pra redirects)

**COULD (nice to have):**

- [ ] Adicionar comentario em `next.config.ts` explicando regex `(\\d+)` e o porque dos redirects
- [ ] Adicionar entry no CHANGELOG do frontend (se existir)

---

## Handoff para Implementer

**Ordem estrita de execucao:** Fase 1 -> 2 -> 3 -> 4 -> 5. Nao pular para Fase 4 antes de Fase 3 estar 100%.

**Comandos chave:**

```bash
# Fase 1 - reconhecimento
cd /Users/devaritecnologia/Documents/Benedito/Scrumbam-FrontEnd
grep -rn "/intentions/[0-9]" src/ > /tmp/refs-old.txt
grep -rn 'intentions/\${' src/ >> /tmp/refs-old.txt
grep -rn '`/intentions/' src/ >> /tmp/refs-old.txt
grep -rnE "(href|push)\\(?[\"'\`]/intentions/" src/ >> /tmp/refs-old.txt

# Fase 2 - move
mkdir -p "src/app/(app)/projects/[id]/issues/[issueId]"
git mv "src/app/(app)/intentions/[projectId]/page.tsx" "src/app/(app)/projects/[id]/page.tsx"
git mv "src/app/(app)/intentions/[projectId]/[intentionId]/page.tsx" "src/app/(app)/projects/[id]/issues/[issueId]/page.tsx"
rmdir "src/app/(app)/intentions/[projectId]/[intentionId]"
rmdir "src/app/(app)/intentions/[projectId]"

# Fase 5 - validacao
npm run build
npm run lint
npx tsc --noEmit
grep -rn "/intentions/[0-9]" src/  # esperado: 0 matches
```

**Pontos criticos:**

1. **NAO TOCAR** em `intentions/inbox`, `intentions/new`, ou root `intentions/page.tsx`.
2. Param `projectId` interno em variaveis locais pode ser preservado via destructuring rename — minimiza diff.
3. Redirects 308 usam regex `(\\d+)` — testar literalmente os 2 casos (sem numero deve seguir caminho normal).
4. Se algum hook usar `usePathname()` pra construir links, atualizar a logica (provavel: `Activity Timeline`, breadcrumbs).
5. Apos terminar, rodar `rm -rf .next && npm run build` uma vez pra garantir que cache antigo nao mascarou erro.

**Contato Strategist:** se durante a Fase 3 aparecer ref em local nao mapeado (ex: arquivo de copy/i18n, OG metadata, componente de tour onboarding), pausar e reportar — pode ser necessario refinar plano.

---

**Validacao do plano:**
- 8 secoes obrigatorias presentes (Triagem como secao 0, ate Criterios como secao 8)
- Alternativas consideradas: 4 (>= 2 requerido)
- Nomenclatura: `plan-frontend-routes-refactor-task01.md` (modulo `frontend` valido como escopo de UI; modulos backend nao se aplicam)
- Tamanho: ~280 linhas (dentro do range 200-400)
