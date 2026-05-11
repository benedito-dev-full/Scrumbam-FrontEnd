---
name: useProject hook returns ProjectDetail (not Project)
description: Tipo declarado de useProject(id) e ProjectDetail, que omite taskCount/teamId — embora os campos existam em runtime via mapProject. Componentes que precisam desses campos devem aceitar union ou type-guard.
type: project
---

`useProject(id)` (em `src/lib/hooks/use-projects.ts:48`) retorna `ProjectDetail`, definido em `src/types/project.ts`. Esse tipo NAO declara `taskCount` nem `teamId`.

Em runtime, `projectsApi.getById` faz `{ ...mapProject(data), idResponsavel }`, entao os campos do `Project` (incluindo `taskCount` e `teamId`) ESTAO presentes — apenas o tipo TS e mais restrito.

**Why:** Decisao historica nao explicada (ProjectDetail foi criado para adicionar `idResponsavel`, mas restringiu o tipo).

**How to apply:** Componentes que consomem `useProject` e precisam de `taskCount`/`teamId`:
- Opcao A (preferida no curto prazo): declarar prop type local como `Project | (ProjectDetail & { taskCount?: number; teamId?: string | null })` para nao mexer no contrato global
- Opcao B (refator futuro): unificar `ProjectDetail` para extender `Project`, eliminando divergencia tipo-vs-runtime

Foi observado em 2026-05-08 ao implementar `ProjectPropertiesPanel`. EditableField precisa de teamId; mantive solucao local sem tocar tipos compartilhados.
