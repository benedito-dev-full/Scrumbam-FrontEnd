# Review Report: Task 0 - Onboarding Wizard Frontend

**Reviewed by:** Reviewer Agent
**Date:** 2026-04-09
**Module:** frontend / onboarding

---

## Resultado Final

### NEEDS_CHANGES — Score: 7.5/10

Implementação sólida com arquitetura correta (Zustand + Framer Motion + API real).
Dialog bloqueado corretamente (ESC + overlay). Build PASS. TypeScript 0 erros.
Um bug MEDIUM crítico de UX: usuários que já completaram o onboarding verão o
wizard novamente ao fazer login (race condition no cache de revalidação).

---

## Testes Automatizados

| Check | Status | Detalhes |
|-------|--------|----------|
| Build | PASS | `npm run build` — 22 páginas geradas sem erros |
| TypeScript | PASS | 0 erros (Finished TypeScript in 3.9s) |
| ESLint | N/A | Não executado separadamente, build passou |

---

## Validacao V3

Esta task é frontend-only. Validações V3 se aplicam apenas ao backend (src/).
Verificações de alinhamento com V3:

| Check | Status | Detalhes |
|-------|--------|----------|
| Fluxo INBOX→READY→EXECUTING→DONE | OK | Step 4 (UnderstandFlowStep) mostra os 4 status corretos |
| POST /tasks cria em INBOX | OK | Backend default é INBOX quando statusId não enviado |
| Payload POST /tasks correto | OK | `name`, `projectId`, `description` — alinhado com backend |
| Payload PATCH /auth/me correto | OK | `onboardingCompleted: true` — suportado pelo backend |

---

## Conformidade com o Plano

**Plan consultado:** N/A — Task executada sem Strategist (escopo < 2h).
Avaliação baseada em qualidade genérica, handoff recebido e V3 compliance.

---

## Code Review (12 Items)

### CRITICO

**1. Build:** PASS — `npm run build` compilou sem erros.

**2. TypeScript:** PASS — 0 erros TypeScript.

**3. V3 Compliance:** OK — Sem referências a -410, intentionMode ausente, fluxo
correto (INBOX→READY→EXECUTING→DONE) no Step 4.

**4. N+1 Queries:** N/A — Frontend. As chamadas API são:
- `projectsApi.create()` — 1 chamada POST /projects
- `tasksApi.create()` — 1 chamada POST /tasks
- `authApi.updateMe()` — 1 chamada PATCH /auth/me
Nenhum loop com chamadas repetidas. ZERO N+1.

**5. Flow Metrics:** N/A — Frontend não calcula métricas.

### ALTO

**6. Sem DatabaseService:** N/A — Frontend.

**7. BigInt para IDs:** N/A — Frontend. IDs são string no frontend (correto).

**8. Transactions:** N/A — Frontend.

**9. TimezoneService:** N/A — Frontend.

**10. Timestamps de transição:** N/A — Frontend.

### MEDIO

**11. Endpoints genéricos reutilizados:** OK — `projectsApi.create()` e
`tasksApi.create()` reutilizam os adapters existentes sem duplicação.

**12. Dialog não fecha por ESC/overlay:** OK — `onEscapeKeyDown={(e) => e.preventDefault()}`
e `onPointerDownOutside={(e) => e.preventDefault()}` presentes. `showCloseButton={false}`.
Padrão correto da memória do reviewer (API Keys frontend).

---

## Issues Encontrados

### CRITICAL
Nenhum.

### MEDIUM

**M1 — Race condition: wizard reaparece após login para usuários que já completaram o onboarding**

- **Arquivo:** `src/app/(auth)/login/page.tsx` (linha 52-60)
- **Problema:** O objeto `User` montado no login não inclui `onboardingCompleted`.
  O campo fica `undefined`. A condição `user.onboardingCompleted !== true` avalia
  como `true` para `undefined`, ativando o wizard.
- **Causa raiz:** O backend login response não retorna `onboardingCompleted`
  (apenas `/auth/me` retorna). O `auth-provider.tsx` usa cache de 5 minutos —
  para um login recém-realizado (`lastValidatedAt = Date.now()`), `needsRevalidation()`
  retorna `false` e o `/auth/me` não é chamado imediatamente.
- **Impacto:** Todo usuário que já completou o onboarding verá o wizard
  reaparecer no próximo login, até o cache expirar (até 5 minutos).
- **Fix recomendado (opção A — simples):** No `login/page.tsx`, após chamar
  `authApi.login()`, chamar também `authApi.getMe()` para popular
  `onboardingCompleted` antes de chamar `login(user)`.
- **Fix recomendado (opção B — mais elegante):** Marcar `needsRevalidation()`
  como verdadeiro ao montar (via `lastValidatedAt: null`) logo após o login, de
  forma que o `auth-provider` faça o `/auth/me` imediatamente na primeira navegação.
  Mas isso exige refactoring do auth flow.
- **Fix recomendado (opção C — mínimo, sem API extra):** No `use-onboarding.ts`,
  alterar `shouldShowOnboarding` para só mostrar o wizard se `onboardingCompleted`
  for explicitamente `false` (não `undefined`). Adicionar `onboardingCompleted: false`
  explicitamente ao montar o `User` no login. Isso resolve sem API extra.

**M2 — `isOpen` não é persistido no store, mas `currentStep` também não**

- **Arquivo:** `src/lib/stores/onboarding-store.ts` (linha 54-58)
- **Observação:** O `partialize` persiste apenas `createdProjectId`, `createdProjectName`,
  `createdIntentionId`. `currentStep` e `isOpen` não são persistidos.
- **Impacto:** Se o usuário recarregar a página no meio do Step 2 ou 3 (depois
  de criar o projeto), o store Zustand é resetado para `currentStep: 0`. Porém,
  como `createdProjectId` é persistido, o Step 2 mostrará o estado "Projeto criado"
  em vez do formulário. Isso é comportamento razoável (não quebra), mas o progresso
  visual (passo 3) não é retomado — o usuário começa do Step 0 mas o projeto já
  existe. Não é um bug crítico, mas pode confundir.
- **Severidade:** MEDIUM (UX inconsistente, não bloqueante)
- **Fix:** Adicionar `currentStep` ao `partialize` para retomar de onde parou.

### MINOR

**L1 — `auto-open` usa `setTimeout(500ms)` sem necessidade clara**

- **Arquivo:** `onboarding-wizard.tsx` (linha 37)
- `setTimeout(() => open(), 500)` — delay de 500ms para evitar flash durante
  page load. Funcional, mas o comentário diz "avoid flash". O real motivo é
  aguardar a hidratação do Zustand. O `isHydrated` no `auth-provider` já cobre
  isso. O delay pode ser removido ou reduzido para 100ms.
- Severidade: Baixo (cosmético)

**L2 — `skipOnboarding` é alias de `completeOnboarding`**

- **Arquivo:** `use-onboarding.ts` (linha 30-32)
- `skipOnboarding` e `completeOnboarding` fazem exatamente a mesma coisa.
  Semântica confusa — "pular" implica não completar, mas chama `updateMe`
  com `onboardingCompleted: true`. É intencional (queremos marcar como completado
  mesmo se pulou), mas o nome pode confundir futuros maintainers.
- Sugestão: Renomear para `dismissOnboarding` ou adicionar comentário explicando
  que "pular" equivale a completar para evitar reexibição.

**L3 — Fluxo de estado pós-conclusão: `store.reset()` limpa `createdProjectId`**

- **Arquivo:** `use-onboarding.ts` (linha 43-50 do store)
- Após `completeOnboarding()`, o store é resetado (`store.reset()`), limpando
  `createdProjectId` do localStorage. Isso é correto — o projeto já existe no
  backend. Sem impacto negativo.

---

## Análise de Qualidade

### Pontos Fortes

1. **Arquitetura limpa:** Store Zustand com `partialize` correto (não persiste
   `isOpen` para evitar re-abertura no refresh — intencional e correto para o
   fluxo principal).
2. **API real:** Steps 2 e 3 criam dados reais via `projectsApi.create()` e
   `tasksApi.create()`. Payloads corretos e alinhados com os adapters existentes.
3. **Idempotência:** `alreadyCreated` em ambos os steps — se o projeto/intenção
   já existe (createdProjectId/createdIntentionId persistido), o step mostra
   estado de sucesso ao invés do formulário. Recarregar a página no meio do
   onboarding não cria duplicatas.
4. **Dialog seguro:** `onPointerDownOutside + onEscapeKeyDown preventDefault` —
   wizard não fecha acidentalmente.
5. **Framer Motion:** Todas as transições implementadas com `AnimatePresence`
   no container e animações staggered nos steps.
6. **Mobile-first:** Dialog com `max-w-[calc(100%-2rem)] sm:max-w-md` e
   `max-h-[90vh] overflow-y-auto`. Funcional em telas pequenas.
7. **Dark/Light mode:** Usa apenas classes Tailwind semânticas (`bg-muted/50`,
   `text-muted-foreground`, `border`, `bg-primary`) — compatível automaticamente
   com ambos os temas.
8. **Backend sync correto:** `authApi.updateMe({ onboardingCompleted: true })`
   persiste no campo `dados` via `DUserGroup.dados` Json. Confirmado no backend
   `auth.service.ts`.
9. **Montagem no layout:** `OnboardingWizard` montado em `app/(app)/layout.tsx`
   — aparece em todas as rotas do app, não apenas em uma página específica.
10. **Acessibilidade:** `DialogTitle` com `className="sr-only"` — título visível
    para leitores de tela.

### Gaps

1. **M1 (CRITICAL UX):** Race condition — wizard reaparece após login.
2. **M2 (MEDIUM):** `currentStep` não persistido — progresso perdido no refresh.

---

## Decisao: NEEDS_CHANGES

**Justificativa:** O bug M1 é de impacto direto na UX do usuário regular — toda
vez que um usuário que já completou o onboarding fizer login, verá o wizard por
um período de até 5 minutos (até o cache do auth-provider expirar). Em produção
com usuários reais isso é inaceitável. O fix é simples (3 linhas no `login/page.tsx`
adicionando `onboardingCompleted: false` ao User montado, ou chamar getMe).

**Itens obrigatórios para aprovação:**
1. Corrigir M1 (race condition — wizard reaparecer após login)
2. Corrigir M2 (currentStep não persistido — opcional mas recomendado)

**Próximo:** Implementer corrige M1 (obrigatório) e opcionalmente M2.
