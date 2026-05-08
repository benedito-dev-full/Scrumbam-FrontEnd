# Plano: Módulo Times — Frontend Completo

**Status:** APROVADO — aguardando implementação  
**Estimativa:** 6-8h  
**Backend:** 100% pronto, zero alterações necessárias

---

## Contexto

As telas `/team/*` são 100% stub (fundo preto). O backend de times está completo com 12 endpoints. Este plano desbloqueia o módulo completo.

---

## Endpoints disponíveis no backend

```
GET  /api/v1/teams                          — lista times da org (?organizationId=X)
GET  /api/v1/teams/mine                     — times onde o user é membro (JWT)
GET  /api/v1/teams/:id                      — detalhe do time
GET  /api/v1/teams/:id/members              — membros do time
POST /api/v1/teams                          — criar time (ADMIN)
PATCH /api/v1/teams/:id                     — editar time
DELETE /api/v1/teams/:id                    — deletar (409 se tem projetos vinculados)
POST /api/v1/teams/:id/members              — adicionar membro
PATCH /api/v1/teams/:id/members/:userId     — editar cargo
DELETE /api/v1/teams/:id/members/:userId    — remover membro
GET /api/v1/projects?teamId=X               — projetos do time (JÁ FUNCIONA)
GET /api/v1/tasks?projectId=X               — tasks por projeto (já existe)
```

## Response shapes

```typescript
// GET /teams/mine e /teams/:id
interface TeamResponse {
  id: string;
  name: string;
  key: string;         // ex: "DEV"
  color: string | null;
  icon: string | null;
  organizationId: string;
  lastIssueSeq: number;
  memberCount: number;
  createdAt: string;
  canEdit: boolean;
  canDelete: boolean;
}

// GET /teams/:id/members
interface TeamMemberResponse {
  userId: string;
  name: string;
  email?: string | null;
  cargo: "ADMIN" | "MEMBER" | "VIEWER";
  joinedAt: string;
}
```

---

## Arquivos a CRIAR (7 novos)

### 1. `src/types/team.ts`
Interfaces TypeScript: `Team`, `TeamMember`, `CreateTeamDto`, `UpdateTeamDto`, `AddTeamMemberDto`, `UpdateTeamMemberRoleDto`.

### 2. `src/lib/api/teams.ts`
Seguir padrão de `src/lib/api/agents.ts`:
- `teamsApi.listMine()` → GET /teams/mine
- `teamsApi.list(organizationId)` → GET /teams?organizationId=X
- `teamsApi.getById(id)` → GET /teams/:id
- `teamsApi.getMembers(id)` → GET /teams/:id/members
- `teamsApi.create(dto)` → POST /teams
- `teamsApi.update(id, dto)` → PATCH /teams/:id
- `teamsApi.remove(id)` → DELETE /teams/:id
- `teamsApi.addMember(teamId, dto)` → POST /teams/:id/members
- `teamsApi.updateMemberRole(teamId, userId, dto)` → PATCH /teams/:id/members/:userId
- `teamsApi.removeMember(teamId, userId)` → DELETE /teams/:id/members/:userId

### 3. `src/lib/hooks/use-teams.ts`
Seguir padrão de `src/lib/hooks/use-agents.ts`:
- `useMyTeams()` — staleTime: 5min
- `useTeam(id)`
- `useTeamMembers(teamId)`
- `useCreateTeam()` — toast + invalidate
- `useUpdateTeam()` — toast + invalidate
- `useDeleteTeam()` — trata 409: "Desvincule os projetos do time antes de excluí-lo"
- `useAddTeamMember()`, `useUpdateTeamMemberRole()`, `useRemoveTeamMember()`

### 4. `src/lib/stores/team-store.ts`
Zustand simples (sem persist):
```typescript
interface TeamStore {
  selectedTeamId: string | null;
  setSelectedTeam: (id: string | null) => void;
}
```

### 5. `src/components/teams/team-selector-sidebar.tsx`
- Usa `useMyTeams()` e `useTeamStore`
- Loading: skeleton 2 linhas
- Empty: "Você não é membro de nenhum time"
- Para cada time: ícone quadrado com inicial + cor do `team.color`
- Item selecionado: `bg-sidebar-accent`
- Subitens expandidos: Issues, Projetos, Views (Views com badge "em breve")
- Botão "+" para ADMIN (criar time)
- Menu "..." por time: editar, membros, deletar

### 6. `src/app/(app)/team/projects/page.tsx` (reescrever)
- Lê `selectedTeamId` do team-store
- Se null: "Selecione um time na barra lateral"
- Se definido: `projectsApi.list(undefined, selectedTeamId)`
- Reutiliza cards de projeto de `/projects`

### 7. `src/app/(app)/team/issues/page.tsx` (reescrever)
- Lê `selectedTeamId` do team-store
- Se null: estado vazio
- Se definido: busca projetos → tasks de cada projeto
- Lista agrupada por projeto, reutiliza `IntentionListItem`

---

## Arquivos a MODIFICAR (4 existentes)

### `src/lib/api/endpoints.ts`
Adicionar:
```typescript
TEAMS: "/teams",
TEAMS_MINE: "/teams/mine",
TEAM: (id: string) => `/teams/${id}`,
TEAM_MEMBERS: (id: string) => `/teams/${id}/members`,
TEAM_MEMBER: (id: string, userId: string) => `/teams/${id}/members/${userId}`,
```

### `src/lib/constants.ts`
Adicionar em QUERY_KEYS:
```typescript
teams: {
  mine: ["teams", "mine"] as const,
  list: (orgId: string) => ["teams", "list", orgId] as const,
  detail: (id: string) => ["teams", id] as const,
  members: (teamId: string) => ["teams", teamId, "members"] as const,
}
```

### `src/lib/api/projects.ts`
Adicionar `teamId?: string` como parâmetro opcional em `list()`:
```typescript
list: async (organizationId?: string, teamId?: string) => {
  const params = {
    ...(organizationId && { organizationId }),
    ...(teamId && { teamId }),
  };
  // resto igual
}
```

### `src/components/common/app-sidebar.tsx`
- Substituir bloco hardcoded "Devari Tecnologia" pelo `<TeamSelectorSidebar />`
- Remover `stub: true` dos items `/team/issues` e `/team/projects`
- Manter `/team/views` com stub mas mensagem atualizada

### `src/app/(app)/team/views/page.tsx`
- Manter stub mas limpar mensagem: "Views compartilhadas estarão disponíveis em breve"
- Remover referências a "gap #1", "gap #2", "LINEAR_PIVOT_GAPS.md"

---

## Ordem de implementação

**Fase 1 — Infraestrutura (1h)**
1. `src/types/team.ts`
2. `src/lib/api/endpoints.ts` (adicionar endpoints de teams)
3. `src/lib/api/teams.ts`
4. `src/lib/constants.ts` (QUERY_KEYS)
5. `src/lib/hooks/use-teams.ts`
6. `src/lib/stores/team-store.ts`
7. `src/lib/api/projects.ts` (adicionar teamId param)

**Fase 2 — Sidebar dinâmica (1h30)**
8. `src/components/teams/team-selector-sidebar.tsx`
9. `src/components/common/app-sidebar.tsx`

**Fase 3 — Tela de Projetos (45min)**
10. `src/app/(app)/team/projects/page.tsx`

**Fase 4 — Tela de Issues (1h)**
11. `src/app/(app)/team/issues/page.tsx`

**Fase 5 — Gestão CRUD de Times (1h30)**
12. Dialogs criar/editar/membros/deletar (dentro do TeamSelectorSidebar)

---

## Referências de padrão de código
- API: `src/lib/api/agents.ts`
- Hook: `src/lib/hooks/use-agents.ts`
- Store: `src/lib/stores/auth-store.ts`
- Lista de itens: `src/app/(app)/agents/page.tsx`
- Cards de projeto: `src/app/(app)/projects/page.tsx`

---

## O que NÃO implementar agora
- URL com ID `/team/[id]/issues` (V2 — evita ruptura de rotas)
- `/team/views` funcional (DView não existe no backend)
- Kanban no `/team/issues` (lista simples é suficiente para V1)
- Filtros avançados em issues (V2)
