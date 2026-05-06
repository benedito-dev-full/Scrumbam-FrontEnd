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
| `/inbox` | Implementada — schema atende 100% |
| `/integrations` | Implementada — schema atende 100% |
| `/project/<id>/overview` (Project detail) | Em análise — gaps 10–16 abaixo |
| `/issue/<code>/<slug>` (Issue detail) | Em análise — gaps 17–20 abaixo |
| `/settings/account/preferences` | Em análise — gaps 21–23 abaixo |
| `/settings/account/profile` | Em análise — gaps 24–25 abaixo |
| `/settings/account/notifications` | Em análise — gaps 26–29 abaixo |
| `/settings/workspace/general` | Em análise — gaps 30–33 abaixo |
| `/settings/workspace/members` | Em análise — gaps 34–36 abaixo |

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

### 10. Project Updates ("Write first project update")

- **Onde apareceu:** `/project/<id>/overview` — caixa central "Write first project update". Linear permite postar atualizações periódicas (texto + status report) que viram timeline do project.
- **Schema atual:** Sem modelo de update.
- **Impacto no frontend:** Caixa "Write project update" fica disabled ou stub.
- **Opções:**
  - (a) Novo modelo `DProjectUpdate` (idProject, idAuthor, body Text, healthAtUpdate, chcriacao). Cobre histórico e relatório.
  - (b) Reusar `DEvento` com `tipo: 'project.update'` e `payload.body` — sem migration, mas mistura updates com eventos automáticos.
  - (c) Pular agora.
- **Status:** `pendente`
- **Decisão:** —

---

### 11. Milestones

- **Onde apareceu:** `/project/<id>/overview` — seção "Milestones" no painel direito + botão "+ Milestone" inline. Linear usa milestones como agrupador de issues dentro de um project (ex.: M1, M2).
- **Schema atual:** Sem modelo. Existe `DTabela` com `idClasse=-400 Sprint` que é parecido, mas semanticamente diferente (sprint é por tempo; milestone é por entregável).
- **Impacto no frontend:** Seção fica vazia ou stub.
- **Opções:**
  - (a) Novo modelo `DMilestone` (idProject, nome, descricao, dataAlvo, ordem, status). Mais limpo.
  - (b) Reusar `DTabela` com nova `DClasse -460 MILESTONE`. Polimorfismo do Devari, sem migration.
  - (c) Pular.
- **Status:** `pendente`
- **Decisão:** —

---

### 12. Project Resources (documents/links)

- **Onde apareceu:** `/project/<id>/overview` — linha "Resources: + Add document or link...". Linear permite anexar documentos e links externos ao project.
- **Schema atual:** Sem modelo.
- **Impacto no frontend:** Botão "+ Add document or link..." fica disabled.
- **Opções:**
  - (a) Novo modelo `DProjectResource` (idProject, tipo `link|document`, url, titulo, chcriacao).
  - (b) Guardar lista em `DProject.dados.resources` (Json). Sem migration.
  - (c) Pular.
- **Status:** `pendente`
- **Decisão:** —

---

### 13. Project Slack channel

- **Onde apareceu:** `/project/<id>/overview` painel direito — campo "Slack: + Slack channel". Linear integra com canal Slack do project.
- **Schema atual:** Sem campo.
- **Impacto no frontend:** Campo fica disabled.
- **Opções:**
  - (a) `DProject.slackChannel String?` (migration simples).
  - (b) `DProject.dados.slackChannel` (Json, sem migration).
  - (c) Pular — integração externa, baixa prioridade.
- **Status:** `pendente`
- **Decisão:** —

---

### 14. Project Labels

- **Onde apareceu:** `/project/<id>/overview` painel direito — campo "Labels: + Add label". Linear permite labels custom por project (`bug`, `tech-debt`, `prod`, etc.).
- **Schema atual:** Existe `tagsApi` no frontend (`DTaskTag`?) mas só por task, não por project. Confirmar se backend tem `DProjectLabel`.
- **Impacto no frontend:** Campo fica disabled.
- **Opções:**
  - (a) Novo modelo `DProjectLabel` (idProject, nome, cor).
  - (b) Reusar mecanismo de tags existente, mas com escopo project.
  - (c) Pular.
- **Status:** `pendente`
- **Decisão:** —

---

### 15. Project favoritos (estrela)

- **Onde apareceu:** breadcrumb topo `Projects > JavouApp ☆`. Linear permite favoritar projects para acesso rápido na sidebar (seção "Favorites").
- **Schema atual:** Sem modelo de favoritos.
- **Impacto no frontend:** Botão de estrela fica disabled.
- **Opções:**
  - (a) Novo modelo `DUserFavorite` (idUser, entityType, entityId).
  - (b) Lista em `DEntidade.dados.favorites` por user (Json).
  - (c) Pular.
- **Status:** `pendente`
- **Decisão:** —

---

### 16. Description rich-text com refs inline

- **Onde apareceu:** `/project/<id>/overview` — campo "Description" embute o card `🟡 DEV-6 Teste` (referência inline a uma issue). Linear usa rich-text editor com mention/embed de issues, projects, milestones.
- **Schema atual:** `DProject.descricao` é `String?` plano. Sem suporte a refs nem rich-text persistido.
- **Impacto no frontend:** Description fica como textarea simples.
- **Opções:**
  - (a) Mudar `DProject.descricao` para `Text` (já é String, ok) e armazenar markdown/JSON estruturado. Renderizar com biblioteca de markdown + parser de refs (`#DEV-6` → link).
  - (b) Manter texto plano, sem refs (renderiza como `<pre>`).
- **Status:** `pendente`
- **Decisão:** —

---

### 17. Linked issues / relations (blocks, blocked-by, related, duplicate)

- **Onde apareceu:** `/issue/<code>` painel direito (não visível no print de issue deleted, mas é padrão Linear). Linear permite ligar issues como `blocks`, `blocked-by`, `relates-to`, `duplicate-of`.
- **Schema atual:** Sem modelo de relação entre `DTask`s.
- **Impacto no frontend:** Seção "Linked issues" fica disabled.
- **Opções:**
  - (a) Novo modelo `DTaskLink` (idTaskFrom, idTaskTo, tipo enum: blocks/related/duplicate, chcriacao). Bidirecional.
  - (b) Lista em `DTask.dados.links` (Json). Sem migration.
  - (c) Pular.
- **Status:** `pendente`
- **Decisão:** —

---

### 18. Reactions (emoji em issues e comments)

- **Onde apareceu:** Issue body e comments do Linear permitem reactions (👍 ❤️ 🎉 ...).
- **Schema atual:** Sem modelo de reaction.
- **Impacto no frontend:** Sem UI de reagir.
- **Opções:**
  - (a) Novo modelo `DReaction` (idEntityType, idEntityId, idUser, emoji). Genérico.
  - (b) Lista em `DTask.dados.reactions` e `DComment.dados.reactions`.
  - (c) Pular — feature de baixa prioridade.
- **Status:** `pendente`
- **Decisão:** —

---

### 19. Sub-issues / parent-child de issues

- **Onde apareceu:** Linear permite quebrar uma issue em sub-issues (parent-child). No frontend o tipo `Task` mapeia `idParentTask`, mas o `schema.prisma` que voce me passou nao expoe esse campo em `DTask`.
- **Schema atual:** A confirmar — pode ja existir e o schema da memoria estar incompleto. Precisa checar com backend.
- **Impacto no frontend:** Seção "Sub-issues" fica disabled ate confirmação.
- **Opções:**
  - (a) Confirmar com backend que `DTask.idParentTask` existe; se sim, schema atende.
  - (b) Caso nao exista: adicionar coluna self-relation em `DTask`.
- **Status:** `pendente — confirmar com backend`
- **Decisão:** —

---

### 20. Git branch integration

- **Onde apareceu:** topo da issue do Linear tem botão de "branch" (cria/copia comando git checkout). Integração com GitHub/GitLab.
- **Schema atual:** `DTask.prUrl` existe (atende metade — link de PR). Mas Linear tambem cria branch direto a partir da issue (`feat/dev-6-teste`).
- **Impacto no frontend:** Botão `branch` fica disabled.
- **Opções:**
  - (a) Mostrar comando `git checkout -b dev-{id}-{slug}` copiável (puramente client-side; sem schema). Implementável agora.
  - (b) Integração real com GitHub API (futuro). Depende de OAuth + tokens.
- **Status:** `pendente`
- **Decisão:** —

---

### 21. Preferences sync cross-device

- **Onde apareceu:** `/settings/account/preferences` — toda a tela de prefs (theme, sidebar, automation toggles, etc.). Linear sincroniza isso entre devices/sessions.
- **Schema atual:** `DEntidade.dados` (Json) ja existe; falta endpoint REST e adapter no frontend.
- **Impacto no frontend:** Implementacao atual usa **localStorage** apenas — preferencias nao seguem o user em outro device.
- **Opções:**
  - (a) Endpoint `GET/PUT /me/preferences` que le/escreve em `DEntidade.dados.preferences` (Json). Sem migration.
  - (b) Tabela dedicada `DUserPreference` (idUser, key, value). Migration pequena.
  - (c) Manter local-only.
- **Status:** `pendente`
- **Decisão:** —

---

### 22. Desktop application integration

- **Onde apareceu:** `/settings/account/preferences` toggle "Open in desktop app".
- **Schema atual:** Sem app desktop. Sem protocolo `scrumban://` registrado.
- **Impacto no frontend:** Toggle fica disabled.
- **Opções:**
  - (a) Construir app desktop (Electron/Tauri) e registrar protocolo. Projeto a parte.
  - (b) Pular indefinidamente — feature de produto, nao prioridade.
- **Status:** `descartado-por-default` (reabrir se decidirmos ter app desktop)

---

### 23. Git workflow integration (GitHub/GitLab)

- **Onde apareceu:** `/settings/account/preferences` secao "Automations and workflows" — toggles "On git branch copy", "On open in coding tool", "Auto-convert draft PR", e "Git attachment format".
- **Schema atual:** `DTask.prUrl` existe (atende parcialmente — link de PR manual). Sem OAuth GitHub/GitLab, sem webhooks de branch copy nem de PR draft.
- **Impacto no frontend:** Toggles ficam disabled. Tela /integrations hoje so tem MCP — git fica para outra fase.
- **Opções:**
  - (a) Implementar conector GitHub/GitLab (OAuth + webhook listener). Trabalho consideravel.
  - (b) Suporte basico via webhook outbound (DWebhook ja existe) — Linear-like nao.
  - (c) Pular ate decisao de produto.
- **Status:** `pendente`
- **Decisão:** —

---

### 24. Profile picture / avatar URL

- **Onde apareceu:** `/settings/account/profile` linha "Profile picture". Linear permite upload de foto. Quando vazio, mostra iniciais (ex.: "BB").
- **Schema atual:** `DEntidade` nao tem campo `avatarUrl`, `fotoUrl` ou similar.
- **Impacto no frontend:** Avatar mostra apenas iniciais geradas a partir do nome. Sem upload.
- **Opções:**
  - (a) `DEntidade.avatarUrl String?` (migration). Upload precisa de storage (S3, Cloudinary, etc.) — feature lateral.
  - (b) Guardar em `DEntidade.dados.avatarUrl` (Json). Sem migration.
  - (c) Manter so iniciais — Linear-like minimal.
- **Status:** `pendente`
- **Decisão:** —

---

### 25. Username distinto de email

- **Onde apareceu:** `/settings/account/profile` campo "Username — One word, like a nickname or first name". Linear usa username em mentions (`@benedito`), URLs (`/u/benedito`) etc.
- **Schema atual:** `DUserGroup.login` existe (string unique), mas e usado como credencial de login (pode ser email ou nickname). Nao ha campo `username` separado em `DEntidade`.
- **Impacto no frontend:** Campo fica disabled como stub. Mentions e perfis publicos por slug nao funcionam ate decisao.
- **Opções:**
  - (a) `DEntidade.username String? @unique` (migration). Separa identidade publica de credencial.
  - (b) Reusar `DUserGroup.login` como username quando nao for email-format.
  - (c) Pular ate ter mentions / perfis publicos.
- **Status:** `pendente`
- **Decisão:** —

---

### 26. Email channel worker (confirmar com backend)

- **Onde apareceu:** `/settings/account/notifications` channel "Email · Enabled for all notifications".
- **Schema atual:** `DEntidade.email` existe ✅. Falta confirmar se ha worker SMTP/transactional email no backend que escuta `DEvento` e dispara emails.
- **Impacto no frontend:** Toggle "Email" fica disabled como stub ate confirmacao.
- **Opções:**
  - (a) Backend ja tem worker — schema atende totalmente, basta wirar UI.
  - (b) Backend nao tem — adicionar worker + provider (Resend, SES, Postmark...).
- **Status:** `pendente — confirmar com backend`
- **Decisão:** —

---

### 27. Desktop / Mobile push notifications

- **Onde apareceu:** `/settings/account/notifications` channels "Desktop · Disabled" e "Mobile · Enabled for all notifications".
- **Schema atual:** Sem registro de `pushSubscription` (web push) nem `deviceToken` (mobile) em `DEntidade`. Sem Service Worker no frontend.
- **Impacto no frontend:** Channels Desktop e Mobile ficam disabled.
- **Opções:**
  - (a) **Web push** (Desktop): Service Worker + Notification API + `DEntidade.dados.webPushSubscriptions[]`. Implementável puramente cliente; backend precisa de worker que envia push via VAPID.
  - (b) **Mobile push**: depende de ter app mobile (gap maior).
  - (c) Pular — manter so in-app (Inbox) + Email + Telegram.
- **Status:** `pendente`
- **Decisão:** —

---

### 28. Slack channel integration

- **Onde apareceu:** `/settings/account/notifications` channel "Slack · Disabled".
- **Schema atual:** Temos integracao Telegram (`/settings/channels`, `notificationsApi.configure/test`). Slack nao existe.
- **Impacto no frontend:** Channel Slack fica disabled. Substituido visualmente por Telegram na nossa realidade.
- **Opções:**
  - (a) Implementar Slack como segundo channel (OAuth + webhook). Trabalho consideravel.
  - (b) Manter so Telegram (caso de uso BR-first).
- **Status:** `pendente`
- **Decisão:** —

---

### 29. "Updates from Linear" — mailing list / newsletters

- **Onde apareceu:** `/settings/account/notifications` bloco inteiro "Updates from Linear" — Changelog (Show in sidebar / Newsletter), Marketing and onboarding, Invite accepted, Privacy and legal updates, Data processing agreement.
- **Schema atual:** Sem modelo de subscription a comunicacoes de produto. Sem time/worker de marketing comms.
- **Impacto no frontend:** Bloco inteiro fica como stub visual. So o toggle "Show updates in sidebar" pode ser persistido em localStorage (UI puro), mas sem origem de updates.
- **Opções:**
  - (a) Implementar feature SaaS de produto-comms (newsletter, in-app announcements). Projeto a parte.
  - (b) Pular indefinidamente — feature de empresa SaaS madura.
- **Status:** `descartado-por-default` (reabrir quando produto tiver time de comms)

---

### 30. Workspace logo

- **Onde apareceu:** `/settings/workspace/general` campo "Logo (256x256px)" — Linear permite upload de logo do workspace.
- **Schema atual:** `DEntidade` (idClasse=-50 = Org) nao tem campo `logoUrl` ou `avatar`.
- **Impacto no frontend:** Mostra apenas badge com iniciais da org. Sem upload aqui — frontend tem `/settings/branding` (legado) que pode ja cobrir; precisa unificar.
- **Opções:**
  - (a) `DEntidade.logoUrl String?` (migration) + storage (S3/Cloudinary).
  - (b) Reusar `/settings/branding` legacy se ja persiste logo. **Linkar a partir desta tela.**
  - (c) Manter so iniciais.
- **Status:** `pendente — verificar se /settings/branding cobre`
- **Decisão:** —

---

### 31. Workspace URL slug

- **Onde apareceu:** `/settings/workspace/general` campo "URL: linear.app/devari-tecnologia". Slug usado em URLs publicas/compartilhamento.
- **Schema atual:** `DEntidade` nao tem campo `slug`. Hoje URLs usam `chave` (BigInt).
- **Impacto no frontend:** Campo fica disabled como stub. URLs de project/issue continuam usando IDs numericos.
- **Opções:**
  - (a) `DEntidade.slug String? @unique` (migration). Slug auto-gerado a partir do nome no register, editavel depois.
  - (b) Pular — URLs com IDs sao funcionais.
- **Status:** `pendente`
- **Decisão:** —

---

### 32. Workspace locale (fiscal year + region)

- **Onde apareceu:** `/settings/workspace/general` secao "Time & region" — "First month of the fiscal year" (dropdown) e "Region" (read-only, set-on-create).
- **Schema atual:** `DEntidade` nao tem campos de locale. Backend usa America/Sao_Paulo fixo (TimezoneService).
- **Impacto no frontend:** Dropdown de fiscal year e info de region ficam stubs.
- **Opções:**
  - (a) `DEntidade.dados.fiscalYearStart` (Json, sem migration) + `dados.region`.
  - (b) Colunas dedicadas em `DEntidade` (migration).
  - (c) Pular — fixar em January / Brasil.
- **Status:** `pendente`
- **Decisão:** —

---

### 33. Welcome message (Enterprise paywall)

- **Onde apareceu:** `/settings/workspace/general` secao "Welcome message" — Linear marca como "Available on Enterprise".
- **Schema atual:** Sem campo. Sem feature de planos pagos.
- **Impacto no frontend:** Linha fica stub permanente com badge "Em breve" / "Plano superior".
- **Opções:**
  - (a) Implementar quando tivermos planos pagos.
  - (b) Pular indefinidamente — feature de produto SaaS madura.
- **Status:** `descartado-por-default`

---

### 34. Last seen / online presence

- **Onde apareceu:** `/settings/workspace/members` colunas "Last seen" (data/online) e indicador verde "Online".
- **Schema atual:** Sem `lastSeenAt` em `DUserGroup` / `DEntidade`. Sem mecanismo de presence (websocket/heartbeat).
- **Impacto no frontend:** Coluna fica "—". Sem dot verde de online.
- **Opções:**
  - (a) `DUserGroup.lastLoginAt` (atualizado em cada login/refresh) + heartbeat client-side (SWR window-focus). Simples, sem WS.
  - (b) Sistema de presence completo via WebSocket (Pusher/Ably/Socket.io). Mais caro.
  - (c) Pular.
- **Status:** `pendente`
- **Decisão:** —

---

### 35. Application/bot members

- **Onde apareceu:** `/settings/workspace/members` grupo "Application 1" — Linear distingue humanos de integrações (bots, OAuth apps).
- **Schema atual:** `DEntidade` nao tem flag para distinguir humano de aplicacao. `DAgent` existe mas e outro modelo.
- **Impacto no frontend:** Sem grupo "Application" — todos viram "Active".
- **Opções:**
  - (a) `DEntidade.isApplication Boolean @default(false)` (migration). Permite filtrar.
  - (b) Reusar `DEntidade.idClasse` com nova `DClasse -XX APPLICATION_USER`. Polimorfismo Devari.
  - (c) Pular — nao temos OAuth apps por agora.
- **Status:** `pendente`
- **Decisão:** —

---

### 36. Email-based invite flow

- **Onde apareceu:** `/settings/workspace/members` botao "Invite" — Linear envia email com link "Join workspace". Usuario aceita e define propria senha.
- **Schema atual:** `addUser` (POST /organizations/:id/users) exige `name`, `email`, `password` no proprio request. Admin **cria** a conta com senha definida por ele — nao e invite-flow tradicional.
- **Impacto no frontend:** Botao "Invite" abre dialog com **name + email + password + role**. Mais "Add member" do que "Invite". Sem aceitacao por email.
- **Opções:**
  - (a) Migrar para invite-flow real: tabela `DInvite` (token, expiresAt, idOrg, role) + endpoint `POST /invites` + email. Usuario clica link, define senha, vira member.
  - (b) Manter admin-creates-with-password (atual).
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
