# ADR-V2-031 — Modal de Detalhe de Task (Intercepting Routes + Parallel Slots)

- **Status:** Aceito
- **Data:** 2026-05-12
- **Escopo:** Frontend / App Router
- **Relacionados:** ADR-V2-029 (teamId), CHANGELOG `Página de Detalhe da Issue Editável` (12/05/2026)

## Contexto

A página standalone de detalhe de issue (`/projects/[id]/issues/[issueId]`) já existia e
era totalmente funcional — 962 linhas concentrando header, body com edição inline,
properties panel, activity e comments. Funcionava, mas o fluxo "clique numa task da
lista para abri-la" forçava uma navegação dura: a lista desaparecia, o usuário perdia
o contexto visual de onde estava na fila e o caminho de volta exigia botão back ou
clique no breadcrumb.

O comportamento desejado (referência: ClickUp, Linear, Notion) é:

1. Clique numa task abre um **modal sobre a lista**, sem desmontar a lista.
2. A URL muda para a URL canônica da task (`/projects/[id]/issues/[issueId]`) — modal
   é compartilhável e o botão back do navegador fecha o modal.
3. Refresh ou link direto naquela URL cai na **página standalone completa** (deep
   link funciona, não há modal "órfão" sem contexto).

Esse é exatamente o caso de uso que o Next.js App Router resolve com **intercepting
routes** combinadas a **parallel slots** — soft nav é interceptada, hard nav cai no
fallback.

## Decisão

### Camada de rotas

Estrutura final em `src/app/(app)/projects/[id]/`:

```
[id]/
  layout.tsx              # aceita { children, modal }, renderiza <>{children}{modal}</>
  default.tsx             # retorna null (fallback do segmento raiz)
  page.tsx                # overview do projeto (lista de issues)
  automation/             # rotas irmãs preservadas
  members/
  issues/[issueId]/
    page.tsx              # página standalone (fallback de hard nav, fonte da verdade)
  @modal/
    default.tsx           # retorna null (estado "nenhum modal aberto")
    (.)issues/[issueId]/
      page.tsx            # rota interceptora — renderiza <IssueModal>
```

### Camada de componentes

A página de 962 linhas foi refatorada em **shell fino + 2 componentes compartilhados**
que aceitam `variant: "page" | "modal"`:

- `src/components/issues/issue-detail-body.tsx` — main column + properties + activity +
  comments. `variant` ajusta spacings/larguras. Recebe `key={issueId}` no callsite do
  modal para forçar remount em navegação modal-para-modal.
- `src/components/issues/issue-detail-header.tsx` — em `"page"` renderiza breadcrumb
  full + actions; em `"modal"` versão compacta + botão X. Lógica de delete vive aqui
  com callback `onAfterDelete` (modal fecha + invalida queries; página standalone
  faz `router.push` para a lista).
- `src/components/issues/issue-modal.tsx` — envolve header+body em `<Dialog>` 90vw x
  90vh (`max-w-[1200px]`). Fechamento via `setTimeout(() => router.back(), 150)`.

### Ajuste de hook

`src/lib/hooks/use-page-title.ts` ganhou suporte a `null` como no-op (skip total).
Em modo modal, o header não deve sobrescrever o `document.title` da página de baixo,
então passa `null` em vez de string.

## Comportamento resultante

| Ação | Resultado |
|---|---|
| Clique em task na lista | URL muda, modal abre sobre a lista (lista renderizada por trás) |
| Esc / click-fora / X / back do navegador | Modal fecha, URL volta para `/projects/[id]` |
| Refresh em `/projects/[id]/issues/[issueId]` | Cai na página standalone (fallback de hard nav) |
| Link direto / colado de outro lugar | Idem refresh — página standalone |
| Modal → click em link para outra task | `key={issueId}` força remount com estado limpo |
| Delete dentro do modal | Modal fecha + queries invalidadas |

## Alternativas consideradas e descartadas

### 1. `history.replaceState` manual + estado interno
Manter a página atual da lista e empurrar a URL via `window.history.replaceState`,
abrindo um Dialog controlado por state.

- **Descartado.** Bugs sutis com o histórico (back não fecha modal de forma
  previsível, dois replaces consecutivos perdem entrada), sai do paradigma do
  framework, perde streaming/loading/error boundaries gratuitos do App Router.

### 2. Modal sem URL
Dialog controlado por state, URL não muda.

- **Descartado.** Perde shareability (caso de uso central — "manda essa task pra
  ele"), botão back do navegador não fecha o modal, deep link impossível.

### 3. Reaproveitar `card-detail/` (componente legacy)
Existe `src/components/card-detail/` no projeto.

- **Descartado.** Legacy do design antigo, divergiu da página de issue atual em
  estado, edição inline e contrato V2. Custaria mais alinhar do que extrair de
  `page.tsx`.

## Consequências positivas

- URL é a fonte da verdade — modal compartilhável, back funciona, fluxo previsível.
- Página standalone continua sendo a fonte da verdade do conteúdo. Body e header são
  reaproveitados via `variant`, zero duplicação de lógica de edição.
- Refresh sempre converge para uma view completa (standalone), nunca quebra.
- Rotas irmãs (`/automation`, `/members`) continuam funcionando intactas.
- Reversão é trivial (ver seção abaixo).

## Consequências negativas / armadilhas

- **Parallel routes são quebradiços.** Exigem `default.tsx` em **dois** lugares:
  no slot (`@modal/default.tsx`) e no segmento raiz (`[id]/default.tsx`). Sem o
  segundo, rotas irmãs como `/automation` e `/members` quebram com 404 porque o
  Next exige um default para cada slot em cada nível.
- **Timing de close.** Fechar o modal disparando `router.back()` imediatamente
  desmonta o slot antes do Radix completar o fade-out. Solução: `setTimeout(..., 150)`
  — frágil ao ajuste de duração da animação no Tailwind/Radix.
- **`usePageTitle` precisou aprender `null`.** Sem isso, o header em modo modal
  vazaria o título para a página de baixo, mudando o `document.title` quando o modal
  abre/fecha.
- **Hard nav não abre modal.** Refresh ou link direto cai na página standalone. É
  o comportamento desejado (e o que ClickUp faz), mas é uma sutileza para quem espera
  modal "sempre".
- **Estado modal-para-modal.** Body precisa de `key={issueId}` no callsite do modal.
  Sem isso, edição inline da task A vaza para task B quando o usuário clica num link
  cross-task dentro do modal.

## Como reverter

Para voltar ao comportamento standalone-only:

1. Deletar `src/app/(app)/projects/[id]/@modal/` (slot inteiro).
2. Deletar `src/app/(app)/projects/[id]/layout.tsx` e `default.tsx` raiz.
3. Manter `issue-detail-body.tsx`, `issue-detail-header.tsx` e o ajuste de
   `use-page-title.ts` (são melhorias independentes).

A página standalone `src/app/(app)/projects/[id]/issues/[issueId]/page.tsx`
continua sendo a fonte da verdade do detalhe — clique na lista voltaria a fazer
hard nav, como era antes.

## Referências

- Next.js: [Intercepting Routes](https://nextjs.org/docs/app/building-your-application/routing/intercepting-routes)
- Next.js: [Parallel Routes](https://nextjs.org/docs/app/building-your-application/routing/parallel-routes)
- Issue inspiração: comportamento de modal de task no ClickUp / Linear.
