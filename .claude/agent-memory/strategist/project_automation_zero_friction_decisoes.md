---
name: Decisoes Automation Zero-Friction (plan task01, 2026-05-07)
description: Decisoes arquiteturais tomadas autonomamente no plano canonico Automation Zero-Friction Flow — Fases 1/2/3. Documentadas pra revisao do dev no VALIDATING.
type: project
---

## Plano: workspace/plans/plan-automation-zero-friction-task01.md

7 decisoes autonomas tomadas no modo trabalhando, com defaults conservadores:

- **Q1 paste-token vs device flow OAuth Claude:** Escolhido paste-token cifrado (V1). Device flow vira V2.
  Why: device flow exige callback HTTP exposto na VPS — overhead novo. Paste-token resolve P24+P25 imediato.
  How to apply: ClaudeTokenService recebe POST do user com plaintext do `claude setup-token` no laptop, cifra com AES-256-GCM, envia ao agente via tunel SSH.

- **Q2 GitHub PAT por org vs por projeto:** Por organizacao. 1 PAT, projetos herdam.
  Why: microempresas tem 1 conta GitHub para varios repos.
  How to apply: ADMIN cadastra PAT em `/organization` -> aba Integracoes. GithubDeployKeyService e GithubPrService consultam DEntidade.githubPatCiphertext (cifrado).

- **Q3 Encryption strategy:** AES-256-GCM nativo Node, key em env `AUTOMATION_ENCRYPTION_KEY` (32 bytes hex obrigatoria).
  Why: pgp_sym_encrypt do Postgres exigiria gerenciar key na DB. AES-GCM nativo e padrao industria, zero deps.
  How to apply: TokenEncryptionService criado em `src/automation/shared/services/`. Suporta `AUTOMATION_ENCRYPTION_KEY_PREVIOUS` para rotacao (R-F do plano).

- **Q4 ConnectionKeeper push vs pull:** Pull leve, backend envia PING via cron 60s a cada agente registrado.
  Why: push exigiria mudar protocolo do agente. Pull reusa AgentTunnelService.sendCommand.
  How to apply: @Cron(EVERY_MINUTE) em ConnectionKeeperService. Limite 100 agentes/min. NUNCA dispara em pending_install.

- **Q5 PR open via Octokit vs gh CLI no agente:** Octokit no backend.
  Why: gh CLI exigiria login adicional. PAT da org ja existe (Q2). Backend abre PR via REST direta.
  How to apply: GithubPrService no backend usa @octokit/rest, le PAT decifrado, cria PR. Agente apenas faz git push da branch. OPEN_PULL_REQUEST handler do agente vira fallback (deprecated).

- **Q6 Sessao Claude — onde persistir:** Campo novo DExecution.claudeSessionId. Arquivos `.jsonl` permanecem em `$HOME/.claude/projects/` (path nativo Claude v2).
  Why: path nativo Claude v2 nao e mais sob XDG_CONFIG_HOME — premissa Fase 3 quebrada.
  How to apply: agente captura sessionId apos run via ClaudeSessionDetector (le mtime mais recente em `~/.claude/projects/<slug>/`). Continuar conversa: backend dispatch RUN_CLAUDE_CODE com claudeSessionId no payload, agente passa --resume ao claude.

- **Q7 install.sh auto-detect bindHost:** Auto-detect docker0 com fallback. Env var sempre overridable.
  Why: P17 obriga editar JSON na mao depois do install. Auto-detect resolve no momento.
  How to apply: install.sh testa `ip link show docker0`; se existe -> 172.17.0.1; senao -> 127.0.0.1. AGENT_BIND_HOST env override.

## Risks principais (R-A a R-I documentados no plano)

- **R-C critico:** token Claude vazado em logs durante dispatch. Mitigacao: auditoria adversarial obrigatoria, mascaramento em todos pontos. Reviewer rejeita se grep "sk-ant" achar algo em logs.
- **R-F:** rotacao de AUTOMATION_ENCRYPTION_KEY quebra tokens. Mitigacao: suporte a AUTOMATION_ENCRYPTION_KEY_PREVIOUS durante janela de rotacao.
- **R-E:** agentes ja instalados (Argus) quebrarem com migration. Mitigacao: migrations 100% aditivas, defaults conservadores, smoke contra Argus pos-deploy.

## 3 fases mergueaveis independentes

- **Fase 1 (1-2d):** zero-friction execucao — fecha ciclo intencao -> PR aberto. BLOQUEADOR DE PRODUCAO.
- **Fase 2 (2-3d):** zero-friction projeto — vinculo via painel, sem SSH.
- **Fase 3 (2-3d):** zero-friction agente — install em VPS limpa em 5min.

Cada fase tem KPIs proprios. Fase 1 deve ir pra producao em ate 48h.

## NOTA PARA O DEV

Revise Q2 (PAT por org) e Q3 (AES-256-GCM) ao validar — sao decisoes que afetam migration e arquitetura. Q4-Q7 sao taticas e podem ser ajustadas em fase posterior sem refactor grande.
