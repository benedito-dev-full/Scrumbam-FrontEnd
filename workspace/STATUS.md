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
