# STATUS.md - Scrumban Frontend

**Versão:** 1.0
**Última atualização:** 2026-05-07
**Repositório:** /Users/devaritecnologia/Documents/Benedito/Scrumbam-FrontEnd

---

## Task 01 - COMPLETA

**Modulo:** frontend (Next.js App Router)
**Task:** Frontend Routes Refactor — Separação Semântica de Rotas
**Status:** COMPLETA
**Duration:** ~50 min
**Quality Score:** 9/10

### V3 Compliance
- Routes semânticas: OK (rotas refatoradas com prefixos intuitivos)
- Redirects backward-compat: OK (308 em next.config.ts)
- Zero breaking changes: OK (inbox/new preservadas)

### Deliverables
- [x] 2 pages movidas via `git mv` (history preservado)
- [x] Params renomeados (`projectId` → `id`, `intentionId` → `issueId`)
- [x] 13 arquivos com refs atualizadas
- [x] Redirects 308 configurados
- [x] Zero refs residuais validadas via grep

### Metrics
- Build: PASS (37 rotas)
- TypeScript: 0 errors
- ESLint: clean
- Backward compat: 100% (inbox/new/intentions root intactos)
- Git history: preservado via `git mv`

---

## Task 02 - COMPLETA

**Modulo:** frontend (automation)
**Task:** Modal de Provisionamento VPS em 2 Passos
**Status:** COMPLETA
**Duration:** ~3 horas
**Quality Score:** 8.2/10 — APPROVED

### Arquivos Criados
- [x] `provision-modal.tsx` — Dialog wizard com StepIndicator, máquina de estados (idle → saving-url → loading-key/generating-key → key-ready → provisioning → success/error)

### Arquivos Modificados
- [x] `automation.ts` — tipos `ProvisionInput`/`ProvisionResult`, método `provision()` via POST; bug fix: `remoteRepoUrl` lê `primary?.remoteRepoUrl ?? primary?.repoUrl ?? null`
- [x] `use-automation.ts` — hook `useProvision()` com invalidações de deployKey, agent-link, project
- [x] `agent-link-form.tsx` — refatorado: form inline → 3 botões contextuais, renderiza modal
- [x] `project.ts` + `projects.ts` — adicionado `repoUrl` ao UpdateProjectDto e PATCH payload

### Deliverables
- [x] Wizard 2 passos (seleção VPS → setup repo + deploy key)
- [x] Máquina de estados completa com tratamento de erros (400/403/409/503/504)
- [x] Reset ao fechar, UI responsiva
- [x] Deploy key exibida com instruções de copy

### Metrics
- Build: PASS
- TypeScript: 0 errors
- ESLint: clean
- Git commit: `feat(automation): modal de provisionamento VPS em 2 passos`
