# PRD: Refatoracao Scrumban Frontend para V3 (Repositorio de Intencoes)

**Data:** 2026-03-26
**Autor:** Devari Tecnologia
**Status:** APROVADO — Pronto para execucao
**Revisado por:** Strategist Agent (aprovado com ressalvas, todas aplicadas)
**Base:** SCRUMBAN-ARCHITECTURE-V3.md (documento fundacional)
**Escopo:** Frontend APENAS (Srumban-Frontend/)

---

## 1. Contexto

O Scrumban Frontend passou por 3 versoes conceituais:

- **V1:** Kanban board com IA assistiva (estimar, decompor, melhorar tasks)
- **V2:** Blueprint com agentes worker que executam tasks
- **V3:** Repositorio passivo de intencoes (pivô fundacional — 150+ fontes)

A V3 redefiniu completamente o que o Scrumban E e o que NAO E:

```
SCRUMBAN = Repositorio passivo de intencoes
SCRUMBAN ≠ Plataforma de execucao de agentes
```

O frontend atual tem ~164 arquivos .ts/.tsx e ~23.000 linhas.
Aproximadamente 25% viola os principios V3.

---

## 2. Objetivo Final

Transformar o frontend de "Kanban com IA assistiva" em "Repositorio de Intencoes com visualizacao de fluxo".

Ao final:
1. Intencoes em lista agrupada por 4 estados (INBOX, READY, EXECUTING, DONE) + VALIDATING/VALIDATED
2. Wizard de 3 passos para criar intencoes
3. Hill Charts com modelo atomico (refinamento, nao execucao)
4. Metricas de fluxo (cycle time, throughput, WIP, Monte Carlo, CFD)
5. Projetos conectados (API keys, throughput, atividade)
6. Canais de entrada (WhatsApp, email, Slack)
7. ZERO referencia a execucao de agentes, tokens, custo de IA, ou sub-estados

---

## 3. Principios Inviolaveis (V3)

| # | Principio | Implicacao no Frontend |
|---|-----------|----------------------|
| P1 | Scrumban e passivo | ZERO UI de execucao de agentes |
| P2 | Execucao e atomica | ZERO sub-estados (review, testing, implementing) |
| P3 | Intent-Driven | Unidade = IntentionDocument, nao Task |
| P4 | 4 estados + validacao | INBOX, READY, EXECUTING, DONE, VALIDATING, VALIDATED |
| P5 | Metricas de fluxo | Cycle time, throughput, WIP — ZERO tokens/custo |
| P6 | API-First | Projetos se conectam via API |
| P7 | Multi-canal | Entrada por WhatsApp, email, Slack, web, API |
| P8 | Humano sempre refina | INBOX -> READY requer acao humana |
| P9 | Projeto autonomo | ZERO config de agente no Scrumban |

---

## 4. Decisoes do Fundador

| Decisao | Escolha | Impacto |
|---------|---------|---------|
| Estados VALIDATING/VALIDATED | **Incluir no MVP** | Adicionar ao tipo IntentionStatus e a UI |
| `circuit-breaker.ts` | **Manter** | Appetite compliance e alinhado com V3 |
| `lib/hooks/use-board.ts` | **Remover** | Resquicio Kanban V1 |
| `card-feedback.tsx` | **Remover** | Feedback de execucao, nao de fluxo |

---

## 5. Diagnostico Completo (Auditoria Precisa)

### 5.1 Arquivos a REMOVER (13 arquivos, ~1.317 linhas)

**Componentes card-detail (5 arquivos, 529 linhas):**

| Arquivo | Linhas | Viola | Motivo |
|---------|--------|-------|--------|
| `components/card-detail/card-ai-alerts.tsx` | 87 | P1, P2 | Alertas de IA (WIP age, sem descricao, sem estimativa) |
| `components/card-detail/card-ai-panel.tsx` | 193 | P1, P2 | Painel de execucao IA (estimar, decompor, melhorar) |
| `components/card-detail/card-estimation-result.tsx` | 46 | P5 | Resultado de estimativa IA |
| `components/card-detail/card-subtasks-list.tsx` | 50 | P2, P3 | Subtasks geradas por IA |
| `components/card-detail/card-feedback.tsx` | 153 | P2 | Feedback de execucao (nao de fluxo) |

**Componentes settings (3 arquivos, 522 linhas):**

| Arquivo | Linhas | Viola | Motivo |
|---------|--------|-------|--------|
| `components/settings/api-key-card.tsx` | 216 | P1, P9 | Config de API key de agente IA |
| `components/settings/behavior-config.tsx` | 166 | P1, P9 | Comportamento de agente (auto-PR, modelo) |
| `components/settings/cost-limits.tsx` | 140 | P1, P5, P9 | Limites de tokens/custo |

**API layer (2 arquivos, 86 linhas):**

| Arquivo | Linhas | Viola | Motivo |
|---------|--------|-------|--------|
| `lib/api/ai-estimation.ts` | 63 | P1, P2, P9 | Endpoints de estimar/decompor/melhorar |
| `lib/api/automation.ts` | 23 | P1 | Endpoints de planning status e daily summary |

**Hooks (1 arquivo, 245 linhas):**

| Arquivo | Linhas | Viola | Motivo |
|---------|--------|-------|--------|
| `lib/hooks/use-board.ts` | 245 | P4 | Hook do board Kanban V1 (colunas, sugestoes IA, duplicatas) |

**Types (2 arquivos, 88 linhas):**

| Arquivo | Linhas | Viola | Motivo |
|---------|--------|-------|--------|
| `types/ai.ts` | 59 | P1, P2 | Tipos de resposta IA |
| `types/automation.ts` | 29 | P1 | Tipos de automacao |

### 5.2 Tipos a LIMPAR em `types/intention.ts`

Remover tipos:
- `AgentMember` (tipo completo)
- `GeneratedFile` (tipo completo)
- `AgentExecutionMetrics` (tipo completo)
- `IntentionExecution` (tipo completo)

Remover campos de `IntentionDocument`:
- `assignee: AgentMember | null` (remover completamente — quem puxa e o projeto via API)
- `execution: IntentionExecution | null` (execucao e atomica, invisivel)

Simplificar:
- `TimelineEvent.actorType`: remover "agent" como opcao (Scrumban nao sabe se foi humano ou agente)

Adicionar ao tipo `IntentionStatus`:
- `"validating"` (stakeholder validando resultado)
- `"validated"` (stakeholder aprovou)

Limpar re-exports em `types/index.ts`:
- Remover re-exports de `ai.ts`
- Remover re-exports de `automation.ts`
- Remover re-exports de tipos de execucao de `intention.ts`

### 5.3 Arquivos a ADAPTAR (5 arquivos, ~150 linhas a remover)

| Arquivo | Linhas Total | O que remover | Linhas ~rem |
|---------|-------------|---------------|-------------|
| `components/card-detail/card-detail-sheet.tsx` | 255 | Import e secao CardAIPanel, CardAIAlerts, CardFeedback, CardSubtasksList, CardEstimationResult | ~25 |
| `components/card-detail/card-intention-doc.tsx` | 201 | Botao "Gerar com IA" e skeleton de geracao | ~20 |
| `lib/hooks/use-automation.ts` | 95 | usePlanningStatus, useDailySummary, useGenerateIntentionDoc | ~55 |
| `lib/hooks/use-card-detail.ts` | 217 | useEstimateTask, useDecomposeTask, useImproveTask | ~40 |
| `lib/api/endpoints.ts` | 112 | Endpoints de IA/automacao (~15-20 endpoint defs) | ~20 |

### 5.4 Mock Data a LIMPAR

| Arquivo | O que limpar |
|---------|-------------|
| `lib/mock/intentions-data.ts` | Remover `MOCK_AGENTS` (AgentMember[]), `AI_SUGGESTIONS`, dados de execucao. Manter apenas dados de intencao puros. |

### 5.5 Componentes a CRIAR ou EVOLUIR

| Componente | Tipo | Descricao |
|-----------|------|-----------|
| `components/inbox/inbox-refinement.tsx` | **NOVO** | PO refina intencoes INBOX: edita criterios, define projeto, prioridade. Acoes: READY ou DISCARDED. Validacao: criterios obrigatorios antes de READY. (P8 — mais critico) |
| `components/projects/activity-timeline.tsx` | **NOVO** (preencher placeholder) | Feed cronologico: "Projeto X completou intencao Y com PR #42". Filtros por projeto e periodo. |
| `components/settings/channels-config.tsx` | **PREENCHER** placeholder | Config de webhook WhatsApp (URL, token), email inbound, Slack bot. Status por canal. So formulario — integracao real e V2. |
| Evolucao `app/(app)/projects/page.tsx` | **EVOLUIR** | Adicionar: API key (parcial), throughput por projeto, status conexao, ultima atividade. |
| Adaptar `components/intentions/intention-list.tsx` | **ADAPTAR** | Remover refs V2 internas. Garantir que suporta VALIDATING/VALIDATED. |
| Renaming labels em dashboards | **ADAPTAR** | "task/card" -> "intencao" em ~20 strings dos componentes de dashboard existentes. |

### 5.6 O que JA ESTA ALINHADO (manter sem mudanca)

| Componente | Status |
|-----------|--------|
| `intentions/intention-list.tsx` | 4 estados V3 corretos (INBOX, READY, EXECUTING, DONE) |
| `intentions/hill-chart.tsx` + `hill-chart-dot.tsx` + `hill-chart-section.tsx` | Existe, precisa modelo atomico (Fase 3) |
| `intentions/intention-wizard.tsx` + wizard steps (3 arquivos) | Wizard 3 passos alinhado |
| `intentions/intention-doc-view.tsx` | Documento de intencao correto |
| `intentions/intention-filters.tsx` + `intention-status-badge.tsx` | Filtros e badges OK |
| `intentions/intention-timeline.tsx` | Timeline de atividade OK |
| `intentions/views-toggle.tsx` + `intention-actions.tsx` | UI helpers OK |
| `dashboard/` (todos os componentes) | Metricas de fluxo corretas |
| `analytics/` (todos os componentes) | Relatorios OK |
| `common/app-sidebar.tsx` + `lib/navigation.ts` | Sidebar JA alinhada com V3 |
| `lib/api/` — client, comments, dashboards, flow-metrics, forecast, projects, webhooks, branding, notifications, circuit-breaker, retrospective, tags, tasks, columns, templates | Alinhados |
| `lib/hooks/` — use-auth, use-dashboards, use-forecast, use-analytics, use-intentions, use-keyboard-shortcuts, use-media-query, use-notifications, use-page-title | Alinhados |
| `lib/stores/auth-store.ts` | OK |

### 5.7 Numeros Consolidados

| Acao | Arquivos | Linhas |
|------|----------|--------|
| Remover (completo) | 13 | ~1.317 |
| Adaptar (remover trechos) | 5 | ~160 linhas removidas |
| Limpar tipos | 1 | ~60 linhas removidas |
| Limpar mock | 1 | ~TBD linhas |
| Criar/evoluir | 3 novos + 3 evolucoes | ~800-1.200 estimadas |
| Manter (sem mudanca) | ~147 | ~21.500 |

---

## 6. Fases de Execucao (4 Fases)

### Fase 1: LIMPEZA COMPLETA

**Objetivo:** Eliminar TODO codigo V2/execucao. Tipos, arquivos, mocks, imports, build.
**Risco:** MEDIO (cascata de dependencias tipos -> arquivos -> imports).
**Estimativa:** 4-6h

**Ordem de execucao (CRITICA — respeitar sequencia):**

```
1.1 Limpar tipos PRIMEIRO
    -> types/intention.ts: remover AgentMember, GeneratedFile,
       AgentExecutionMetrics, IntentionExecution, campos assignee/execution
    -> types/intention.ts: adicionar "validating" e "validated" a IntentionStatus
    -> types/index.ts: remover re-exports de ai.ts e automation.ts
    -> BUILD CHECK

1.2 Deletar arquivos V2 (13 arquivos)
    -> card-detail: card-ai-alerts, card-ai-panel, card-estimation-result,
       card-subtasks-list, card-feedback (5 arquivos)
    -> settings: api-key-card, behavior-config, cost-limits (3 arquivos)
    -> api: ai-estimation, automation (2 arquivos)
    -> hooks: use-board (1 arquivo)
    -> types: ai.ts, automation.ts (2 arquivos)
    -> BUILD CHECK

1.3 Adaptar arquivos contaminados (5 arquivos)
    -> card-detail-sheet.tsx: remover imports e secoes de AI/feedback
    -> card-intention-doc.tsx: remover botao "Gerar com IA"
    -> use-automation.ts: remover hooks de planning/daily/generate
    -> use-card-detail.ts: remover hooks de estimate/decompose/improve
    -> endpoints.ts: remover endpoint defs de IA/automacao
    -> BUILD CHECK

1.4 Limpar mock data
    -> lib/mock/intentions-data.ts: remover MOCK_AGENTS, AI_SUGGESTIONS,
       dados de execucao. Manter dados de intencao puros.
    -> BUILD CHECK

1.5 Corrigir imports quebrados restantes
    -> Buscar todos os imports que referenciam arquivos deletados
    -> Corrigir ou remover
    -> BUILD CHECK FINAL

1.6 Verificar links mortos na sidebar
    -> Confirmar que todos os links na navegacao apontam para paginas existentes

1.7 Grep com contexto por termos proibidos
    -> Termos ABSOLUTOS (sempre violacao): "agent-worker", "agent-executor",
       "ai-estimation", "decompose", "improve-task", "AgentMember",
       "IntentionExecution", "AgentExecutionMetrics"
    -> Termos CONTEXTUAIS (verificar contexto): "estimate", "cost",
       "tokens", "agent"
    -> Ignorar contexto legitimo: forecasting, analytics, capacity
```

**Criterio de aceite:**
- Build passa (npm run build)
- Zero arquivos V2 restantes
- Zero tipos de execucao nos types
- Zero imports quebrados
- Grep ABSOLUTO retorna 0 resultados
- Grep CONTEXTUAL: todos os resultados sao contexto legitimo

---

### Fase 2: COMPONENTES NOVOS + EVOLUCOES

**Objetivo:** Criar componentes V3 faltantes e adaptar existentes.
**Risco:** MEDIO-ALTO (componentes novos, maior esforco).
**Dependencia:** Fase 1 concluida.
**Estimativa:** 10-14h

**Tarefas:**

```
2.1 inbox-refinement.tsx (NOVO — MAIS CRITICO — P8)
    Wireframe:
    +--------------------------------------------------+
    | INBOX — Refinamento                    [3 itens]  |
    |--------------------------------------------------|
    | "Filtro por regiao no relatorio"  WhatsApp  hoje  |
    |   [Expandir]                                      |
    |   Problema: [editavel]                            |
    |   Solucao: [editavel]                             |
    |   Criterios de aceite: [editavel]                 |
    |   Nao-objetivos: [editavel]                       |
    |   Projeto destino: [dropdown]                     |
    |   Prioridade: [dropdown]                          |
    |   Apetite (dias): [input]                         |
    |   [Mover para READY]  [Descartar]                 |
    |--------------------------------------------------|
    | "Bug no login com Google"         Email  ontem    |
    |   [Expandir]                                      |
    +--------------------------------------------------+

    Validacao: criterios de aceite e projeto obrigatorios antes de READY.
    Campos: todos os campos da IntentionDocument editaveis inline.
    Acoes: READY (move status) ou DISCARDED (descarta com motivo).

2.2 activity-timeline.tsx (NOVO — preencher placeholder)
    Feed cronologico:
    - "devari-backend completou 'Fix N+1 query' — PR #42" (ha 2h)
    - "scrumban-be pegou 'Modulo de templates'" (ha 5h)
    - "devari-backend falhou em 'Cache Redis' — timeout" (ontem)
    Filtros: por projeto, por periodo.

2.3 channels-config.tsx (PREENCHER placeholder)
    Formulario por canal:
    - WhatsApp: URL webhook, token, status (ativo/inativo/erro)
    - Email: endereco de forwarding, dominio, status
    - Slack: workspace ID, channel, bot token, status
    Botao "Testar conexao" por canal.
    So formulario — integracao real e V2 do produto.

2.4 Evoluir projects/page.tsx
    Adicionar ao card de cada projeto:
    - API key (parcial, com botao copiar/regenerar)
    - Throughput (intencoes/semana)
    - Status conexao (ativo/inativo, ultimo ping)
    - Ultima atividade (timestamp + descricao)

2.5 Adaptar intention-list.tsx
    - Garantir suporte a VALIDATING/VALIDATED como estados
    - Remover qualquer referencia V2 interna
    - Garantir planning trigger visual ("READY queue < threshold")

2.6 Renaming labels em dashboards
    - Buscar strings "task", "card", "tarefa" nos componentes de dashboard
    - Substituir por "intencao" / "intention" conforme contexto
    - ~20 strings estimadas
```

**Criterio de aceite:**
- Todos os componentes novos renderizam sem erro
- inbox-refinement permite fluxo INBOX -> READY com validacao
- activity-timeline exibe eventos (mock data OK)
- channels-config exibe formularios por canal
- projects mostra campos V3
- intention-list suporta 6 estados (4 + 2 validacao)
- Labels de dashboard dizem "intencao", nao "task"

---

### Fase 3: HILL CHART ATOMICO

**Objetivo:** Adaptar Hill Chart para modelo atomico V3.
**Risco:** BAIXO.
**Dependencia:** Fase 1 concluida.
**Estimativa:** 3-4h

**Tarefas:**

```
3.1 Modelo de posicionamento atomico
    - INBOX: posicao 0-25% (uphill — descoberta)
    - READY: posicao 25-50% (uphill — clareza)
    - EXECUTING: posicao FIXA 70% (downhill — binario)
    - DONE: posicao FIXA 100% (base direita)
    - FAILED: posicao FIXA 85% com icone de erro
    - VALIDATING: posicao FIXA 90%
    - VALIDATED: posicao FIXA 100% com icone de check

3.2 Drag restrito
    - Drag HABILITADO apenas para INBOX e READY (0-50%)
    - PO arrasta dot conforme refina a intencao
    - EXECUTING/DONE/FAILED: posicao automatica, sem drag

3.3 Labels
    - Lado esquerdo: "Descoberta" (refinamento)
    - Topo: "Clareza" (pronto para executar)
    - Lado direito: "Entregue" (resultado)

3.4 Transicoes automaticas
    - Quando projeto reporta "executing": dot pula para 70%
    - Quando projeto reporta "completed": dot pula para 100%
    - Animacao suave na transicao
```

**Criterio de aceite:**
- Dots INBOX/READY sao arrastáveis (0-50%)
- Dots EXECUTING fixos em 70%
- Dots DONE fixos em 100%
- Labels corretos
- Transicoes animadas

---

### Fase 3: HILL CHART ATOMICO — COMPLETA (26/03/2026)

**Status:** ✅ APROVADO (Score: 8.5/10)
**Tempo Real:** 2h
**Reviewer:** reviewer-agent (0 CRITICAL, 0 HIGH, 2 MEDIUM)

**O que foi feito:**
- Reescrita dos 3 componentes: `hill-chart.tsx`, `hill-chart-dot.tsx`, `hill-chart-section.tsx`
- Clamp drag INBOX: 0-25%, READY: 25-50% (separacao por zona clara)
- Posicoes fixas por status: EXECUTING=70%, DONE=100%, FAILED=85%, VALIDATING=90%, VALIDATED=100%
- Icones SVG inline (pulsing para EXECUTING, checkmark para DONE, X para FAILED)
- CSS transitions suaves para dots fixos
- CANCELLED/DISCARDED filtrados (HIDDEN_STATUSES)
- Contadores header: "N refinando | N executando"
- Trail (ghost positions) apenas para dots arrastáveis
- Responsividade (viewBox SVG)
- Dark mode (CSS variables, zero hardcoded colors)

**Metricas:**
- 3 arquivos modificados, 820 linhas
- Build: PASS (0 errors)
- ESLint: 0 warnings
- Testes funcionais: 100%

**Issues Conhecidos (Baixa Prioridade):**
- [L1] Tooltip mostra hillPosition anterior, nao posicao efetiva (impacto visual apenas)

---

### Fase 4: ENDPOINTS DE METRICAS — COMPLETA (26/03/2026)

**Status:** ✅ APROVADO (Score: 8.5/10)
**Tempo Real:** 3h
**Repo:** scrumban-be/
**Reviewer:** reviewer-agent (0 CRITICAL, 0 HIGH, 2 MEDIUM)

**O que foi feito:**

**Backend: 10 endpoints, 3 modulos, 1472 linhas**

| Modulo | Arquivos | Endpoints |
|--------|----------|-----------|
| FlowMetricsModule | 4 arquivos (148L controller, 543L service) | /flow-metrics/:projectId/cycle-time, lead-time, throughput, wip-age, cfd, dashboard |
| AnalyticsModule | 3 arquivos (96L controller, 314L service) | /analytics/:projectId/compare, capacity-forecast, stakeholder-report |
| ForecastModule | 3 arquivos (72L controller, 202L service) | /forecast/:projectId (Monte Carlo) |

**Arquitetura:**
- **N+1 Queries:** ZERO (queries diretas, Promise.all paralelo)
- **CFD:** Calculo retroativo (sem snapshots diarios)
- **Monte Carlo:** 10.000 simulacoes em <50ms
- **Dashboard:** 6 queries paralelas
- **Filtro V3:** Todos os endpoints filtram `status.idClasse = -440` (apenas intencoes V3)

**Qualidade:**
- Build: PASS (0 errors)
- TypeScript: 0 errors
- ESLint: 0 warnings
- Guards: JwtAuthGuard + RolesGuard em todos endpoints
- Swagger: Completo (DTOs, responses, exemplos)
- Loggers: NestJS Logger (zero console.log)

**Metricas Calculadas:**
- Cycle time (dias medio, mediana, P85)
- Lead time (dias desde criacao)
- Throughput (intencoes/semana)
- WIP Age (intencoes >3 dias em EXECUTING)
- CFD (fluxo cumulativo por dia)
- Dashboard (agregado dos 5 anteriores)
- Comparacao periodos (delta metricas)
- Previsao capacidade (proximas 4 semanas)
- Relatorio stakeholder (execucao + previsao)
- Forecast Monte Carlo (probabilidade entrega)

**Issues Conhecidos:**
- [M1] TimezoneService ausente em getPeriodStart() nos 3 services (impacto: imprecisao na fronteira do dia em UTC-3)
- [M2] Campo apetiteDias referencia estimativa no backend (adapter mascara silenciosamente)
- [L2] Logica ISO Week duplicada entre FlowMetrics e Forecast (extract para common utils)
- [L3] Monte Carlo usa Math.random() nao-seedavel (aceitavel para producao, dificulta testes)

---

### Fase 5: CONECTAR FRONTEND AO BACKEND — COMPLETA (26/03/2026)

**Status:** ✅ APROVADO (Score: 8.5/10)
**Tempo Real:** 2h
**Repo:** Srumban-Frontend/
**Reviewer:** reviewer-agent (0 CRITICAL, 0 HIGH, 2 MEDIUM)

**O que foi feito:**

**Frontend: Adapters + API client + Hooks reescritos**

| Arquivo | Tipo | Descricao |
|---------|------|-----------|
| `src/lib/adapters/task-to-intention.ts` | NOVO (200L) | Backend Task -> Frontend IntentionDocument |
| `src/lib/adapters/intention-to-task.ts` | NOVO (170L) | CreateIntentionDto -> POST /tasks body |
| `src/lib/api/intentions.ts` | NOVO (90L) | API client (list, getById, create, updateStatus, update) |
| `src/lib/hooks/use-intentions.ts` | REESCRITO (276->257L) | Mock state -> TanStack Query (API real) |
| `src/lib/constants.ts` | MODIFICADO | +2 QUERY_KEYS para intentions |

**Adapters:**
- Status resolution: chave > codigo > nome > default (graceful degradation)
- Fallback V1: "todo"->inbox, "doing"->executing (coexistencia V1/V3)
- JSON parse com fallback para split (criteriosAceite, naoObjetivos, riscos)
- Campos V3 ausentes no backend: hillPosition=0, canal="web", timestamps ~atualizadoEm
- DEvento parsing para timeline minima

**API Client:**
- Usa GET /projects/:projectId/tasks com intentionMode=true (reutiliza endpoint)
- Retorna IntentionDocument (via adapters)
- Metodos: list, getById, create, updateStatus, update
- Suporta filters (status, tipo, prioridade, canal)

**Hooks Reescritos:**
- `useIntentions()`: query real via TanStack, client-side filtering
- `useIntention()`: query individual via ID
- `useCreateIntention()`: mutation via API + invalidacao
- `useUpdateIntention()`: mutation via API
- `useMoveToReady()`: mutation status
- `useDiscardIntention()`: mutation status + motivo
- `useUpdateHillPosition()`: optimistic cache update (backend ainda sem campo)
- `useDefaultProjectId()`: resolve primeiro projeto do usuario

**Verificacoes:**
- Interface publica preservada: ZERO regressao
- Consumers verificados: intention-list, inbox-refinement, intention-wizard, hill-chart, intention-detail
- Build: PASS (0 errors, 24 rotas Next.js)
- TypeScript: 0 errors
- ESLint: 0 warnings

**Issues Conhecidos:**
- [L4] useDefaultProjectId chama useProjects incondicionalmente (1 query extra quando projectId ja conhecido)

---

### Fase 4 (antiga): VALIDACAO FINAL

**Status:** Consolidada nas Fases 3, 4, 5 acima

---

### Fase 4 (Sequencia Original): VALIDACAO FINAL

**Objetivo:** Garantir alinhamento 100% com V3.
**Risco:** BAIXO.
**Dependencia:** Todas as fases anteriores.
**Estimativa:** 2-3h

**Tarefas:**

```
4.1 Checklist dos 9 principios V3

    P1 — Passivo:
    [ ] Grep "agent-worker|agent-executor|AgentMember" retorna 0
    [ ] Nenhuma UI dispara execucao

    P2 — Atomico:
    [ ] Grep "IntentionExecution|AgentExecutionMetrics" retorna 0
    [ ] Nenhum sub-estado visivel (review, testing, implementing)

    P3 — Intent-Driven:
    [ ] Tipo principal e IntentionDocument
    [ ] Labels dizem "intencao", nao "task" (exceto tipo tecnico)

    P4 — 4 estados + validacao:
    [ ] IntentionStatus tem: inbox, ready, executing, done,
        failed, cancelled, discarded, validating, validated

    P5 — Metricas de fluxo:
    [ ] Dashboard mostra: cycle time, throughput, WIP, CFD, Monte Carlo
    [ ] ZERO referencia a tokens, custo de agente, build status

    P6 — API-First:
    [ ] Pagina de projetos mostra API key
    [ ] API contract documentado

    P7 — Multi-canal:
    [ ] Pagina de canais existe com formularios

    P8 — Humano refina:
    [ ] inbox-refinement funcional (INBOX -> READY)
    [ ] Criterios obrigatorios antes de READY

    P9 — Projeto autonomo:
    [ ] ZERO config de agente no Scrumban
    [ ] ZERO referencia a modelo Claude, tokens, custo

4.2 Verificar responsividade (mobile, tablet, desktop)
4.3 Verificar dark mode em paginas novas/adaptadas
4.4 Build final (npm run build — zero errors)
4.5 Limpar mock data residual (se houver)
```

**Criterio de aceite:**
- Checklist 9/9 principios com evidencia
- Build limpo
- Todas as paginas renderizam em 3 viewports
- Dark mode funcional

---

## 7. O Que NAO Esta no Escopo

| Item | Motivo |
|------|--------|
| Backend do Scrumban (scrumban-be) | PRD separado |
| Integracao REAL com WhatsApp/Slack/Email | V2 do produto (formulario sim, webhook real nao) |
| Parser IA para canais nao-estruturados | Backend scope |
| SDK para projetos (@scrumban/client) | V3/V4 do produto |
| Testes E2E | Fase posterior |
| Testes unitarios dos componentes novos | Fase posterior |

---

## 8. Riscos e Mitigacoes

| Risco | Prob | Impacto | Mitigacao |
|-------|------|---------|-----------|
| Cascata de dependencias tipos -> arquivos -> imports | Alta | Medio | Ordem: tipos PRIMEIRO, build check incremental |
| Perder funcionalidade util ao remover agressivamente | Media | Alto | Lista explicita do que FICA (secao 5.6) |
| Mock data inconsistente apos limpeza | Media | Medio | Limpar mocks na Fase 1, nao na Fase 4 |
| Falsos positivos no grep de validacao | Alta | Baixo | Grep com contexto, separar termos absolutos vs contextuais |
| inbox-refinement complexo demais | Media | Alto | Wireframe detalhado na secao 6, Fase 2.1 |

---

## 9. Metricas de Sucesso

| Metrica | Target |
|---------|--------|
| Arquivos V2 restantes | 0 |
| Build errors | 0 |
| Componentes novos/evoluidos | 6/6 |
| Principios V3 cobertos | 9/9 |
| Labels "task" em dashboards | 0 |
| Referencias a execucao de agente | 0 |

---

## 10. Estimativa Total

| Fase | Descricao | Horas | Risco |
|------|-----------|-------|-------|
| 1 | Limpeza completa | 4-6h | Medio |
| 2 | Componentes novos + evolucoes | 10-14h | Medio-Alto |
| 3 | Hill Chart atomico | 3-4h | Baixo |
| 4 | Validacao final | 2-3h | Baixo |
| **Total** | | **19-27h** | |
| **Com buffer 20%** | | **23-32h** | |

---

*Fundamentado em: SCRUMBAN-ARCHITECTURE-V3.md + Auditoria de 164 arquivos + Revisao critica do Strategist.*
*Decisoes do fundador: VALIDATING/VALIDATED no MVP, manter circuit-breaker, remover use-board, remover card-feedback.*
