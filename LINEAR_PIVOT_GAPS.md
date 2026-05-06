# Linear Pivot — Gaps de Backend/Schema

Documento vivo dos gaps encontrados durante a pivotagem do Scrumban para clone do Linear (iniciada em **2026-05-06**).

Toda tela do Linear que tentamos reproduzir e que **o backend/schema atual não comporta** é registrada aqui. O frontend continua avançando com o que é possível; estes itens entram em backlog para implementação futura quando houver folga.

---

## Como usar este documento

A cada nova tela do Linear que for clonada:

1. Comparar feature-a-feature contra `schema.prisma` (ver backend).
2. Para cada item que **não atende** ou **atende com alterações**, registrar uma entrada na tabela abaixo.
3. Atualizar o **Status** conforme a evolução:
   - `pendente` — gap identificado, sem decisão.
   - `em-analise` — usuário avaliando opções de solução.
   - `aprovado` — solução escolhida, aguardando implementação.
   - `em-implementacao` — backend/migration em andamento.
   - `aplicado` — gap fechado, frontend liberado.
   - `descartado` — decidido não implementar.
4. Sempre incluir: **Onde apareceu** (qual tela), **Impacto** no frontend (o que está stub), **Opções**, **Decisão**.

---

## Status atual da pivotagem

| Tela do Linear | Estado |
|---|---|
| `/projects` (All projects) | Em análise — gaps abaixo |
| `/my-issues/*` (Assigned, Created, Subscribed, Activity) | Em análise — gaps 8 e 9 abaixo |

---

## Gaps identificados

### 1. Conceito de Teams

- **Onde apareceu:** Sidebar do Linear (`Your teams > Devari Tecnologia > Issues / Projects / Views`). Linear estrutura `Workspace > Team > Project`.
- **Schema atual:** Só temos `Org (DEntidade idClasse=-50) > Project (DProject)`. Sem nível intermediário.
- **Impacto no frontend:** Sidebar não fica idêntica. A seção "Your teams" e todo o agrupamento de issues/projects por team ficam stub.
- **Opções:**
  - (a) Criar modelo novo `DTeam` no backend.
  - (b) Reusar polimorfismo: nova `DClasse` (ex.: `-XXX TEAM`) em `DEntidade`, com `idLocEscritu` apontando para a Org.
  - (c) Pular Teams agora — mostrar Projects direto sob a Org. Reabrir quando relevante.
- **Status:** `pendente`
- **Decisão:** —

---

### 2. Views salvas

- **Onde apareceu:** Sidebar (`Workspace > Views`, `Your teams > [team] > Views`). Linear permite salvar filtros nomeados como Views.
- **Schema atual:** Não existe modelo de View.
- **Impacto no frontend:** Item "Views" da sidebar fica stub (link morto ou escondido).
- **Opções:**
  - (a) Novo modelo `DView` (campos: nome, escopo workspace/team, filtros Json, idOwner).
  - (b) Guardar lista de views em `DEntidade.dados` (Json) do usuário — viável só para views pessoais, não compartilhadas.
- **Status:** `pendente`
- **Decisão:** —

---

### 3. Initiatives

- **Onde apareceu:** Sidebar (`Try > Initiatives`). Linear usa Initiatives como agrupador acima de Projects (epic-de-projetos / OKR-style).
- **Schema atual:** Não existe.
- **Impacto no frontend:** Item "Initiatives" some ou fica stub.
- **Opções:**
  - (a) Criar modelo `DInitiative` (nome, descrição, idOrganizacao, dataInicio/Fim, status, projetos vinculados via tabela N:N).
  - (b) Pular agora.
- **Status:** `pendente`
- **Decisão:** —

---

### 4. `DProject.health`

- **Onde apareceu:** Tabela de Projects, coluna **Health**. Valores do Linear: `no_updates`, `on_track`, `at_risk`, `off_track`.
- **Schema atual:** Campo não existe em `DProject`.
- **Impacto no frontend:** Coluna Health renderiza sempre "No updates" como stub.
- **Opções:**
  - (a) Migration: adicionar coluna `health String?` em `DProject` (enum string).
  - (b) Guardar em `DProject.dados` Json (sem migration). Frontend lê `dados.health`.
- **Status:** `pendente`
- **Decisão:** —

---

### 5. `DProject.priority`

- **Onde apareceu:** Tabela de Projects, coluna **Priority**.
- **Schema atual:** `DProject` não tem `idPriority`. Apenas `DTask.idPriority` (FK para `DClasse` -421/-422/-423/-424).
- **Impacto no frontend:** Coluna Priority renderiza sempre `---` como stub.
- **Opções:**
  - (a) Migration: adicionar `idPriority BigInt?` em `DProject`, FK para `DClasse` reusando as classes existentes (-421 HIGH, -422 MEDIUM, -423 LOW, -424 URGENT).
  - (b) Guardar em `DProject.dados` Json (sem migration).
- **Status:** `pendente`
- **Decisão:** —

---

### 6. `DProject.status` como % progresso

- **Onde apareceu:** Tabela de Projects, coluna **Status** (Linear mostra `0%`, `25%`, ...).
- **Schema atual:** `DProject.status` é string com valores `active | archived | completed`. Linear mostra **percentual de progresso** derivado de issues concluídas.
- **Impacto no frontend:** Pode ser **calculado em tempo real** sem alteração de schema: `count(DTask done) / count(DTask total)`. Não é gap de schema, é gap de cálculo.
- **Opções:**
  - (a) Calcular no backend num endpoint `/projects/:id/progress` ou já incluir no list response.
  - (b) Calcular no frontend a partir das tasks (mais lento se a lista for grande).
- **Status:** `aprovado-por-default` (não precisa migration)
- **Decisão:** Calcular no backend no list response.

---

### 7. Nomenclatura: Tasks vs Issues

- **Onde apareceu:** Toda a UI do Linear chama de **Issues**. Nosso backend chama de `DTask`.
- **Schema atual:** `DTask` (model + endpoints `/tasks`).
- **Impacto no frontend:** Decisão de label e/ou rename.
- **Opções:**
  - (a) Rename só na UI: labels viram "Issues", endpoints continuam `/tasks`. Tradução só na camada de apresentação.
  - (b) Rename completo: `DTask` → `DIssue`, endpoints `/tasks` → `/issues`. Migration grande, mexe em todo o backend e em todos os fetchers do frontend.
- **Status:** `pendente`
- **Decisão:** —

---

### 8. Sub-tab "Subscribed" em My issues

- **Onde apareceu:** `/my-issues/*` — tabs `Assigned | Created | Subscribed | Activity`. Linear permite que um usuário "se inscreva" numa issue para receber notificações sem ser assignee.
- **Schema atual:** Sem modelo de subscription/follow para `DTask`.
- **Impacto no frontend:** A tab "Subscribed" fica disabled/stub (mostra empty state ou desabilitada).
- **Opções:**
  - (a) Novo modelo `DTaskSubscriber` (idTask, idUser, chcriacao). Mais limpo, suporta histórico.
  - (b) Guardar lista de userIds em `DTask.dados.subscribers` (Json). Sem migration, mas fica difícil indexar.
  - (c) Pular agora — só Assigned/Created/Activity funcionam.
- **Status:** `pendente`
- **Decisão:** —

---

### 9. Issue identifier code (`DEV-7` style)

- **Onde apareceu:** `/my-issues/*` mostra código `DEV-7` antes do título da issue. Linear gera código `<TEAM_KEY>-<N>` para cada issue (ex.: `DEV-7`, `DEV-8`...). Aparece em URLs, copiar/colar, busca, etc.
- **Schema atual:** `DTask.chave` é `BigInt autoincrement` global, sem prefixo de team/project nem contador sequencial por team. Linear depende disso para o identificador legível.
- **Impacto no frontend:** Sem código curto, mostra `#{chave}` (numérico longo) como fallback, o que destoa visualmente.
- **Opções:**
  - (a) Adicionar `DProject.issuePrefix String?` (ex.: "DEV") + `DTask.identifierNumber Int?` (sequencial por project). Migration + lógica no insert para incrementar atomicamente. Mais fiel ao Linear.
  - (b) Adicionar prefixo no Team (depende do gap #1 Teams) + counter por team.
  - (c) Manter `#{chave}` como identificador — feio mas funcional.
- **Status:** `pendente`
- **Decisão:** —

---

## Itens que NÃO são gaps de schema (apenas UI/feature)

Registrar aqui para não confundir com gaps de backend:

- Workspace switcher na sidebar — só UI.
- Search global (Cmd+K) — feature de UI/API, schema atende.
- Botão "Compose" de criação rápida — só UI.
- Tema dark Linear-style — só CSS.
- "Connect Cursor" / "Connect Codex" — integrações externas, fora do schema.

---

## Histórico de aplicações

Quando um gap for fechado (status `aplicado`), mover para esta seção com data e resumo.

_Vazio até o momento._
