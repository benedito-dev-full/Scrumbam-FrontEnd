# PLANO DETALHADO — VPS & Project Config via Frontend (Task 2026-05-13)

**Criado por:** Strategist Agent V2
**Data:** 2026-05-13
**Módulos:** `automation` (backend) + `agent` (cliente VPS) + `frontend (vps, projects)` (Next.js)
**Fase V2:** F13 (Automation Claude Code — hardening pós-Task #1 de produção)
**ADRs vinculados:** ADR-V2-001 (zero tabela nova), ADR-V2-005 (Engine), ADR-V2-030 (sem `cwd`/path absoluto), ADR-V2-033 (HMAC outbound + inbound), ADR-V2-035 (`projectSlug` via CLAUDE.md global), ADR-V2-036 (monorepo `agent/`), ADR-V2-040 (heartbeat + tunnel estável).
**ADRs a redigir:** ADR-V2-041 (Env Management via API outbound HMAC), ADR-V2-042 (Deploy Key Automation pull-only — privada nunca sai da VPS).
**Estimativa Total:** 18h efetivas (vs 16h propostas pelo CEO — ajuste +2h justificado abaixo).
**Complexidade:** Alta (toca 3 superfícies — backend NestJS, agent Node/TS, frontend Next.js — com novo contrato HMAC, sudoers, refactor de duas telas e quebra de campo `remotePath`).

---

## 1. Análise

### Contexto

A VPS argus (`agentId=32`) está em produção com tunnel SSH estável, HMAC bilateral e heartbeat verde. O próximo passo operacional é eliminar SSH manual no fluxo do CEO/operador: hoje, configurar `ANTHROPIC_API_KEY`, gerar deploy key SSH ou ajustar git bot exige `ssh dinpayz` + edição de arquivos `/etc/scrumban-agent/environment`. Isso quebra a promessa de zero-friction.

O CEO já decidiu (transcrito no prompt):

1. **Reorganização das telas.** `/vps/:id` recebe configs genéricas da VPS (PAT GitHub, ANTHROPIC_API_KEY, bot Git, lista de projetos vinculados). `/projects/:id/automation` fica com configs específicas do projeto (slug, repoUrl, branch, timeout, deploy key per-repo).
2. **Credenciais via API.** Frontend escreve PAT, ANTHROPIC_API_KEY, bot Git via backend → backend repassa via HMAC outbound → agent escreve em `/etc/scrumban-agent/environment` e dá `systemctl restart self`. Backend **não persiste plaintext** — só `envStatus` (booleanos) em `DEntidade -156 dados.envStatus`.
3. **Deploy Key automatizada.** Frontend dispara `git-setup`, agent gera `ssh-keygen` localmente, retorna apenas a pubkey + fingerprint. Privada nunca sai da VPS. Pubkey persistida em `DVincula -185 metaDados.deployKeyPub`.
4. **PR automático futuro (FORA DE ESCOPO desta task).** O design das credenciais GitHub aqui precisa habilitar `git push` + abertura de PR via GitHub API no fim do `RUN_CLAUDE_CODE` numa task seguinte. Isso significa: o PAT que escrevemos no env file precisa ter scope `repo` (PR write); o deploy key gerado precisa ser ed25519 com write access; ambos consumidos no backend depois (via `GithubPrService` já existente).
5. **Bot Git per-VPS.** `~/.gitconfig` do user `scrumban-agent` configurado uma vez no install. install.sh ganha passo de gitconfig placeholder. Override editável em `/vps/:id`.

### Estado Atual

**Backend V2 (Scrumban-Backend-V2):**
- `src/automation/agents/agents.controller.ts` — endpoints `/agents` (listar), `/agents/install-token`, `/agents/install`, `/agents/:id/heartbeat`, `/agents/:id/execution-result`, `/agents/:id/projects` (link/unlink/list). HMAC inbound via `AgentAuthGuard`.
- `src/automation/project-agent/project-agent.controller.ts` — `POST /projects/:id/agent` (link), `DELETE /projects/:id/agent/:agentId`, `GET /projects/:id/agent/status`. **Não tem hoje endpoint para deploy-key/git-creds nem env vars** — o frontend chama `useGenerateGitCredentials` que aponta para algo ainda não materializado no V2.
- `src/automation/runtime/remote-execution-client.ts` — cliente outbound HMAC pronto, hoje só para `POST /v1/execute` no agent. Reusável trocando `path` e payload.
- `src/automation/constants/automation-class-ids.ts` — DClasses já fixadas: AGENT=-156, PROJECT_AGENT=-185, EXEC_LOW/MED/HIGH=-301/-302/-303.

**Agent V2 (`agent/`):**
- `agent/src/server/http.server.ts` — express 127.0.0.1, body parser preservando `rawBody`, HMAC middleware, rate limit, dispatcher.
- `agent/src/server/dispatcher.ts` — discriminator `type` no body de `POST /v1/execute`. Hoje aceita `PING` + `RUN_CLAUDE_CODE`. **Decisão arquitetural existente:** a porta `/v1/execute` é o pipe único, novos comandos plugam aqui adicionando handlers (ADR-V2-037 deixou explícito).
- `agent/src/server/hmac.middleware.ts` — HMAC validado byte-a-byte equivalente ao backend.
- `agent/install.sh` — já cria `/etc/scrumban-agent/environment` placeholder 0600 owner=`scrumban-agent`. **Não tem sudoers entry** hoje (o user `scrumban-agent` não pode rodar `systemctl restart`).
- `agent/src/config/schema.ts` — config validada por zod; `agentCommandSecret` em texto plano no arquivo 0600.

**Frontend (Scrumbam-FrontEnd):**
- `src/app/(app)/vps/[id]/page.tsx` — mostra info, regen token, danger zone. **Mínima** — sem nada de credencial.
- `src/app/(app)/projects/[id]/automation/page.tsx` — composto de 7 sub-componentes: AgentStatusCard, ClaudeCredentialCard, AgentLinkForm (8 campos incluindo `remotePath`, gitBotEmail/Name, repoUrl, branch, timeout), GitCredentialsPanel (deploy key — hoje placeholder com hooks `useGenerateGitCredentials`/`useRevokeGitCredentials`/`useApplyGitConfig` cujo backend não existe no V2), ApprovalQueuePanel, ExecuteIntentionPanel, ExecutionHistory.
- `ClaudeCredentialCard` hoje mostra um snippet `claude setup-token` para o operador rodar **manualmente** via SSH — exatamente o que a task quer eliminar.

**Gap crítico:** os hooks `useGenerateGitCredentials`, `useApplyGitConfig`, `useClaudeTokenInstructions` no frontend apontam para endpoints que **não existem no backend V2 de produção** (foram materializados num plano anterior que não foi implementado). Esta task vai materializá-los — mas redesenhados conforme a decisão do CEO.

### Decisões Passadas Relevantes (ADRs V2)

- **ADR-V2-001 (zero tabela nova):** envStatus, gitBot, deploy key — tudo em `dados`/`metaDados` JSON. Não cria coluna nova, não cria tabela. Hook `enforce-canonical-tables.sh` bloqueia.
- **ADR-V2-030 (sem cwd no payload):** backend nunca envia path absoluto. Por isso o `remotePath` da AgentLinkForm é **removido**. O agent resolve o projeto via `projectSlug` lendo `~/.claude/CLAUDE.md`. A "caixinha read-only com a linha pra colar no CLAUDE.md global" descrita pelo CEO é coerente com essa ADR — o frontend mostra `- <slug>: /home/dev/projetos/<slug>` para o operador colar, mas o backend nunca toca esse mapeamento.
- **ADR-V2-033 (HMAC bilateral):** reuso direto. Backend assina `POST http://127.0.0.1:<tunnelPort>/v1/execute` com `type: SET_ENV` ou `type: GENERATE_DEPLOY_KEY` — mesmo middleware do agent valida, mesmo `RemoteExecutionClient` no backend assina.
- **ADR-V2-035 (`projectSlug` via CLAUDE.md):** o backend persiste `projectSlug` em `DVincula -185 metaDados.projectSlug`. O agent **não recebe** o path absoluto. Isso significa que a Deploy Key gerada no agent fica num caminho que **o backend não conhece** — só o slug. Suficiente: o `core.sshCommand` no `.gitconfig` per-slug aponta para essa chave, e o `claude -p` herda o env do agent.
- **ADR-V2-036 (monorepo agent/):** mudança de protocolo (`/v1/execute` ganhando novos `type`s) deve sair em PR único backend + agent. Esta task respeita.
- **ADR-V2-040 (heartbeat verde, tunnel estável):** condição **pré-requisito** desta task. Argus está verde. Plan de rollback assume que se algo dessa task quebrar, argus continua heartbeat-only operacional.

---

## 2. Abordagem Escolhida

### Solução

**Estender o pipe único `POST /v1/execute` no agent com 2 novos `type`s** (`SET_ENV` e `GENERATE_DEPLOY_KEY`), validados pela mesma cadeia HMAC + rate limit + dispatcher. Mesma porta, mesmo tunnel, mesmo secret. **Nenhum endpoint HTTP novo** no agent — só novos handlers no dispatcher.

**Adicionar 4 endpoints HTTP novos no backend**, todos autenticados via `JwtAuthGuard` + autorização via `RoleResolverService`:

1. `PUT /agents/:id/env` — escreve PAT/ANTHROPIC_KEY/etc. via HMAC outbound → agent. Backend valida que o caller é ADMIN da org dona da VPS (ou owner) e nunca persiste plaintext. Resposta: 204 + atualização de `envStatus` (booleanos) em `DEntidade -156 dados.envStatus`.
2. `GET /agents/:id/env-status` — lê apenas `dados.envStatus` (`{hasGithubToken, hasAnthropicKey, lastEnvUpdatedAt}`). Sem chamada outbound. Permissão: membro da org.
3. `PUT /agents/:id/git-bot` — atualiza `gitBotName`/`gitBotEmail` em `DEntidade -156 dados`. Dispara `SET_ENV` outbound para o agent reescrever `~scrumban-agent/.gitconfig`. ADMIN-only.
4. `POST /projects/:id/agent/:agentId/deploy-key` — dispara `GENERATE_DEPLOY_KEY` outbound; recebe `{publicKey, fingerprint}`; persiste em `DVincula -185 metaDados.deployKeyPub/deployKeyFingerprint/lastDeployKeyGeneratedAt`. Resposta: pubkey + fingerprint + instructions (texto markdown para o frontend renderizar). MANAGER do projeto ou ADMIN da org.
5. (Bônus, mesmo PR) `GET /projects/:id/agent/:agentId/deploy-key` — lê `metaDados.deployKeyPub` sem outbound.

**No agent**, 2 handlers novos no dispatcher:

- `SET_ENV` — recebe `{ vars: Record<string,string>, restartAfter: boolean }`. Valida que cada chave está numa allowlist (`GITHUB_TOKEN`, `ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN`, `GIT_BOT_NAME`, `GIT_BOT_EMAIL`). Reescreve `/etc/scrumban-agent/environment` (write-temp + rename atômico, 0600 owner=`scrumban-agent`). Se `restartAfter=true`, chama `sudo /bin/systemctl restart scrumban-agent` (sudoers entry com escopo mínimo configurado pelo install.sh). Retorna ACK síncrono **antes** do restart (caso contrário o request nunca completa — o processo morre). O backend marca `envStatus.lastEnvUpdatedAt` no callback de heartbeat seguinte (ou via timeout 5s assume sucesso).
- `GENERATE_DEPLOY_KEY` — recebe `{ projectSlug: string, comment?: string }`. Gera `ssh-keygen -t ed25519 -f /etc/scrumban-agent/ssh-keys/<slug> -N ''` se não existir (idempotente — se já existe, lê e retorna). Permissões 0600 priv, 0644 pub. Retorna `{publicKey: string, fingerprint: string, sshConfigSnippet: string}`. **Nunca retorna privada.** Como bônus, atualiza `~scrumban-agent/.config/git/<slug>/config` com `[core] sshCommand = "ssh -i /etc/scrumban-agent/ssh-keys/<slug> -o IdentitiesOnly=yes"` + `[user] name/email` herdados do gitconfig global.

### Justificativa

**Por que pipe único `/v1/execute` com discriminator (e não rotas novas no agent)?**
- ADR-V2-037 já formalizou essa decisão. Toda a infra de HMAC, nonce store, rate limit, dispatcher está pronta. Adicionar `LIST_CLAUDE_SESSIONS`, `READ_CLAUDE_SESSION`, etc. já estava previsto.
- Custo de adicionar `type` novo: ~30 linhas no dispatcher + handler isolado. Custo de criar rota nova: middleware HMAC duplicado, mais surface area, mais lugares pra esquecer rate limit.
- Reuso integral do `RemoteExecutionClient` no backend trocando só o body.

**Por que backend não persiste plaintext do PAT/ANTHROPIC_KEY?**
- Defesa em profundidade. Se o DB for comprometido, ninguém recupera as credenciais. Só o env file 0600 da VPS tem.
- Audit trail via `envStatus` (booleano + timestamp) é suficiente para a UI mostrar "Configurado em DD/MM/AAAA".
- Trade-off: se o operador esquecer qual PAT escreveu, tem que regenerar do GitHub. **Aceitável** (decisão CEO explícita).

**Por que deploy key per-projectSlug (não per-agent)?**
- A mesma VPS pode estar vinculada a N projetos (ADR-V2-036 + endpoints `/agents/:id/projects` recém-criados). Cada projeto pode apontar pra repo diferente no GitHub.
- Deploy keys do GitHub são per-repo (não per-org). Logo, **per-projectSlug** é a granularidade correta.
- Persiste em `DVincula -185 metaDados.deployKeyPub` (que é o link project↔agent) — não em `DEntidade -156` (que é o agent).

**Por que sudoers entry com escopo mínimo (não NOPASSWD ALL)?**
- Defesa contra escalação local. Se o processo Node do agent for comprometido (ex: prompt injection no Claude levando a command injection), o blast radius fica em `restart scrumban-agent` — não em root shell.
- Padrão: `scrumban-agent ALL=(root) NOPASSWD: /bin/systemctl restart scrumban-agent` — uma linha exata, sem wildcards.

### Alternativas Consideradas

**Alt A: Endpoint HTTP separado no agent (`POST /v1/env`, `POST /v1/git-setup`).**
- Prós: roteamento mais explícito, OpenAPI mais "REST puro".
- Contras: duplica middleware HMAC + rate limit + nonce; viola padrão estabelecido em ADR-V2-037; quebra a regra de "uma porta, uma assinatura, um discriminator".
- **REJEITADA.**

**Alt B: Persistir plaintext do PAT/ANTHROPIC_KEY no DB (cifrado AES-256-GCM).**
- Prós: operador pode reconfigurar agent novo sem reentrar credenciais.
- Contras: nova superfície de ataque (gestão de chave de cifração — `AES_KEY_ENV` rotation, backup, key escrow). DB comprometido → credenciais comprometidas. Aumenta complexidade de compliance (LGPD — armazenamento de credenciais de terceiros).
- **REJEITADA.** Decisão CEO explícita: "Backend NÃO armazena PAT/API key em plaintext (zero persistência)."

**Alt C: Frontend escreve direto no agent (CORS aberto no agent + JWT do user repassado).**
- Prós: elimina hop backend.
- Contras: expõe agent para o public web; HMAC bilateral perde sentido; CSRF em massa. Quebra ADR-V2-033 (HMAC com secret só conhecido por backend+agent).
- **REJEITADA imediatamente.**

**Alt D: Autorização via owner-da-VPS (não ADMIN da org).**
- Prós: granularidade mais fina; criador da VPS controla.
- Contras: noção de "owner" ainda não existe no schema do agent (`DEntidade -156` tem `idEstab` mas não `criadoPor`). Adicionar require mudança no install + handshake.
- **DECISÃO HÍBRIDA:** usar **ADMIN da org dona** (idEstab→organização) como autorização primária, **+ MANAGER do projeto** quando a operação é per-projeto (deploy key). Coerente com `ProjectAgentLinkService.requireProjectManagerOrOrgAdmin` já existente.

**Alt E (deploy key): Backend gera chave e envia privada via HMAC, agent só persiste.**
- Prós: backend tem mais controle, pode rotacionar chave centralmente.
- Contras: privada trafega na rede (mesmo sob HMAC + tunnel SSH, é desnecessário); backend tem que persistir privada (ou se autodestruir após enviar — operacionalmente frágil); viola princípio "privada nunca sai da VPS".
- **REJEITADA.** Decisão CEO: pull-only, agent gera localmente.

---

## 3. Avaliação dos 3 Pilares

### Pilar 1: Engine/Operação

**N/A para esta task.** Nenhuma operação toca `DPedido` (execução). Tudo é cadastro estrutural (`DEntidade -156`, `DVincula -185`) — **Service + Prisma direto em transação atômica**, sem Engine.

Justificativa: persistir `envStatus`, `gitBotName/Email`, `deployKeyPub` em campos JSON `dados`/`metaDados` é update simples de 1 tabela. Engine seria overhead injustificado. Coerente com `devari-3-pilares.md` §"Quando NÃO usar Engine".

A próxima task (PR automático no fim do `RUN_CLAUDE_CODE`) **vai** tocar Engine (`OperacaoExecucaoClaude.registrarOutcome`) — mas é **fora de escopo desta task**.

### Pilar 2: Endpoints Genéricos

**Não aplicável reuso de `/entidades` ou `/tabelas` aqui.** Os 4 endpoints novos têm lógica de negócio significativa (validar role, disparar HMAC outbound, parsing de resposta do agent, atualização atômica do JSON `dados`). Coerente com a regra: "lógica de Engine? cálculos? Risk Gate? automação? → controller próprio justificado".

**Reuso interno:**
- `RemoteExecutionClient` (já existe) — reutilizado para os dois novos `type`s.
- `RoleResolverService` (já existe) — reusado para autorização.
- `AgentSecurityService` (já existe) — reusado para validar agent + decifrar `agentCommandSecret`.

**Convenção de query:** N/A (são endpoints REST com path params, não listagem polimórfica).

### Pilar 3: Seed de Classes

**Nenhuma DClasse nova necessária.** Tudo cabe em DClasses já existentes:
- `AGENT = -156` — agente da VPS.
- `PROJECT_AGENT = -185` — vínculo project↔agent.

**Mudança em `dados`/`metaDados` JSON (não é schema migration, não é seed):**

`DEntidade -156 dados`:
```jsonc
{
  // campos existentes (lastSeen, hostname, agentVersion, etc.)
  "gitBotName": "Scrumban Bot",         // novo, opcional
  "gitBotEmail": "bot@scrumban.app",    // novo, opcional
  "envStatus": {                        // novo, opcional
    "hasGithubToken": true,
    "hasAnthropicKey": true,
    "lastEnvUpdatedAt": "2026-05-13T18:42:00Z"
  }
}
```

`DVincula -185 metaDados`:
```jsonc
{
  // campos existentes
  "projectSlug": "dinpayz-backend",     // novo, required (gerado por backend)
  "repoUrl": "git@github.com:org/repo.git",  // novo, opcional
  "defaultBranch": "main",              // novo, opcional, default 'main'
  "timeoutSec": 1800,                   // novo, opcional, default 1800
  "deployKeyPub": "ssh-ed25519 AAAA... comment",  // novo, opcional
  "deployKeyFingerprint": "SHA256:...", // novo, opcional
  "lastDeployKeyGeneratedAt": "2026-05-13T18:50:00Z" // novo, opcional
}
```

**Genericidade (template vs V2-específico):** Aplicável ao template Devari-Core? **Não diretamente** — o módulo `automation` é V2-específico (F13). Mas o padrão "frontend escreve env via API → backend dispara comando HMAC → daemon remoto reescreve env file" é **reaproveitável** para qualquer projeto Devari-Core que tenha agent remoto. **Documentar como contribuição futura** em ADR-V2-041.

---

## 4. Estrutura Técnica

### Arquivos a Criar

**Backend (`src/automation/`):**
- `agents/agent-env.controller.ts` — `PUT /agents/:id/env`, `GET /agents/:id/env-status`, `PUT /agents/:id/git-bot`. Importa AgentEnvService.
- `agents/agent-env.service.ts` — orquestra autorização, monta payload `SET_ENV`, chama RemoteExecutionClient, persiste `envStatus`.
- `agents/dto/set-agent-env.dto.ts` — `{ githubToken?, anthropicApiKey?, anthropicAuthToken? }` (todos opcionais — só os preenchidos são enviados). class-validator: `@IsOptional() @IsString() @Length(min,max)` por campo.
- `agents/dto/env-status-response.dto.ts` — `{ hasGithubToken, hasAnthropicKey, lastEnvUpdatedAt }`.
- `agents/dto/set-git-bot.dto.ts` — `{ name: string, email: string }`.
- `project-agent/deploy-key.controller.ts` — `POST /projects/:id/agent/:agentId/deploy-key`, `GET /projects/:id/agent/:agentId/deploy-key`.
- `project-agent/deploy-key.service.ts` — orquestra autorização (MANAGER+ADMIN), monta `GENERATE_DEPLOY_KEY`, chama RemoteExecutionClient, persiste em `DVincula -185 metaDados`.
- `project-agent/dto/deploy-key-response.dto.ts` — `{ publicKey, fingerprint, sshConfigSnippet, instructions: string[], generatedAt }`.

**Agent (`agent/src/`):**
- `handlers/set-env.handler.ts` — recebe `vars` + `restartAfter`, valida allowlist de chaves, reescreve `/etc/scrumban-agent/environment` atomicamente (write `/tmp/agent-env.XXXX` → `fs.rename`), retorna ACK, agenda `setImmediate(() => exec('sudo systemctl restart …'))` se `restartAfter`.
- `handlers/generate-deploy-key.handler.ts` — recebe `projectSlug` + opcional `comment`, valida slug (regex `^[a-z0-9-]+$`, max 64 chars), executa `ssh-keygen -t ed25519 -f /etc/scrumban-agent/ssh-keys/<slug> -N '' -C "<comment>"` se ausente; lê pubkey + computa fingerprint via `ssh-keygen -lf`; retorna.
- `env/env-file-writer.ts` — escrita atômica + permissões 0600. Service isolado para testar.
- `git/git-config-writer.ts` — escreve `~scrumban-agent/.config/git/<slug>/config` para `core.sshCommand`/`user.name`/`user.email`.

**Frontend (`src/`):**
- `app/(app)/vps/[id]/_components/env-credentials-panel.tsx` — PAT GitHub + ANTHROPIC_API_KEY + ANTHROPIC_AUTH_TOKEN. Inputs `type="password"`, botão "olho", após salvar mostra só "Configurado em X". Botão "Salvar credenciais".
- `app/(app)/vps/[id]/_components/git-bot-panel.tsx` — nome + email do bot Git. Mostra valores atuais. Editável.
- `app/(app)/vps/[id]/_components/linked-projects-panel.tsx` — lista projetos vinculados (reusa endpoint `/agents/:id/projects`).
- `app/(app)/projects/[id]/automation/_components/deploy-key-panel.tsx` — substitui o `GitCredentialsPanel` atual. Gera/regenera/revoga deploy key per-projeto, mostra pubkey + fingerprint + instruções GitHub.
- `app/(app)/projects/[id]/automation/_components/project-slug-card.tsx` — mostra `projectSlug` gerado + caixinha read-only com `- <slug>: /home/dev/projetos/<slug>` para colar no CLAUDE.md global.
- `lib/api/agent-env.ts` — funções `getEnvStatus(agentId)`, `setAgentEnv(agentId, dto)`, `setGitBot(agentId, dto)`.
- `lib/api/deploy-key.ts` — `generateDeployKey(projectId, agentId)`, `getDeployKey(projectId, agentId)`, `revokeDeployKey(projectId, agentId)`.
- `lib/hooks/use-agent-env.ts`, `lib/hooks/use-deploy-key.ts` — React Query wrappers.

### Arquivos a Modificar

**Backend:**
- `src/automation/automation.module.ts` — registrar AgentEnvController/Service, DeployKeyController/Service.
- `src/automation/runtime/remote-execution-client.ts` — generalizar `execute()` para aceitar payload arbitrário (ou criar método paralelo `dispatch(payload, type)`). Mantém `execute()` legado para `RUN_CLAUDE_CODE` sem quebrar callers.
- `src/automation/project-agent/project-agent-link.service.ts` — adicionar `projectSlug` ao payload de criação do link (gerar a partir de `project.nome` se não vier no DTO).
- `src/automation/project-agent/dto/link-agent.dto.ts` — adicionar `projectSlug` opcional (auto se vazio).

**Agent:**
- `agent/src/server/dispatcher.ts` — adicionar `SET_ENV` e `GENERATE_DEPLOY_KEY` ao `SUPPORTED_TYPES`; rotear para handlers novos.
- `agent/install.sh` — passo 9c novo (sudoers): cria `/etc/sudoers.d/scrumban-agent` com `scrumban-agent ALL=(root) NOPASSWD: /bin/systemctl restart scrumban-agent`, `chmod 0440`, `visudo -c` para validar. Idempotente. Passo 9d novo (gitconfig placeholder): `~scrumban-agent/.gitconfig` com `user.name=Scrumban Bot` / `user.email=bot@scrumban.app` se ausente.
- `agent/systemd/scrumban-agent.service` — verificar que `ReadWritePaths` permite `/etc/scrumban-agent/ssh-keys/` e `/home/scrumban-agent/.config/git/` (se sandbox systemd habilitado).
- `agent/uninstall.sh` — remover sudoers entry.

**Frontend:**
- `src/app/(app)/vps/[id]/page.tsx` — adicionar 3 novos painéis (EnvCredentialsPanel, GitBotPanel, LinkedProjectsPanel) abaixo do InfoCard.
- `src/app/(app)/projects/[id]/automation/page.tsx` — remover ClaudeCredentialCard (foi pra `/vps`); remover GitCredentialsPanel antigo; adicionar DeployKeyPanel novo + ProjectSlugCard. Atualizar AgentLinkForm (próximo bullet).
- `src/app/(app)/projects/[id]/automation/_components/agent-link-form.tsx` — **remover** campo `remotePath`; **remover** gitBotEmail/gitBotName (movidos pra `/vps`); **adicionar** campo `projectSlug` (auto-gerado a partir de `project.nome`, editável); manter repoUrl, branch, timeout.
- `src/lib/api/automation.ts` — ajustar `LinkAgentInput` para drop `remotePath`/`gitBotEmail`/`gitBotName`, adicionar `projectSlug`.

### Endpoints REST (backend) com query params

| Método | Path | Autorização | Body / Query |
|--------|------|-------------|--------------|
| `PUT` | `/agents/:id/env` | JWT + ADMIN da org dona | `{ githubToken?, anthropicApiKey?, anthropicAuthToken? }` — só campos a atualizar |
| `GET` | `/agents/:id/env-status` | JWT + membro da org | — |
| `PUT` | `/agents/:id/git-bot` | JWT + ADMIN da org dona | `{ name, email }` |
| `POST` | `/projects/:id/agent/:agentId/deploy-key` | JWT + MANAGER projeto OU ADMIN org | `{ comment? }` (default: `scrumban-agent@<slug>`) |
| `GET` | `/projects/:id/agent/:agentId/deploy-key` | JWT + membro projeto | — |
| `DELETE` | `/projects/:id/agent/:agentId/deploy-key` | JWT + MANAGER projeto OU ADMIN org | — (apaga `metaDados.deployKeyPub/Fingerprint/lastDeployKeyGeneratedAt`; agent **não** apaga arquivo automaticamente — manual cleanup futuro) |

### Queries Prisma (exemplos chave)

```ts
// Atualizar envStatus após SET_ENV bem-sucedido (transação atômica)
await this.prisma.dEntidade.update({
  where: { chave: BigInt(agentId) },
  data: {
    dados: {
      // merge — Prisma JSON update via raw or jsonb_set
      // melhor: ler, merge no JS, gravar
      ...(existing.dados as object),
      envStatus: {
        hasGithubToken: dto.githubToken !== undefined ? true : prev.hasGithubToken,
        hasAnthropicKey: (dto.anthropicApiKey || dto.anthropicAuthToken) ? true : prev.hasAnthropicKey,
        lastEnvUpdatedAt: new Date().toISOString(),
      },
    },
  },
});

// Persistir deploy key em DVincula -185
await this.prisma.dVincula.update({
  where: { chave: link.chave },
  data: {
    metaDados: {
      ...(link.metaDados as object),
      deployKeyPub: agentResponse.publicKey,
      deployKeyFingerprint: agentResponse.fingerprint,
      lastDeployKeyGeneratedAt: new Date().toISOString(),
    },
  },
});
```

ZERO N+1: lê link (1 query), faz update (1 query). Total: 2.

### Eventos Emitidos (DEvento idClasse=-49X)

**Decisão:** emitir audit trail leve via `DEvento idClasse=-496` (EXECUTION_LOG_EVENT, já existente — reuso semântico) **OU** criar `AGENT_CONFIG_EVENT = -497` se preferir separação. **Recomendo reuso de -496** para evitar criar DClasse nova (Pilar 3 — minimizar).

Eventos emitidos:
- `agent.env.updated` — quando `SET_ENV` completa (idEntidade=agent, dados={ vars: ['GITHUB_TOKEN','ANTHROPIC_API_KEY'], userId, restartIssued })
- `agent.gitbot.updated` — quando `/git-bot` completa
- `project.deploy-key.generated` — quando `GENERATE_DEPLOY_KEY` completa (idEntidade=project, dados={ agentId, fingerprint, projectSlug })
- `project.deploy-key.revoked` — quando DELETE acontece

Todos emitidos **após** persistência bem-sucedida. Nunca antes (regra `devari-backend-patterns.md` §7).

### Contrato HMAC dos novos `type`s (agent /v1/execute)

```jsonc
// SET_ENV — backend → agent
{
  "type": "SET_ENV",
  "vars": {
    "GITHUB_TOKEN": "ghp_...",       // opcional
    "ANTHROPIC_API_KEY": "sk-ant-..."// opcional
  },
  "restartAfter": true,
  "metadata": { "correlationId": "...", "issuedAt": "ISO8601" }
}

// SET_ENV ACK — agent → backend (síncrono)
{ "accepted": true, "varsWritten": ["GITHUB_TOKEN","ANTHROPIC_API_KEY"], "restartScheduled": true }

// GENERATE_DEPLOY_KEY — backend → agent
{
  "type": "GENERATE_DEPLOY_KEY",
  "projectSlug": "dinpayz-backend",
  "comment": "scrumban-agent@dinpayz-backend",
  "metadata": { ... }
}

// GENERATE_DEPLOY_KEY ACK — agent → backend (síncrono — chave já está pronta)
{
  "accepted": true,
  "publicKey": "ssh-ed25519 AAAA... scrumban-agent@dinpayz-backend",
  "fingerprint": "SHA256:abcd...",
  "alreadyExisted": false  // true se idempotente
}
```

Tamanho: bem abaixo do limit `1mb` do agent (`http.server.ts:36`).

---

## 5. Plano de Implementação

### Fase 1: ADRs + DTOs (1.5h)

1.1 — Redigir rascunhos de ADR-V2-041 (Env Management via API outbound HMAC) e ADR-V2-042 (Deploy Key Automation pull-only). Status: Proposto. Documenter formaliza depois.
1.2 — Criar todos os DTOs (backend + agent + frontend types). class-validator + Swagger decorators completos (seguir `devari-jsdoc-templates.md` Template 3).
1.3 — Atualizar `LinkAgentInput` no frontend (drop `remotePath`/gitBot, add `projectSlug`).

### Fase 2: Agent — handlers SET_ENV + GENERATE_DEPLOY_KEY (4h)

2.1 — `env/env-file-writer.ts` + spec: write atômico, 0600, owner=`scrumban-agent`. Idempotente. Allowlist de chaves (`GITHUB_TOKEN`, `ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN`, `GIT_BOT_NAME`, `GIT_BOT_EMAIL`). (1h)
2.2 — `git/git-config-writer.ts` + spec: escreve `~scrumban-agent/.config/git/<slug>/config` com `core.sshCommand`, `user.name`, `user.email`. (0.5h)
2.3 — `handlers/set-env.handler.ts` + spec integration: parse body, valida vars, escreve, ACK, agenda restart via `setImmediate`. (1h)
2.4 — `handlers/generate-deploy-key.handler.ts` + spec integration: ssh-keygen (mock em CI), leitura, fingerprint via `ssh-keygen -lf`, retorna. (1h)
2.5 — `server/dispatcher.ts`: adicionar 2 novos `type`s ao `SUPPORTED_TYPES`, rotear. Atualizar spec do dispatcher. (0.5h)

### Fase 3: Agent — install.sh sudoers + gitconfig (1.5h)

3.1 — Passo 9c: criar `/etc/sudoers.d/scrumban-agent` com escopo mínimo. Idempotente. Validar com `visudo -c`. Adicionar ao `uninstall.sh`. (0.75h)
3.2 — Passo 9d: criar `~scrumban-agent/.gitconfig` placeholder se ausente (`user.name=Scrumban Bot`, `user.email=bot@scrumban.app`, `core.editor=true`). Idempotente. (0.25h)
3.3 — Passo 9e: criar `/etc/scrumban-agent/ssh-keys/` (dir 0700 owner=`scrumban-agent`). (0.25h)
3.4 — Smoke: rodar `install.sh --dry-run` no Mac, verificar saída. Atualizar `agent/README.md`. (0.25h)

### Fase 4: Backend — endpoints + services (5h)

4.1 — `RemoteExecutionClient.dispatch<TReq, TRes>(payload, type, agent): Promise<TRes>` — generalização. Manter `execute()` legado intacto chamando `dispatch` internamente. + spec unit. (1h)
4.2 — `AgentEnvController` + `AgentEnvService` + specs (unit Service + e2e Controller com `RemoteExecutionClient` mockado). (1.5h)
4.3 — `DeployKeyController` + `DeployKeyService` + specs idem. (1.5h)
4.4 — `automation.module.ts` wiring + smoke local. Registrar em `app.module.ts` se necessário. (0.5h)
4.5 — Atualizar `ProjectAgentLinkService.linkAgent()` para gerar/salvar `projectSlug` em `metaDados`. Gerar a partir de `project.nome` via `slugify` (lowercase, hyphens, max 64 chars, regex `^[a-z0-9-]+$`). (0.5h)

### Fase 5: Frontend — refactor `/vps/:id` (2.5h)

5.1 — `EnvCredentialsPanel`: 3 inputs (PAT, ANTHROPIC_API_KEY, ANTHROPIC_AUTH_TOKEN) `type="password"` + olho; após salvar, esvazia inputs e mostra "Configurado em DD/MM/AAAA HH:mm". Botão "Salvar credenciais" disabled se nenhum campo preenchido. Toast de sucesso + invalidate `envStatus`. (1h)
5.2 — `GitBotPanel`: 2 inputs (name, email) + botão "Atualizar". Mostra valores atuais. (0.5h)
5.3 — `LinkedProjectsPanel`: lista projetos vinculados (reusa `GET /agents/:id/projects`). Link para cada `/projects/:id/automation`. (0.5h)
5.4 — Integrar tudo em `vps/[id]/page.tsx` mantendo o layout existente (cards empilhados no main). (0.5h)

### Fase 6: Frontend — refactor `/projects/:id/automation` (2.5h)

6.1 — `AgentLinkForm`: **remover** `remotePath`, `gitBotEmail`, `gitBotName`. **Adicionar** `projectSlug` (auto-derivado de `project.nome`, editável, regex validator). Keep: dropdown VPS, repoUrl, branch, timeout. (1h)
6.2 — `ProjectSlugCard` (novo): mostra slug atual + caixinha read-only `- <slug>: /home/dev/projetos/<slug>` com botão "Copiar". Mensagem: "Cole isso em `~/.claude/CLAUDE.md` na VPS para que o agent saiba onde achar o projeto." (0.5h)
6.3 — `DeployKeyPanel` (substitui `GitCredentialsPanel`): botão "Gerar deploy key" → mostra pubkey + fingerprint + instructions (markdown renderizado). Botão "Regenerar" (warning). Botão "Revogar" (confirmação). Hook `useDeployKey`. (1h)
6.4 — Remover `ClaudeCredentialCard` da página (foi pra `/vps`). (0.25h)
6.5 — Remover hooks `useGenerateGitCredentials`/`useRevokeGitCredentials`/`useApplyGitConfig`/`useClaudeCredentialStatus`/`useClaudeTokenInstructions` (não usados mais). Substituir por `useDeployKey`/`useAgentEnv`. (0.25h)

### Fase 7: Specs adicionais + smoke (1h)

7.1 — Spec backend integration: cadeia completa "frontend → PUT /agents/:id/env → mock RemoteExecutionClient.dispatch chamado com type=SET_ENV → envStatus atualizado". (0.5h)
7.2 — Spec agent integration: POST /v1/execute type=SET_ENV escreve env file + chama systemctl mock. (0.5h)

### Fase 8: Bundle agent + Deploy + Validation (1h efetivo, +30min de espera por argus)

8.1 — Build backend + agent + frontend. Lint. Typecheck. (0.25h)
8.2 — Empacotar bundle agent: ver "Procedimento de Deploy" abaixo. (0.25h)
8.3 — Deploy: dokploy backend (commit→push→watch), scp bundle pra argus, `sudo bash install.sh --reinstall-bundle-only` (criar flag específica para skip handshake e só atualizar dist+sudoers; alternativa: rerun install.sh com nova flag `--update-only` que pula handshake). Vercel frontend. (0.25h)
8.4 — Validation: heartbeat verde em argus; PUT /env via UI; GET /env-status retorna `hasAnthropicKey=true`; deploy key gerada para projeto canário; sudoers `visudo -c` clean. (0.25h)

**Total Fase 1+...+8: 19h.** Buffer 20% já considerado.

---

## 6. Estimativa de Tempo (com buffer 20%)

| Fase | Tempo bruto | +20% buffer |
|------|-------------|-------------|
| 1. ADRs + DTOs | 1.5h | 1.8h |
| 2. Agent handlers | 4h | 4.8h |
| 3. Agent install.sh | 1.5h | 1.8h |
| 4. Backend endpoints | 5h | 6.0h |
| 5. Frontend /vps | 2.5h | 3.0h |
| 6. Frontend /projects/automation | 2.5h | 3.0h |
| 7. Specs adicionais | 1h | 1.2h |
| 8. Deploy + validation | 1h | 1.2h |
| **Total** | **19h** | **22.8h** |

**Ajuste vs estimativa CEO (16h):** subindo para ~19h efetivos (22.8h com buffer). Justificativa: a Fase 3 (sudoers + gitconfig idempotente, com testes de `visudo -c` e edge cases de re-run) é frequentemente subestimada; a Fase 6 (refactor de 2 painéis + drop de hooks órfãos) também. Recomendo expor o ajuste ao CEO antes do Implementer começar.

---

## 7. Riscos e Mitigações

### Risco ALTO

**R1 — `sudo systemctl restart scrumban-agent` mata o processo antes de devolver ACK.**
- Mitigação: ACK síncrono **antes** do `setImmediate(restart)`. O agent retorna 200, fecha a conexão TCP, e só depois agenda o restart. Backend deve aceitar que `lastEnvUpdatedAt` é gravado **com base no ACK**, não em confirmação pós-restart. Spec dedicada.
- Fallback: se restart falhar (sudoers mal configurado), `envStatus` no DB diz "configurado", mas claude continua sem env. Mitigação adicional: heartbeat seguinte do agent inclui `envFileSha256` (hash do env file) — backend compara com hash esperado, marca alerta se divergente.

**R2 — Argus (canário) quebra durante deploy.**
- Mitigação: deploy do agent é **opt-in por VPS**. Bundle novo só vai para argus depois do backend estar verde no Dokploy. Se argus quebrar, `tunnel-reset` + `sudo bash uninstall.sh` + `sudo bash install.sh` com bundle antigo (versionar bundle por commit hash).
- Rollback: ver "Procedimento de Rollback" abaixo.

**R3 — Path injection no `projectSlug` enviado pelo frontend.**
- Mitigação: validação **dupla**. Backend valida regex `^[a-z0-9-]{1,64}$` no DTO. Agent valida **novamente** o slug ao receber `GENERATE_DEPLOY_KEY`. Filename concatenado é `/etc/scrumban-agent/ssh-keys/<slug>` — agent faz realpath + checa que está sob `/etc/scrumban-agent/ssh-keys/` (anti symlink-escape, mesmo padrão já usado em `claude-code/allowlist.ts`).

### Risco MÉDIO

**R4 — Frontend continua mostrando `remotePath` em cache (React Query).**
- Mitigação: bump key da query `useAgentLink` ou invalidate completo no deploy. Componente do form usa `key={link?.updatedAt}` para forçar remount após mudança de contrato.

**R5 — PAT GitHub vazado em logs do agent.**
- Mitigação: pino logger já tem redaction; adicionar `vars.GITHUB_TOKEN`, `vars.ANTHROPIC_API_KEY` ao redact paths. Verificar via spec que log de `SET_ENV` não contém o valor. Spec dedicada.

**R6 — Backend usa `JSON.stringify(payload)` que inclui secret no rawBody → log do request.**
- Mitigação: backend NestJS interceptor já loga só status code + path em produção. Confirmar via inspeção do `LoggingMiddleware` (se existir) que body não é logado para `PUT /agents/:id/env`. Adicionar `@SkipBodyLog` decorator se necessário.

**R7 — Sudoers entry mal sintaxada brica o sudo geral.**
- Mitigação: `install.sh` escreve em `/etc/sudoers.d/scrumban-agent.new`, roda `visudo -cf /etc/sudoers.d/scrumban-agent.new`, **só renomeia se passar**. Idempotente.

### Risco BAIXO

**R8 — `ssh-keygen` não disponível na VPS.**
- Mitigação: install.sh já requer `openssh-client` (verificar passo de pré-requisitos). Adicionar check explícito.

**R9 — Frontend tenta gerar deploy key para projeto sem agent vinculado.**
- Mitigação: backend retorna 409 com mensagem clara; frontend exibe toast "Vincule uma VPS primeiro".

**R10 — Concorrência: dois operadores chamam PUT /env simultaneamente.**
- Mitigação: idempotência por sobrescrita (último write wins). Sem lock — `envStatus.lastEnvUpdatedAt` mostra qual venceu. Aceitável.

### Risco CRÍTICO se houver

**R11 — Quebra do contrato `/v1/execute` afeta `RUN_CLAUDE_CODE` em produção.**
- Mitigação: o dispatcher só lê `body.type` e roteia. Adicionar 2 novos `type`s não toca `RUN_CLAUDE_CODE`. Spec de regressão obrigatória. **Backend e agent saem no MESMO PR** (ADR-V2-036).

---

## 8. Critérios de Sucesso

### MUST HAVE (Go/No-Go)

- [ ] 4 endpoints backend (`PUT /agents/:id/env`, `GET /agents/:id/env-status`, `PUT /agents/:id/git-bot`, `POST /projects/:id/agent/:agentId/deploy-key`) implementados, autorizados via `RoleResolverService`, testados (unit Service + e2e Controller).
- [ ] 2 handlers agent (`SET_ENV`, `GENERATE_DEPLOY_KEY`) implementados, testados (integration com supertest contra `app`).
- [ ] Build verde: backend (`npm run build` + `npm run lint`), agent (`cd agent && npm run build && npm test && npm run lint && npm run typecheck`), frontend (`npm run build`).
- [ ] Hook `enforce-canonical-tables.sh` passa (zero tabela nova).
- [ ] Hook `validate-review-score.sh` passa (Reviewer ≥ 7.0).
- [ ] Argus (agentId=32) sobrevive ao deploy: heartbeat verde antes e depois.
- [ ] `/vps/:argus-id` mostra os 3 painéis novos; salvar credenciais funciona end-to-end (verificar `journalctl -u scrumban-agent` mostra restart).
- [ ] `/projects/:id/automation` mostra DeployKeyPanel + ProjectSlugCard; gerar deploy key retorna pubkey real.
- [ ] Backend **nunca** persiste plaintext de PAT/ANTHROPIC_KEY (verificar via query: `SELECT dados FROM DEntidade WHERE idClasse=-156` não contém esses valores; logs do backend também).

### SHOULD HAVE

- [ ] ADR-V2-041 + ADR-V2-042 escritos (rascunho aceitável; Documenter formaliza no commit).
- [ ] `envStatus` inclui `envFileSha256` para detectar drift (alerta no heartbeat se hash divergir do esperado).
- [ ] Frontend: tooltip explicando "credenciais ficam só na VPS, não no banco".
- [ ] Runbook `docs/automation-agent-install-runbook.md` atualizado com seção "Reconfigurar credenciais via UI".

### COULD HAVE

- [ ] Endpoint `DELETE /projects/:id/agent/:agentId/deploy-key` também dispara cleanup do arquivo na VPS (handler novo `REVOKE_DEPLOY_KEY` no agent). **Pula nesta task** — manual cleanup aceitável (decisão consistente com o `GitCredentialsPanel` atual: "private key na VPS NAO e apagada automaticamente").
- [ ] UI mostra estado "agent não está online" desabilitando os botões de SET_ENV / GENERATE_DEPLOY_KEY (pré-condição: agent status=online).

### WILL NOT HAVE

- ✘ Persistência de PAT/API key cifrada no DB.
- ✘ `git push` automático + PR via GitHub API (próxima task).
- ✘ Rotação automática de credenciais (manual).
- ✘ Suporte a outros tipos de chave SSH (só ed25519).
- ✘ Endpoint para upload de chave SSH pré-existente (só gera localmente).
- ✘ Multi-tenant para o env file (1 env file por VPS, compartilhado entre projetos da VPS — coerente com escopo: ANTHROPIC_API_KEY é per-VPS).

---

## 9. Procedimento de Deploy + Rollback

### Deploy (ordem)

**Pré-deploy:**
1. Confirmar argus heartbeat verde: `curl -H "Authorization: Bearer $TOKEN" https://api.scrumban.com.br/api/v1/agents/32 | jq .status` → "online".
2. Backup do `/etc/scrumban-agent/environment` da argus via SSH: `ssh dinpayz "sudo cat /etc/scrumban-agent/environment" > /tmp/argus-env-backup-$(date +%Y%m%d).txt`.
3. Backup do `/etc/sudoers.d/` (caso já exista algo): `ssh dinpayz "sudo ls -la /etc/sudoers.d/"`.
4. Confirmar branch local limpa, `git status` clean.

**Backend (Dokploy):**
1. Merge do PR em `main`.
2. Dokploy auto-deploy. Watch via `https://dokploy.<…>/projects/scrumban-backend/deployments`.
3. Smoke: `curl https://api.scrumban.com.br/api/v1/healthz` → 200. `curl …/agents` (com JWT) → lista contém argus, status="online".
4. **Aguardar 60s** — confirmar argus ainda online (heartbeat seguinte).

**Frontend (Vercel):**
1. Push para `main` (auto-deploy Vercel).
2. Smoke: abrir `https://scrumban.com.br/vps/32` → painéis novos aparecem.

**Agent (bundle manual → argus):**
1. No Mac (no diretório `agent/`):
   ```bash
   cd /Users/devaritecnologia/Documents/Benedito/Scrumban-Backend-V2/agent
   npm install
   npm run typecheck
   npm test
   npm run build
   # cria tarball com dist/, systemd/, install.sh, uninstall.sh, CLAUDE-md-template.md
   tar czf /tmp/scrumban-agent-bundle-$(date +%Y%m%d-%H%M).tgz \
     dist/ systemd/ install.sh uninstall.sh CLAUDE-md-template.md package.json package-lock.json
   ```
2. Copiar para argus:
   ```bash
   scp /tmp/scrumban-agent-bundle-*.tgz dinpayz:/tmp/
   ```
3. SSH na argus:
   ```bash
   ssh dinpayz
   sudo mkdir -p /tmp/scrumban-agent-bundle && cd /tmp/scrumban-agent-bundle
   sudo tar xzf /tmp/scrumban-agent-bundle-*.tgz
   # Para o serviço primeiro pra evitar race no env file
   sudo systemctl stop scrumban-agent
   # Aplica bundle (sem refazer handshake — config.json preservado, env preservado)
   sudo cp -r dist /opt/scrumban-agent/
   sudo cp systemd/scrumban-agent.service /etc/systemd/system/
   # Sudoers (NOVO — esta task)
   echo 'scrumban-agent ALL=(root) NOPASSWD: /bin/systemctl restart scrumban-agent' \
     | sudo tee /etc/sudoers.d/scrumban-agent > /dev/null
   sudo chmod 0440 /etc/sudoers.d/scrumban-agent
   sudo visudo -cf /etc/sudoers.d/scrumban-agent   # MUST PASS
   # ssh-keys dir (NOVO — esta task)
   sudo install -d -o scrumban-agent -g scrumban-agent -m 0700 /etc/scrumban-agent/ssh-keys
   # gitconfig placeholder (NOVO — esta task)
   sudo -u scrumban-agent bash -c 'test -f ~/.gitconfig || cat > ~/.gitconfig <<EOF
[user]
  name = Scrumban Bot
  email = bot@scrumban.app
EOF'
   sudo systemctl daemon-reload
   sudo systemctl start scrumban-agent
   sudo systemctl status scrumban-agent
   sudo journalctl -u scrumban-agent -f -n 50
   ```
4. Validar: heartbeat verde no UI `/vps/32`. PUT env via UI. `journalctl` mostra "set-env handler applied" + restart bem-sucedido.

### Rollback

**Backend:** Dokploy revert para deployment anterior (botão na UI). ~2min.

**Frontend:** Vercel rollback para deployment anterior. ~30s.

**Agent (argus):**
```bash
ssh dinpayz
sudo systemctl stop scrumban-agent
# Restaurar bundle anterior (manter sempre o bundle anterior em /tmp/scrumban-agent-bundle-prev/)
sudo cp -r /tmp/scrumban-agent-bundle-prev/dist /opt/scrumban-agent/
sudo cp /tmp/scrumban-agent-bundle-prev/systemd/scrumban-agent.service /etc/systemd/system/
# Remover sudoers entry da task atual
sudo rm /etc/sudoers.d/scrumban-agent
# Restaurar env file se necessário
sudo cp /tmp/argus-env-backup-YYYYMMDD.txt /etc/scrumban-agent/environment
sudo chown scrumban-agent:scrumban-agent /etc/scrumban-agent/environment
sudo chmod 0600 /etc/scrumban-agent/environment
sudo systemctl daemon-reload
sudo systemctl start scrumban-agent
```

**Critério de rollback:** se argus ficar `offline` por mais de 5 minutos após deploy do bundle, OR PUT /env retornar 5xx 3 vezes consecutivas, OR `journalctl` mostrar panic/crash do processo Node.

---

## 10. Considerações de Segurança

1. **Sudoers escopo mínimo:** `scrumban-agent ALL=(root) NOPASSWD: /bin/systemctl restart scrumban-agent` — sem wildcards, sem ALL=ALL. `visudo -c` valida sintaxe antes de ativar.
2. **Env file 0600 owner=scrumban-agent.** Write atômico (temp file + rename). Sem world-readable.
3. **Backend nunca loga body de PUT /env.** Adicionar `@SkipBodyLog` ou equivalente; verificar via spec.
4. **HMAC sempre obrigatório.** Mesma cadeia que `RUN_CLAUDE_CODE`. Replay protection via nonce store já existe.
5. **PAT/API key allowlist no agent.** Só `GITHUB_TOKEN`, `ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN`, `GIT_BOT_NAME`, `GIT_BOT_EMAIL` aceitos. Qualquer outra chave → 422.
6. **`projectSlug` regex `^[a-z0-9-]{1,64}$`.** Validado no backend E no agent. Realpath check no agent contra `/etc/scrumban-agent/ssh-keys/`.
7. **Audit trail via DEvento.** `agent.env.updated`, `project.deploy-key.generated` etc. — quem fez, quando, quais campos (sem valores).
8. **Frontend nunca persiste credenciais em localStorage.** Inputs limpos após save.
9. **Rotation de PAT/API key:** processo manual (operador rotaciona no GitHub/Anthropic, depois rechama PUT /env). Não há rotação automática.
10. **Deploy key per-projectSlug.** Comprometer 1 projeto não compromete os outros.

---

## 11. ADRs a Redigir (Documenter)

### ADR-V2-041: Env Management via API outbound HMAC

- **Contexto:** SSH manual quebra zero-friction; operador precisa configurar ANTHROPIC_API_KEY/PAT/git-bot sem terminal.
- **Decisão:** backend escreve env vars na VPS via HMAC outbound (`SET_ENV` no pipe `/v1/execute`), agent reescreve `/etc/scrumban-agent/environment` atomicamente + restart self via sudoers escopo mínimo. Backend **não persiste plaintext** — só `envStatus` (booleanos + timestamp) em `DEntidade -156 dados.envStatus`.
- **Alternativas:** persistir cifrado AES-256-GCM (rejeitado — defesa em profundidade); rota HTTP separada no agent (rejeitado — viola padrão `/v1/execute` discriminator).
- **Consequências (+):** zero SSH manual; audit trail; rotação trivial; sem credenciais em rest no backend. **(-):** se operador esquecer qual PAT escreveu, tem que regerar no GitHub; agent é único custodiante.

### ADR-V2-042: Deploy Key Automation pull-only

- **Contexto:** PR automático no fim do `RUN_CLAUDE_CODE` exige deploy key SSH per-repo. Gerar via SSH manual quebra zero-friction.
- **Decisão:** frontend dispara `GENERATE_DEPLOY_KEY` (per-projectSlug); agent gera `ssh-keygen ed25519` em `/etc/scrumban-agent/ssh-keys/<slug>` (idempotente); retorna apenas pubkey + fingerprint; backend persiste em `DVincula -185 metaDados.deployKeyPub`. **Privada nunca sai da VPS.**
- **Alternativas:** backend gera e envia privada (rejeitado — viola pull-only); upload manual (rejeitado — fricção).
- **Consequências (+):** privada nunca trafega; per-repo isolation; idempotente. **(-):** se VPS for substituída, deploy keys são reemitidas (operador remove antigas no GitHub).

---

## Handoff para Implementer

**Pré-requisitos:**
- Branch nova: `git checkout -b feat/vps-project-config-via-frontend`
- Ler ADR-V2-033 (HMAC), ADR-V2-035 (projectSlug), ADR-V2-037 (porta aberta `/v1/execute`).

**Ordem de execução (respeitar):**
1. Fase 1 (ADRs rascunho + DTOs) — não comitar ainda.
2. Fase 2 (Agent handlers) — comitar `feat(agent): handlers SET_ENV + GENERATE_DEPLOY_KEY no dispatcher /v1/execute`.
3. Fase 3 (install.sh) — comitar `feat(agent): sudoers escopo minimo + gitconfig placeholder + ssh-keys dir`.
4. Fase 4 (Backend) — comitar `feat(automation): endpoints PUT /agents/:id/env + POST /projects/:id/agent/:agentId/deploy-key + git-bot`.
5. Fase 5 (Frontend /vps) — comitar `feat(vps): painéis credenciais env + git bot + projetos vinculados em /vps/:id`.
6. Fase 6 (Frontend /projects/automation) — comitar `refactor(automation): remove remotePath e gitBot da AgentLinkForm; add ProjectSlugCard + DeployKeyPanel`.
7. Fase 7 (Specs adicionais) — comitar `test(automation): integration specs cadeia env/deploy-key end-to-end`.
8. Fase 8 (deploy) — fazer PR único (ADR-V2-036) para backend+agent; merge; deploy conforme procedimento §9.

**Comandos copiáveis (smoke local):**

```bash
# Backend
cd /Users/devaritecnologia/Documents/Benedito/Scrumban-Backend-V2
npm run build && npm run lint && npm test -- --testPathPattern=automation

# Agent
cd /Users/devaritecnologia/Documents/Benedito/Scrumban-Backend-V2/agent
npm install && npm run typecheck && npm test && npm run build && npm run lint

# Frontend
cd /Users/devaritecnologia/Documents/Benedito/Scrumbam-FrontEnd
npm run build && npm run lint
```

**Specs novas a criar (mínimo):**
- `src/automation/agents/agent-env.service.spec.ts` — autorização, idempotência, persistência envStatus, dispatch chamado.
- `src/automation/project-agent/deploy-key.service.spec.ts` — autorização, persistência metaDados, idempotência.
- `agent/__tests__/handlers/set-env.handler.spec.ts` — allowlist, write atômico, restart agendado.
- `agent/__tests__/handlers/generate-deploy-key.handler.spec.ts` — idempotência, fingerprint, path injection.
- `agent/__tests__/env/env-file-writer.spec.ts` — atomicidade, permissões 0600.
- `agent/__tests__/server/dispatcher.spec.ts` — atualizar para incluir os 2 novos `type`s + regressão de `RUN_CLAUDE_CODE`.

**Avisar Conversa Principal antes de:**
- Mudar contrato de `RemoteExecutionClient.execute()` (preferir adicionar `dispatch` paralelo).
- Tocar `DPedido` ou qualquer Engine (não é escopo).
- Criar DClasse nova (não é necessário).
- Persistir plaintext de credencial em qualquer lugar (proibido).
- Ajustar estimativa para > 22.8h efetivos sem replanejar.

**Após implementação, pedir Reviewer com foco em:**
- Pilar 1 violado? (não toca DPedido — confirma OK)
- Pilar 2: endpoints novos justificados? (sim — logica de orquestração HMAC)
- ADR-V2-001: zero tabela nova? (sim — só `dados`/`metaDados` JSON)
- ZERO N+1 nas queries dos Services.
- Logs do backend NÃO contêm valores de credencial (grep nas spec outputs).
- Sudoers entry tem `visudo -c` passando em CI ou ao menos no smoke do dry-run.
- Argus heartbeat verde antes e depois.
