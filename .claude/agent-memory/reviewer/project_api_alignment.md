---
name: API Alignment Patterns
description: Patterns de mismatch API frontend-backend recorrentes no Scrumban — para detectar rapidamente em reviews futuros
type: project
---

# Patterns de Mismatch API (Scrumban)

Identificados na auditoria de 2026-04-06 (23 mismatches totais).

**Why:** Frontend foi construido com nomenclatura PT (idStatus, idPrioridade, titulo) enquanto backend usa EN (statusId, priorityId, name). Isso cria dois caminhos paralelos: `intentionsApi` (com adapters corretos) e `tasksApi` (sem adapters — quebrado).

**How to apply:** Em qualquer review de task que envolva comunicacao API, verificar:
1. `tasksApi` vs `intentionsApi` — o caminho tasksApi historicamente envia campos PT para backend EN
2. Campos `idStatus` → `statusId`, `idPrioridade` → `priorityId`, `titulo` → `name`
3. `ENDPOINTS.PROJECT_TASKS` nao existe no backend — usar `ENDPOINTS.TASKS?projectId=X`
4. `LoginResponse` type deve ter `accessToken + user{}`, NAO `member + organization + tokens`
5. Tipo `User.role` deve ser uppercase (ADMIN, MEMBER) para consistencia com backend

## Fixes aplicados (2026-04-06)
- C1: LoginResponse type corrigido
- C2: deleteAccount com guard + verificacao de updateMany.count
- C3: Interceptor refresh token removido (logout direto em 401)
- C4: moveStatus usa `statusId` (nao `idStatus`)
- C5: listByProject usa `ENDPOINTS.TASKS?projectId=X`
- C6/C7: create/update com mapeamento PT→EN via dual-field `dto.titulo ?? dto.name`
- H1: TaskFilters renomeados para EN
- H2: Login retorna `organizationName`
- H3: entidadeId fallback inseguro removido
- H4: RegisterResponse sem campo `project`

## Issues residuais (proxima iteracao)
- `CreateTaskDto`/`UpdateTaskDto` frontend ainda em PT (divida tecnica)
- Verificar chamadores de `TaskFilters` (risco de filtros silenciosos)
- `updatedAt: new Date()` em organizationsService (nao reflete timestamp real do banco)
