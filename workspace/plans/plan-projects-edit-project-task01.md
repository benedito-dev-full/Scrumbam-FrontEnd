# PLANO DETALHADO - Task 01: Editar Projeto (Backend + Frontend)

**Criado por:** Strategist Agent
**Data:** 2026-05-08
**Modulo:** projects (backend) + projects/UI (frontend)
**Estimativa Total:** 3h backend + 1h30 frontend = ~4h30
**Principios V3 Impactados:** P9 (Projeto Autonomo: edicao simples e clara)

---

## 0. Triagem de Clareza

Avaliada como **CLARA**. Brief do Tech Lead lista decisoes pendentes (A/B, X/Y/Z, role) — Strategist resolve neste plano. C1-C4 OK.

---

## 1. Analise

### Contexto
Projeto pode ser criado e deletado, mas nao editado. User criou projeto sem time, quer corrigir, sem caminho via UI. Falta `PATCH /projects/:id` no backend e tudo no frontend.

### Estado Atual (verificado)
- **Backend:** `projects.controller.ts` tem POST/GET/DELETE/stats/activity/api-key/members. Sem PATCH `:id`. `CreateProjectDto` ja aceita `idTeam` (commit `d3a3f6d`).
- **Backend service:** `create()` valida `idTeam` cross-org dentro de `$transaction` (linhas 95-108). Logica reutilizavel.
- **Frontend:** `projectsApi.update` NAO existe; `useUpdateProject` NAO existe. `useDeleteProject` existe e e referencia boa.
- **Frontend UI:** `/projects/page.tsx` ja tem `DropdownMenu` com `MoreHorizontal` (linha 14-20) e `DeleteProjectDialog`. Trivial adicionar item "Editar".
- **Modal de criacao:** `new-project-modal.tsx` existe com Time + nome + descricao + multi-select de membros.

---

## 2. Decisoes (RESOLVIDAS)

### Decisao 1: Modal — **Opcao B** (criar `edit-project-modal.tsx` separado)
**Justificativa (1 frase):** `new-project-modal.tsx` acabou de ser commitado e tem multi-select de membros que NAO se aplica a edicao (membros tem endpoint proprio `/projects/:id/members`); refatorar para `mode` aumenta risco de regressao em fluxo critico recem-entregue, enquanto componente separado e isolado e tem ~70 linhas.

### Decisao 2: Trigger — **Opcao X** (item no dropdown `⋯` da lista `/projects`)
**Justificativa (1 frase):** Dropdown ja existe naquela pagina com `DeleteProjectDialog`, simetria visual perfeita ("Editar" acima de "Excluir") e zero codigo novo de container; `/projects/:id` page nao tem header com botao dedicado pronto e adicionar la sera Y/Z futuro se houver demanda.

### Decisao 3: Quem pode editar — **somente OrgRole.ADMIN** (igual ao DELETE)
**Justificativa:** Editar nome/descricao/time tem o mesmo nivel de impacto organizacional que deletar (afeta visibilidade do projeto para todos os times). MANAGER do projeto nao tem visao cross-org para validar troca de `idTeam`. Manter simetria com DELETE evita matrix complexa de permissoes — alinhado com P9 (autonomia simples).

### Decisao 4: Helper de validacao de team — **extrair `validateTeamInOrg(idTeam, orgId, tx)`** privado em `ProjectsService`
**Justificativa:** Logica das linhas 95-108 sera duplicada em `update()`; helper privado aceita `tx?` opcional (Prisma transaction client) para reuso em ambos os caminhos. Refator de baixo risco (~10 linhas extraidas).

---

## 3. Avaliacao de Pilares

- **Pilar 1 (Engine):** N/A — dominio agil, Prisma direto.
- **Pilar 2 (Endpoints Genericos):** N/A — `DProject` tem controller proprio justificado (Task 5).
- **Pilar 3 (Seed):** N/A — sem novas classes.

---

## 4. Estrutura Tecnica

### Backend — Arquivos a modificar
1. **`src/projects/dto/project.dto.ts`** — adicionar `UpdateProjectDto`:
   - `name?: string` (`@IsString @MinLength(2)` quando presente)
   - `description?: string | null` (aceitar null para limpar)
   - `idTeam?: string | null` (aceitar `null` explicitamente para desvincular)
   - `startDate?: string` (YYYY-MM-DD)
   - **NAO incluir:** `organizationId`, `endDate` (manter consistente com create), `memberIds` (endpoint proprio)
   - **NOTA Implementer:** para aceitar `null` em `idTeam` com `class-validator`, usar `@IsOptional() @IsString()` + `@ValidateIf((o) => o.idTeam !== null)` ou `@Allow()` em conjunto. Padrao funcional ja usado em outros DTOs do codebase — consultar.

2. **`src/projects/projects.controller.ts`** — adicionar endpoint:
   ```
   @TenantConfig({ projectIdParam: 'id' })
   @Patch(':id')
   @Roles(OrgRole.ADMIN)
   async update(@Param('id') id, @Body() dto: UpdateProjectDto, @Request() req)
   ```
   Posicionar entre `findOne` (linha 282-290) e `remove` (linha 292+).

3. **`src/projects/projects.service.ts`**:
   - Extrair helper privado:
     ```
     private async validateTeamInOrg(
       idTeam: string,
       organizationId: bigint,
       tx?: Prisma.TransactionClient,
     ): Promise<void>
     ```
     Mover logica das linhas 95-108. Refatorar `create()` para usar.
   - Adicionar metodo:
     ```
     async update(id: string, dto: UpdateProjectDto, callerEntidadeId: string)
     ```
     Fluxo:
     1. `findFirst` projeto com `chave=BigInt(id), excluido:false` — 404 se nao encontrar (OrgTenantGuard ja garante org)
     2. Se `dto.idTeam !== undefined && dto.idTeam !== null` → `validateTeamInOrg(dto.idTeam, project.idOrganizacao)`
     3. Construir objeto `data` com apenas campos definidos no DTO. `idTeam: null` desvincula explicitamente. `idTeam: undefined` (omitido) preserva valor atual.
     4. `prisma.dProject.update({ where, data, include: { organizacao, owner } })` — single-table, sem `$transaction`
     5. Audit fire-and-forget: `eventService.logEvent('project.updated', BigInt(callerEntidadeId), { projectId: id, projectName: updated.nome, changes: { name?, description?, idTeam?, startDate? } })` — incluir apenas campos efetivamente alterados (diff)
     6. Return `formatProject(updated)`

4. **`src/projects/projects.service.spec.ts`** — adicionar 5 testes:
   - happy path: edita nome+descricao com sucesso
   - `idTeam: null` desvincula projeto
   - `idTeam` cross-org rejeitado (BadRequestException via helper)
   - projeto nao encontrado → NotFoundException
   - multi-tenant safety: caller cuja org != project.idOrganizacao → 404 (OrgTenantGuard ja cobre via `TenantConfig`, mas teste do service simula direto e valida que `findFirst` com `excluido:false` retorna null para id inexistente — defesa em profundidade)

### Frontend — Arquivos a criar/modificar
1. **`src/types/index.ts` (ou onde fica `Project`)** — adicionar `UpdateProjectDto`:
   ```ts
   { nome?: string; descricao?: string | null; idTeam?: string | null; startDate?: string }
   ```

2. **`src/lib/api/projects.ts`** — adicionar metodo:
   ```ts
   update: async (id: string, dto: UpdateProjectDto): Promise<Project> => {
     const { data } = await api.patch(ENDPOINTS.PROJECT(id), {
       name: dto.nome,
       description: dto.descricao,
       idTeam: dto.idTeam,        // null permitido (desvincula)
       startDate: dto.startDate,
     });
     return mapProject(data);
   }
   ```
   Atencao: `axios` envia `null` no body (vs `undefined` que axios omite). Implementer precisa garantir que `idTeam: null` chega ao backend.

3. **`src/lib/hooks/use-projects.ts`** — adicionar hook (espelhar `useDeleteProject`):
   ```ts
   export function useUpdateProject() {
     const qc = useQueryClient();
     return useMutation({
       mutationFn: ({ id, dto }: { id: string; dto: UpdateProjectDto }) =>
         projectsApi.update(id, dto),
       onSuccess: (data) => {
         qc.invalidateQueries({ queryKey: QUERY_KEYS.projects });
         qc.invalidateQueries({ queryKey: QUERY_KEYS.project(data.chave) });
         qc.invalidateQueries({ queryKey: QUERY_KEYS.projectSummaries() });
         toast.success(`Projeto "${data.nome}" atualizado`);
       },
       onError: (err) => { /* 403/404/400 com mensagens claras */ }
     });
   }
   ```

4. **`src/components/projects/edit-project-modal.tsx`** — NOVO componente:
   - Props: `project: Project, open: boolean, onOpenChange: (v: boolean) => void`
   - Campos: Nome (input), Descricao (textarea), Time (Select com opcoes da org + opcao "Sem time" → envia `null`)
   - Submit: chama `useUpdateProject().mutate({ id, dto })`
   - **NAO incluir multi-select de membros** (decisao 1)
   - Reusa estilo visual de `new-project-modal.tsx` (Implementer pode copiar Dialog/Form structure)

5. **`src/app/(app)/projects/page.tsx`** — modificar:
   - Importar `EditProjectModal`
   - Estado local: `const [editingProject, setEditingProject] = useState<Project | null>(null)`
   - No `DropdownMenuContent` (logo apos o trigger), adicionar como **primeiro item**:
     ```tsx
     <DropdownMenuItem onClick={() => setEditingProject(p)}>
       <Pencil className="mr-2 h-4 w-4" /> Editar projeto
     </DropdownMenuItem>
     <DropdownMenuSeparator />
     ```
   - Renderizar `<EditProjectModal project={editingProject} open={!!editingProject} onOpenChange={(v) => !v && setEditingProject(null)} />` no final do componente

---

## 5. Plano de Implementacao (Fases)

| # | Fase | Onde | Tempo |
|---|------|------|-------|
| 1 | Backend: `UpdateProjectDto` + endpoint + service.update + helper extraido | backend | 1h |
| 2 | Backend: 5 specs em `projects.service.spec.ts` | backend | 1h |
| 3 | Backend: build PASS + npm test PASS | backend | 30min |
| 4 | Frontend: api client + hook + types | frontend | 30min |
| 5 | Frontend: `EditProjectModal` + integracao no dropdown da page | frontend | 45min |
| 6 | Frontend: smoke test manual (editar nome → recarrega; trocar time → reflete; desvincular time → vira "Sem time") | frontend | 15min |

**Ordem critica:** Backend completo (fases 1-3) ANTES do frontend (fases 4-6). Frontend nao pode chamar PATCH antes do endpoint existir.

---

## 6. Riscos e Mitigacoes

| Risco | Mitigacao |
|-------|-----------|
| `idTeam: null` no PATCH — `class-validator` pode rejeitar | Usar padrao `@IsOptional() @IsString()` + permitir null explicitamente; testar no spec "idTeam null desvincula" |
| `axios` omitir `null` no body | Implementer envia objeto direto (`null` e propriedade existente, nao undefined); confirmar via DevTools no smoke |
| Concorrencia com tasks paralelas (git status do user mostra arquivos modificados em `src/teams/`) | Implementer faz `git status` antes de commitar; se conflito em `prisma/schema.prisma` ou DTOs de teams, **pausar e perguntar** ao Tech Lead — nao auto-resolver |
| Cascade de invalidate queries no frontend perder cache de outras paginas | `useUpdateProject` invalida 3 keys (`projects`, `project(id)`, `projectSummaries`) — espelha padrao do `useDeleteProject` |
| Backend audit log "diff de campos" complexo demais | MVP: `changes` no payload tem apenas chaves dos campos enviados no DTO (nao precisa comparar before/after). Suficiente para auditoria. |

---

## 7. Estimativa de Tempo (Buffer 20%)

- Backend: 2h30 base × 1.2 = **3h**
- Frontend: 1h15 base × 1.2 = **1h30**
- **Total: 4h30**

Alinha com a estimativa de 4h do Tech Lead; meia hora extra para spec e smoke.

---

## 8. Criterios de Sucesso

**MUST:**
- [ ] `PATCH /projects/:id` retorna 200 com projeto atualizado
- [ ] Apenas `OrgRole.ADMIN` pode editar (403 para MEMBER/VIEWER)
- [ ] `idTeam: null` desvincula corretamente (DB grava null)
- [ ] `idTeam` de outra org → 400 BadRequestException
- [ ] Multi-tenant: editar projeto de outra org → 404
- [ ] Audit `project.updated` emitido com `changes` no payload
- [ ] 5 specs PASS, build PASS, TypeScript 0 errors
- [ ] Frontend: dropdown "⋯" → "Editar projeto" → modal abre → submit atualiza UI sem reload manual

**SHOULD:**
- [ ] Toast de sucesso/erro com mensagem clara (incluindo 403 e 400)
- [ ] Modal de edicao reaproveita estilo visual do new-project-modal
- [ ] Loading state durante submit (botao disabled + spinner)

**COULD (backlog):**
- [ ] Botao "Editar" tambem na pagina `/projects/:id` (Opcao Y)
- [ ] Permitir MANAGER do projeto editar nome/descricao (sem trocar time)

---

**Handoff para Implementer:**

1. Comece pelo BACKEND (fases 1-3). NAO toque no frontend ate backend ter build+test PASS.
2. **`git status` antes de cada commit** — se conflito com modificacoes pendentes em `src/teams/*` ou `prisma/schema.prisma`, **pausar e perguntar** ao Tech Lead. Nao auto-merge.
3. Decisoes ja tomadas — siga o plano:
   - Modal: `edit-project-modal.tsx` separado (NAO refatore new-project-modal)
   - Trigger: dropdown da `/projects/page.tsx` (NAO adicione em `/projects/:id`)
   - Role: `OrgRole.ADMIN` only (igual DELETE)
   - Helper: extraia `validateTeamInOrg` em ProjectsService antes de implementar update
4. Audit log: emita SEMPRE apos `prisma.dProject.update` (Pilar 7 — apos persistencia), fire-and-forget com `.catch(...)`.
5. Commits separados (Conventional Commits):
   - `feat(projects): adiciona endpoint PATCH /projects/:id (ADMIN) e UpdateProjectDto`
   - `test(projects): adiciona 5 specs para update (happy/null/cross-org/404/multi-tenant)`
   - `feat(projects-ui): adiciona modal de edicao de projeto via dropdown da lista`
6. Ao terminar, atualize `workspace/STATUS.md` com timeline da entrega.
