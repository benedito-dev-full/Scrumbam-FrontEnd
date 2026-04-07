# AUDITORIA COMPLETA: Alinhamento API Frontend-Backend

**Criado por:** Strategist Agent
**Data:** 2026-04-06
**Estimativa Total:** 8-12h de correcoes
**Principios V3 Impactados:** P6 (API-First)

---

## 0. Resumo Executivo

Auditoria completa de TODAS as conexoes API entre o frontend (Next.js) e backend (NestJS).
Identificados **23 mismatches** classificados por severidade.

**Veredito:** A comunicacao funciona parcialmente porque o frontend tem DOIS caminhos paralelos — o caminho `intentionsApi` (usado para o fluxo principal de intencoes) e o caminho legado `tasksApi` (usado pelo card detail e board). O caminho `intentionsApi` tem adapters que traduzem corretamente EN<->PT. O caminho `tasksApi` envia campos em PT para um backend que espera EN — **QUEBRADO**.

---

## 1. DIAGNOSTICO COMPLETO

### CRITICAL (Impede funcionalidade, causa bugs visiveis)

#### C1. LOGIN: Response shape mismatch (RAIZ DO PROBLEMA DO `as unknown as`)

**Frontend espera (types/auth.ts LoginResponse):**
```typescript
{
  member: { chave, nome, email, role },
  organization: { chave, nome } | null,
  tokens: { access_token, refresh_token }
}
```

**Backend retorna (auth.service.ts login()):**
```typescript
{
  accessToken: "jwt...",
  user: { id, entidadeId, name, email, organizationId, role }
}
```

**Impacto:** O frontend SABE que esta errado — o `login/page.tsx` faz `as unknown as` (linhas 46-56) para converter manualmente. O tipo `LoginResponse` esta errado; o cast funciona mas:
- `LoginResponse` NUNCA e usado como declarado
- `refreshToken` salvo como `""` (vazio) no zustand
- `user.orgNome` salvo como `""` (vazio) — frontend nao tem o nome da org apos login

**Arquivo frontend:** `src/app/(auth)/login/page.tsx` linhas 46-68
**Arquivo backend:** `src/auth/services/auth.service.ts` linhas 94-104
**Arquivo tipos:** `src/types/auth.ts` linhas 44-48

**Correcao:** Atualizar `LoginResponse` para refletir o shape real do backend OU atualizar o backend para retornar no formato que o frontend espera. Recomendacao: atualizar o tipo no frontend (menos risco).

---

#### C2. DELETE ACCOUNT → LOGIN BUG (root cause analysis)

**Cenario reportado:** Usuario exclui conta (DELETE /auth/me) e consegue logar de novo.

**Analise do backend:**

O `deleteAccount` (auth.service.ts linha 401) recebe `entidadeId` do JWT payload:
```typescript
async deleteAccount(entidadeId: string, userId: string, organizationId: string, password: string)
```

O controller (auth.controller.ts linha 142-148) passa:
```typescript
req.user.entidadeId  // vem do JWT payload
req.user.userId      // = payload.sub (DUserGroup.chave)
```

O `jwt.strategy.ts` retorna `entidadeId: payload.entidadeId` que pode ser **undefined** se o JWT foi gerado sem esse campo (tokens antigos ou edge case).

**ROOT CAUSE identificado — 2 cenarios possiveis:**

**Cenario A (mais provavel): `entidadeId` undefined no JWT**

Se o JWT foi criado num momento em que `entidadeId` nao existia no payload (feature adicionada depois), ou se `userGroup.entidade` e null:
- `req.user.entidadeId` = `undefined`
- `deleteAccount` recebe `entidadeId = undefined`
- `BigInt(undefined)` no transaction -> **TypeError** -> Transaction NUNCA executa
- DUserGroup fica intacto (excluido=false) -> Login funciona

Evidencia: No login service (linha 63), `entidadeId = userGroup.entidade?.chave?.toString()` — se `entidade` e null, `entidadeId` e `undefined`. O JWT e gerado com `entidadeId: undefined`. Quando decodificado, `payload.entidadeId` nao existe.

**Cenario B (menos provavel): DUserGroup.idEntidade nao esta setado**

Se por alguma razao o DUserGroup foi criado sem `idEntidade` (campo nullable no schema), o `updateMany` com `where: { idEntidade: BigInt(entidadeId) }` encontra 0 registros. O DEntidade e soft-deleted mas o DUserGroup permanece ativo.

**Verificacao:** A transacao faz `updateMany` (nao `update`), entao `count: 0` nao gera erro. O soft delete "silenciosamente" nao deleta nada.

**Login pós-delete:** `dUserGroup.findFirst({ where: { login: email, excluido: false, inativo: false } })` encontra o DUserGroup (que nunca foi marcado como excluido) e permite login.

**Correcao necessaria:**
1. Validar que `entidadeId` nao e undefined/null antes de executar a transacao
2. Verificar resultado do `updateMany` — se `count === 0`, fazer rollback
3. Apos `deleteAccount`, o JWT deveria ser invalidado (token blacklist ou expiracao curta)

---

#### C3. REFRESH TOKEN: Endpoint inexistente

**Frontend:** `src/lib/api/client.ts` linha 40 faz `POST /auth/refresh` com `{ refresh_token }`
**Backend:** NAO EXISTE endpoint `/auth/refresh`

**Impacto:** Quando o JWT expira, o interceptor tenta refresh -> 404 -> `logout()` -> redirect para login. Isso nao e um bug critico agora (o login rearranja), mas:
- O register retorna `refresh_token: ''` (vazio)
- O login salva `refreshToken: ""` no zustand
- O interceptor verifica `if (!refreshToken)` antes de tentar refresh
- Como `""` e falsy, o refresh nunca e tentado — fallback direto para logout

**Risco:** Se alguem popular `refresh_token` com valor, o interceptor vai tentar `POST /auth/refresh` e obter 404.

**Correcao:** Remover logica de refresh do interceptor ate implementar P3-T14 (Refresh Tokens), OU implementar o endpoint.

---

#### C4. tasksApi.moveStatus: Campo errado no body

**Frontend envia (src/lib/api/tasks.ts linha 55-56):**
```typescript
api.put(ENDPOINTS.TASK_STATUS(taskId), { idStatus })
```

**Backend espera (UpdateTaskStatusDto, task.dto.ts linha 336-343):**
```typescript
class UpdateTaskStatusDto {
  @IsString()
  statusId: string;  // <-- campo se chama "statusId", nao "idStatus"
}
```

**Impacto:** O body chega como `{ idStatus: "-442" }` mas o DTO valida `statusId` que e undefined. class-validator rejeita com 400 Bad Request.

**Quem usa:** `card-detail-sheet.tsx` (linhas 46, 75) e `use-projects.ts` (linhas 143-148). O kanban board que usa `useMoveTaskStatus` esta QUEBRADO.

**Quem funciona:** `intentionsApi.updateStatus` (intentions.ts linha 90) envia `{ statusId }` — CORRETO.

**Correcao:** Trocar `{ idStatus }` por `{ statusId: idStatus }` em `tasksApi.moveStatus`.

---

#### C5. tasksApi.listByProject: URL inexistente

**Frontend chama:** `GET /projects/${projectId}/tasks` (via `ENDPOINTS.PROJECT_TASKS(projectId)`)
**Backend tem:** `GET /tasks?projectId=X` (TasksController em `/tasks`)

**NAO EXISTE** rota `/projects/:projectId/tasks` no backend.

**Impacto:** 404 para qualquer chamada de `tasksApi.listByProject()`.

**Quem usa:** `use-projects.ts` (linha 124) — `useProjectTasks` hook.
**Quem funciona:** `intentionsApi.list` (intentions.ts linha 32) usa `GET /tasks?projectId=X` — CORRETO.

**Correcao:** Mudar `tasksApi.listByProject` para usar `ENDPOINTS.TASKS` com `params: { projectId }`, ou unificar com `intentionsApi.list`.

---

#### C6. tasksApi.create: Nomes de campos PT vs EN

**Frontend CreateTaskDto (types/task.ts) envia:**
```typescript
{ titulo, descricao, idProject, idStatus, idAssignee, idPrioridade, idTipoTask, idSprint }
```

**Backend CreateTaskDto (task.dto.ts) espera:**
```typescript
{ name, projectId, statusId, assigneeId, priorityId, taskTypeId, sprintId, description }
```

**Impacto:** TODOS os campos sao ignorados pelo backend (nomes errados). Task e criada com valores null/default. O campo obrigatorio `projectId` sera undefined, causando 400.

**Quem usa:** `use-projects.ts` (linha 132) — `useCreateTask`.
**Quem funciona:** `intentionsApi.create` usa adapter `mapCreateIntentionToTaskBody` que mapeia corretamente.

**Correcao:** Unificar no adapter path ou corrigir nomes no `CreateTaskDto` frontend.

---

#### C7. tasksApi.update: Nomes de campos PT vs EN

**Frontend UpdateTaskDto (types/task.ts) envia:**
```typescript
{ titulo, descricao, idAssignee, idPrioridade, idTipoTask, idSprint, estimativaHoras, problema, ... }
```

**Backend UpdateTaskDto (task.dto.ts) espera:**
```typescript
{ name, description, assigneeId, priorityId, taskTypeId, storyPoints, problema, ... }
```

**Impacto:** Campos classicos (titulo, descricao, assignees) nao sao aplicados. Campos V3 (problema, contexto, etc.) FUNCIONAM porque tem o mesmo nome nos dois lados.

**Quem usa:** `card-detail-sheet.tsx` (linha 18-19) e `card-intention-doc.tsx` (linha 108) via `useUpdateTask`.

**Correcao:** Criar adapter para `tasksApi.update` similar ao `mapIntentionUpdatesToTaskBody`, ou corrigir nomes.

---

### HIGH (Funcionalidade parcial ou dados incorretos)

#### H1. TaskFilters: Nomes de query params errados

**Frontend TaskFilters (tasks.ts):**
```typescript
{ idStatus, idAssignee, idSprint, idPrioridade, idTipoTask, tag, search }
```

**Backend ListTasksQueryDto (task.dto.ts):**
```typescript
{ projectId, statusId, assigneeId, sprintId, canalId }
```

**Impacto:** Filtros no board legado nao funcionam — backend ignora params com nomes errados. `idPrioridade` e `idTipoTask` nao existem no backend (filtragem nao implementada no DTO). `tag` e `search` tambem nao existem.

**Correcao:** Atualizar `TaskFilters` para usar nomes EN ou criar adapter.

---

#### H2. Login: orgNome vazio no User state

**No login (page.tsx linha 66):**
```typescript
orgNome: "",  // Backend NAO retorna nome da org no login response
```

**Impacto:** Qualquer lugar que mostra `user.orgNome` (navbar, org page header) mostra vazio ate chamar `GET /auth/me`.

**Correcao:** Incluir `organizationName` no login response do backend, ou fazer `GET /auth/me` automaticamente apos login.

---

#### H3. Login: entidadeId fallback inseguro

**No login (page.tsx linha 60):**
```typescript
entidadeId: raw.user.entidadeId || raw.user.id,  // fallback para DUserGroup.chave!
```

**Impacto:** Se `entidadeId` e null (backend retorna null), o frontend usa `id` (DUserGroup.chave) como fallback. DUserGroup.chave != DEntidade.chave. Isso causa:
- Badge "Voce" na listagem de membros nao funciona (compara entidadeId errado)
- Delete account pode falhar (C2, usa entidadeId do JWT)
- Qualquer operacao que usa entidadeId estara errada

**Correcao:** Backend DEVE sempre retornar entidadeId no login response. Se entidade e null, e um erro de dados.

---

#### H4. Register: Response shape discrepancia com tipos

**Frontend RegisterResponse (types/auth.ts):**
```typescript
{ organization: { chave, nome }, member: { chave, nome, email, role }, project: { chave, nome }, tokens: { access_token, refresh_token } }
```

**Backend retorna (auth.service.ts register()):**
```typescript
{ organization: { chave, nome }, member: { chave, nome, email, role: 'ADMIN' }, tokens: { access_token, refresh_token: '' } }
```

**Mismatches:**
- `project` NAO e retornado pelo backend (tipo diz que sim)
- `refresh_token` e sempre `''`
- `member.chave` e `entidadeId` (DEntidade.chave), nao DUserGroup.chave

**Impacto:** O register page (page.tsx linha 64) faz `id: data.member.chave` — mas `member.chave` e `entidadeId`, nao `userId`. Isso significa que `user.id` no zustand apos register e DEntidade.chave, nao DUserGroup.chave. Apos login, `user.id` e DUserGroup.chave. **Inconsistencia entre register e login.**

**Correcao:** Padronizar: backend retorna ambos (`id` para DUserGroup e `entidadeId` para DEntidade) em ambos os fluxos.

---

#### H5. Endpoints fantasma no frontend (sem backend)

Endpoints definidos em `endpoints.ts` que NAO existem no backend:

| Frontend Endpoint | Backend Status |
|---|---|
| `PROJECT_TASKS(id)` = `/projects/:id/tasks` | NAO EXISTE |
| `PROJECT_COLUMNS(id)` = `/projects/:id/columns` | NAO EXISTE |
| `PROJECT_COLUMN(id, colId)` | NAO EXISTE |
| `PROJECT_COLUMNS_REORDER(id)` | NAO EXISTE |
| `PROJECT_TASKS_REORDER(id)` | NAO EXISTE |
| `TASK_TAGS(id)` = `/tasks/:id/tags` | VERIFICAR |
| `TASK_TAG(id, tagId)` | VERIFICAR |
| `TAGS` = `/tags` | VERIFICAR |
| `TAG(id)` | VERIFICAR |
| `DASHBOARDS_ME` | VERIFICAR |
| `DASHBOARDS_COMPANY` | VERIFICAR |
| `TASK_COMMENTS(id)` | VERIFICAR |
| `TASK_FEEDBACK(id)` | VERIFICAR |
| `RETROSPECTIVE(id)` | VERIFICAR |
| `CIRCUIT_BREAKER` | VERIFICAR |
| `TASK_APPETITE(id)` | VERIFICAR |
| `TASK_APPETITE_EXTEND(id)` | VERIFICAR |
| `NOTIFICATIONS_CONFIGURE` | VERIFICAR |
| `NOTIFICATIONS_TEST` | VERIFICAR |
| `ORG_BRANDING(id)` | VERIFICAR |
| `TEMPLATES` | VERIFICAR |
| `PROJECT_FROM_TEMPLATE` | VERIFICAR |
| `AUTH_REFRESH` = `/auth/refresh` | NAO EXISTE |

**Impacto:** Qualquer feature que usa esses endpoints vai 404. Podem ser features planejadas (P3) ou residuos de codigo gerado.

---

#### H6. Organization updateOrg: Response shape mismatch

**Frontend espera (Organization type):**
```typescript
{ id, name, email, phone, createdAt, memberCount }
```

**Backend retorna (updateOrganization):**
```typescript
{ id, name, email, phone, updatedAt }  // SEM createdAt, SEM memberCount
```

**Impacto:** Apos editar org, `createdAt` e `memberCount` ficam undefined no cache do frontend.

**Correcao:** Backend retornar response completo apos update (com memberCount e createdAt).

---

### MEDIUM (Funciona mas com riscos ou dados parciais)

#### M1. BigInt serialization no response

**Backend** converte BigInt para string via `toString()` em formatTask/formatProject.
**Frontend** usa `string` para IDs em todos os tipos.
**Status:** OK — sem mismatch. Apenas documentar que BigInt e serializado como string.

---

#### M2. Task `updatedAt` ausente no backend response

**Backend formatTask retorna:**
```typescript
{ ..., createdAt: task.chcriacao }  // NAO retorna updatedAt
```

**Frontend Task type espera:**
```typescript
{ ..., criadoEm, atualizadoEm }
```

**Frontend adapter mapApiTask fallback:**
```typescript
atualizadoEm: String(raw.atualizadoEm ?? raw.updatedAt ?? createdAt)
// Cai no createdAt pois backend nao retorna updatedAt
```

**Impacto:** `atualizadoEm` sempre igual a `criadoEm`. Timeline e ordenacao por "recente" nao funcionam corretamente.

**Correcao:** Backend incluir `updatedAt: task.chalteracao ?? task.chcriacao` no formatTask.

---

#### M3. Notification endpoints: PUT vs PATCH

**Frontend envia:** `PUT /notifications/read` e `PUT /notifications/read-all`
**Backend tem:** Verificar se sao PUT ou PATCH no controller.

---

#### M4. Dashboard endpoints parciais

**Frontend chama:**
- `GET /dashboards/me` — Backend: VERIFICAR existencia
- `GET /dashboards/company` — Backend: VERIFICAR existencia
- `GET /dashboards/projects/:id/metrics` — Backend: EXISTE
- `GET /dashboards/projects/:id/daily-summary` — Backend: EXISTE

**Impacto:** `dashboards/me` e `dashboards/company` podem 404.

---

#### M5. Auth interceptor: refresh com token vazio

**Frontend client.ts** verifica `if (!refreshToken)` antes de tentar refresh. Como refresh_token e sempre `""` (falsy), o interceptor faz logout direto em qualquer 401. Isso e "correto" por acaso mas fragil.

---

#### M6. Frontend `MeResponse.createdAt` e string, backend retorna Date

**Frontend tipo:** `createdAt: string`
**Backend retorna:** `createdAt: entidade.chcriacao` (Date object)

**Impacto:** Axios serializa Date para ISO string automaticamente, entao funciona. Mas se consumido de outra forma, pode dar incompatibilidade de tipos.

---

### LOW (Cosmetico ou edge cases raros)

#### L1. Dual API path (tasksApi + intentionsApi)

O frontend tem DOIS clientes para a mesma entidade (`tasks` e `intentions`). O `intentionsApi` e o path correto com adapters. O `tasksApi` e legado e quebrado. Codigo morto/duplicado.

**Correcao:** Migrar todo uso de `tasksApi` para `intentionsApi` e remover `tasksApi`.

---

#### L2. Endpoint constants nao utilizados

`endpoints.ts` tem ~40 endpoints definidos. Muitos podem ser residuos de geracao automatica sem backend correspondente.

---

#### L3. `as unknown as` no login page

Cast forcado indica que o dev sabia que os tipos estavam errados. O cast funciona mas esconde bugs do TypeScript.

---

#### L4. Frontend UpdateTaskDto inclui `idSprint` mas backend UpdateTaskDto nao aceita sprint

Backend UpdateTaskDto NAO tem campo para mudar sprint (usa endpoint dedicado `PUT /tasks/:id/sprint`). Se frontend enviar `idSprint` no body do update, sera silenciosamente ignorado.

---

## 2. ROOT CAUSE: Bug "Deletar e Logar"

### Diagnostico Final

O bug tem **DOIS root causes combinados:**

**Root Cause 1 (Principal): `entidadeId` pode ser undefined no JWT**

Fluxo:
1. Login gera JWT com `entidadeId: userGroup.entidade?.chave?.toString()` (linha 63, auth.service.ts)
2. Se `userGroup.entidade` e null (dados inconsistentes) ou se e um token antigo, `entidadeId` e undefined
3. JWT Strategy retorna `req.user.entidadeId = undefined`
4. `deleteAccount` recebe `entidadeId = undefined`
5. Na transaction, `BigInt(undefined)` → **TypeError**
6. Transaction aborta, NADA e soft-deleted
7. Frontend recebe 500 mas pode nao exibir o erro corretamente
8. DUserGroup permanece `excluido: false, inativo: false`
9. Login funciona normalmente

**Root Cause 2 (Secundario): `updateMany` silencioso**

Mesmo se `entidadeId` estiver correto, `updateMany` com `where: { idEntidade: BigInt(entidadeId) }` pode retornar `count: 0` se o campo `idEntidade` no DUserGroup nao corresponder (nullable, possivel inconsistencia). Nesse caso:
- DEntidade e soft-deleted
- DUserGroup NAO e soft-deleted
- Login encontra DUserGroup (excluido=false, inativo=false)
- Login funciona

**Root Cause 3 (Terciario): JWT nao e invalidado**

Mesmo que o soft delete funcione, o JWT antigo continua valido ate expirar. O frontend faz `logout()` (limpa localStorage) mas se o usuario copiar o token, pode usar ate expirar.

### Prova

```
login() → where: { login: dto.email, excluido: false, inativo: false }
                                       ^^^^^^^^^^^^^^  ^^^^^^^^^^^^^^^
Se deleteAccount falhou silenciosamente, AMBOS sao false → Login funciona
```

---

## 3. PLANO DE CORRECAO

### Fase 1: Bugs Criticos (Bloquers) — 3-4h

#### Fix C2: deleteAccount robusto
**Arquivo:** `/Scrumbam-Backend/src/auth/services/auth.service.ts`
**Mudancas:**
1. Validar `entidadeId` no inicio:
   ```typescript
   if (!entidadeId) {
     throw new BadRequestException('entidadeId ausente no token. Faca login novamente.');
   }
   ```
2. Verificar resultado do updateMany:
   ```typescript
   const result = await tx.dUserGroup.updateMany({ ... });
   if (result.count === 0) {
     throw new Error('DUserGroup nao encontrado para soft delete — dados inconsistentes');
   }
   ```
3. Tambem no controller, validar `req.user.entidadeId` antes de chamar service

#### Fix C4: tasksApi.moveStatus campo errado
**Arquivo:** `/Scrumbam-FrontEnd/src/lib/api/tasks.ts` linha 55-56
**Mudanca:**
```typescript
// ANTES
const response = await api.put(ENDPOINTS.TASK_STATUS(taskId), { idStatus });
// DEPOIS
const response = await api.put(ENDPOINTS.TASK_STATUS(taskId), { statusId: idStatus });
```

#### Fix C5: tasksApi.listByProject URL errada
**Arquivo:** `/Scrumbam-FrontEnd/src/lib/api/tasks.ts` linha 35
**Mudanca:**
```typescript
// ANTES
const { data } = await api.get(ENDPOINTS.PROJECT_TASKS(projectId), { params });
// DEPOIS
const { data } = await api.get(ENDPOINTS.TASKS, { params: { projectId, ...params } });
```

#### Fix C6/C7: tasksApi create/update campos errados
**Opcao A (recomendada): Criar adapters**
**Arquivo novo:** `src/lib/adapters/api-task-body-adapter.ts`
```typescript
export function mapCreateTaskDtoToBackend(dto: CreateTaskDto) {
  return {
    name: dto.titulo,
    projectId: dto.idProject,
    statusId: dto.idStatus,
    assigneeId: dto.idAssignee,
    priorityId: dto.idPrioridade,
    taskTypeId: dto.idTipoTask,
    sprintId: dto.idSprint,
    description: dto.descricao,
  };
}
```

**Opcao B (alternativa): Unificar em intentionsApi**
Remover `tasksApi.create/update` e usar `intentionsApi` em todos os lugares.

### Fase 2: Correcoes High — 2-3h

#### Fix C1/H4: Corrigir tipos de auth response
**Arquivo:** `src/types/auth.ts`
**Mudanca:** Criar tipos que refletem o shape REAL do backend:
```typescript
export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    entidadeId: string | null;
    name: string;
    email: string;
    organizationId: string;
    role?: string;
  };
}

export interface RegisterResponse {
  organization: { chave: string; nome: string };
  member: { chave: string; nome: string; email: string; role: string };
  tokens: { access_token: string; refresh_token: string };
}
```

#### Fix H3: Login entidadeId fallback
**Arquivo:** `src/app/(auth)/login/page.tsx`
**Mudanca:** Remover fallback inseguro. Se entidadeId e null, exibir erro.

#### Fix C3: Remover logica de refresh morta
**Arquivo:** `src/lib/api/client.ts`
**Mudanca:** Simplificar interceptor — em qualquer 401, fazer logout direto (ate implementar P3-T14).

#### Fix H1: TaskFilters nomes
**Arquivo:** `src/lib/api/tasks.ts`
**Mudanca:** Renomear filtros para nomes EN (statusId, assigneeId, sprintId).

### Fase 3: Consistencia — 2-3h

#### Fix H2: orgNome vazio apos login
**Opcao A:** Backend incluir `organizationName` no login response
**Opcao B:** Frontend fazer `GET /auth/me` automaticamente apos login

#### Fix H6: updateOrg response incompleto
**Arquivo:** `/Scrumbam-Backend/src/organizations/organizations.service.ts`
**Mudanca:** Retornar memberCount e createdAt no response de updateOrganization.

#### Fix M2: updatedAt ausente
**Arquivo:** `/Scrumbam-Backend/src/tasks/tasks.service.ts` formatTask
**Mudanca:** Adicionar `updatedAt: task.chalteracao ?? task.chcriacao` ao response.

#### Fix L1: Eliminar tasksApi duplicado
**Longo prazo:** Migrar todos os consumidores de `tasksApi` para `intentionsApi` e remover `tasksApi`.

---

## 4. ORDEM DE EXECUCAO

| # | Fix | Severidade | Tempo | Dependencia |
|---|-----|-----------|-------|-------------|
| 1 | C2: deleteAccount robusto | CRITICAL | 30min | Nenhuma |
| 2 | C4: moveStatus campo errado | CRITICAL | 10min | Nenhuma |
| 3 | C5: listByProject URL errada | CRITICAL | 10min | Nenhuma |
| 4 | C6/C7: create/update campos | CRITICAL | 45min | Nenhuma |
| 5 | C1: LoginResponse tipo correto | CRITICAL | 30min | Nenhuma |
| 6 | C3: Remover refresh morto | CRITICAL | 15min | Nenhuma |
| 7 | H3: entidadeId fallback | HIGH | 20min | Fix 5 |
| 8 | H4: RegisterResponse tipo | HIGH | 20min | Fix 5 |
| 9 | H1: TaskFilters nomes | HIGH | 15min | Fix 4 |
| 10 | H2: orgNome apos login | HIGH | 30min | Fix 5 |
| 11 | H6: updateOrg response | HIGH | 20min | Nenhuma |
| 12 | M2: updatedAt no formatTask | MEDIUM | 10min | Nenhuma |
| 13 | L1: Eliminar tasksApi | LOW | 2h | Fix 2-4, 9 |

**Prioridade absoluta:** Fix 1 (C2) — resolve o bug reportado pelo usuario.
**Quick wins:** Fix 2, 3 (10min cada) — desbloqueiam o kanban board.
**Estrutural:** Fix 4 (C6/C7) — resolve raiz dos mismatches em campo.

---

## 5. TABELA DE MAPEAMENTO COMPLETO (Referencia)

### Auth Endpoints

| Endpoint | Frontend envia | Backend espera | Backend retorna | Frontend espera | Status |
|----------|---------------|----------------|-----------------|-----------------|--------|
| POST /auth/login | `{ email, password }` | `{ email, password }` | `{ accessToken, user: { id, entidadeId, name, email, organizationId, role } }` | `{ member, organization, tokens }` | **MISMATCH** — cast forcado no FE |
| POST /auth/register | `{ nome, email, senha, nomeOrganizacao }` | `{ nome, email, senha, nomeOrganizacao }` | `{ organization, member, tokens }` | `{ organization, member, project, tokens }` | **MISMATCH** — `project` nao retornado |
| GET /auth/me | - | - | `{ id, name, email, phone, role, organizationId, organizationName, createdAt }` | `{ id, name, email, phone, role, organizationId, organizationName, createdAt }` | **OK** |
| PATCH /auth/me | `{ name, email, currentPassword, newPassword }` | `{ name, email, currentPassword, newPassword }` | `{ id, name, email, updatedAt }` | `{ id, name, email, updatedAt }` | **OK** |
| DELETE /auth/me | `{ password }` | `{ password }` | `{ success, message, organizationDeleted }` | qualquer | **OK** (se entidadeId valido) |
| DELETE /auth/organizations/:id | `{ password }` | `{ password }` | `{ success, message }` | qualquer | **OK** |
| POST /auth/refresh | `{ refresh_token }` | **NAO EXISTE** | - | `{ tokens }` | **QUEBRADO** |

### Organization Endpoints

| Endpoint | Frontend envia | Backend espera | Backend retorna | Frontend espera | Status |
|----------|---------------|----------------|-----------------|-----------------|--------|
| GET /organizations/:id | - | - | `{ id, name, email, phone, createdAt, memberCount }` | `{ id, name, email, phone, createdAt, memberCount }` | **OK** |
| PATCH /organizations/:id | `{ name, email, phone }` | `{ name, email, phone }` | `{ id, name, email, phone, updatedAt }` | `{ id, name, email, phone, createdAt, memberCount }` | **MISMATCH** parcial |
| GET /organizations/:id/users | - | - | `[{ id, name, email, phone, role, organizationId, createdAt }]` | `[{ id, name, email, phone, role, organizationId, createdAt }]` | **OK** |
| POST /organizations/:id/users | `{ name, email, password, role }` | `{ name, email, password, role }` | `{ id, name, email, role, organizationId }` | `{ id, name, email, role, organizationId }` | **OK** |
| DELETE /organizations/:id/users/:uid | - | - | `{ success, message }` | void | **OK** |
| PATCH /.../users/:uid/role | `{ role }` | `{ role }` | `{ id, name, email, role, organizationId }` | void | **OK** |

### Project Endpoints

| Endpoint | Frontend envia | Backend espera | Backend retorna | Frontend espera | Status |
|----------|---------------|----------------|-----------------|-----------------|--------|
| POST /projects | `{ name, description, organizationId }` | `{ name, description, organizationId }` | `{ id, name, description, ... }` | mapeado via mapProject | **OK** |
| GET /projects | `?organizationId=X` | `?organizationId=X` | `[{ id, name, ... }]` | mapeado via mapProject | **OK** |
| GET /projects/:id | - | - | `{ id, name, ... }` | mapeado via mapProject | **OK** |
| DELETE /projects/:id | - | - | `{ success, message }` | void | **OK** |
| GET /projects/summaries | `?organizationId=X` | `?organizationId=X` | `{ summaries: [...] }` | `data.summaries` | **OK** |

### Task Endpoints (via intentionsApi — CAMINHO CORRETO)

| Endpoint | Frontend envia | Backend espera | Backend retorna | Frontend espera | Status |
|----------|---------------|----------------|-----------------|-----------------|--------|
| POST /tasks | `{ name, projectId, taskTypeId, priorityId, problema }` | `{ name, projectId, ... }` | `{ id, name, status: { id, name, code }, ... }` | mapeado via adapters | **OK** |
| GET /tasks?projectId=X | `?projectId=X` | `?projectId=X` | `[{ id, name, ... }]` | mapeado via adapters | **OK** |
| GET /tasks/:id | - | - | `{ id, name, ... }` | mapeado via adapters | **OK** |
| PUT /tasks/:id | mapeado via adapter | `{ name, description, ... }` | `{ id, name, ... }` | mapeado via adapters | **OK** |
| PUT /tasks/:id/status | `{ statusId }` | `{ statusId }` | `{ id, ... }` | mapeado via adapters | **OK** |
| DELETE /tasks/:id | - | - | `{ success }` | void | **OK** |

### Task Endpoints (via tasksApi — CAMINHO LEGADO QUEBRADO)

| Endpoint | Frontend envia | Backend espera | Status |
|----------|---------------|----------------|--------|
| GET /projects/:id/tasks | - | **URL NAO EXISTE** | **QUEBRADO** (C5) |
| POST /tasks | `{ titulo, idProject, ... }` (PT) | `{ name, projectId, ... }` (EN) | **QUEBRADO** (C6) |
| PUT /tasks/:id | `{ titulo, descricao, ... }` (PT) | `{ name, description, ... }` (EN) | **QUEBRADO** (C7) |
| PUT /tasks/:id/status | `{ idStatus }` | `{ statusId }` | **QUEBRADO** (C4) |

### Flow Metrics / Analytics / Dashboards

| Endpoint | Status | Notas |
|----------|--------|-------|
| GET /flow-metrics/:id/cycle-time | **OK** | Caminho correto |
| GET /flow-metrics/:id/lead-time | **OK** | |
| GET /flow-metrics/:id/throughput | **OK** | |
| GET /flow-metrics/:id/wip-age | **OK** | |
| GET /flow-metrics/:id/cfd | **OK** | |
| GET /flow-metrics/:id/dashboard | **OK** | |
| GET /dashboards/projects/:id/metrics | **OK** | |
| GET /dashboards/projects/:id/daily-summary | **OK** | |
| GET /dashboards/me | **VERIFICAR** | Pode nao existir |
| GET /dashboards/company | **VERIFICAR** | Pode nao existir |
| GET /analytics/:id/compare | **OK** | |
| GET /analytics/:id/capacity-forecast | **OK** | |
| GET /analytics/:id/stakeholder-report | **OK** | |

### Notifications

| Endpoint | Frontend | Backend | Status |
|----------|----------|---------|--------|
| GET /notifications | GET | GET | **OK** |
| GET /notifications/unread-count | GET | GET | **OK** |
| PUT /notifications/read | PUT `{ ids }` | PUT `{ ids }` | **OK** |
| PUT /notifications/read-all | PUT | PUT | **OK** |
| DELETE /notifications/:id | DELETE | DELETE | **OK** |

---

## 6. CRITERIOS DE SUCESSO

- [ ] Usuario pode deletar conta e NAO conseguir logar (C2 resolvido)
- [ ] Kanban board carrega tasks via `tasksApi.listByProject` (C5 resolvido)
- [ ] Status change via board funciona (C4 resolvido)
- [ ] Task create via board funciona (C6 resolvido)
- [ ] Task update via card detail funciona (C7 resolvido)
- [ ] Login nao usa `as unknown as` cast (C1 resolvido)
- [ ] Zero 404 em endpoints usados ativamente
- [ ] Todos os testes existentes passam

---

**Handoff para Implementer:**
Comece pelo Fix 1 (C2: deleteAccount) no backend — e o unico bug reportado pelo usuario.
Depois Fix 2-4 (C4/C5/C6/C7) no frontend — desbloqueiam o kanban board.
Os fixes de tipos (C1, H3, H4) podem vir depois.
IMPORTANTE: Os fixes no path `tasksApi` sao todos no frontend. O backend esta correto; o frontend e que envia campos/URLs errados.
