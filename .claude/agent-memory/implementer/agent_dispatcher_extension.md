---
name: agent-dispatcher-extension
description: Como estender o dispatcher do scrumban-agent (`agent/src/server/dispatcher.ts`) adicionando novos `type`s ao pipe `POST /v1/execute`
metadata:
  type: project
---

O dispatcher do agent em `Scrumban-Backend-V2/agent/src/server/dispatcher.ts` usa um discriminator `type` no body. Para adicionar um novo comando:

1. Adicionar ao tuple `SUPPORTED_TYPES` no topo.
2. Criar handler em `agent/src/handlers/<name>.handler.ts` exportando `createXxxHandler(deps)` que retorna `(req, res) => void`.
3. Adicionar deps opcional na interface `DispatcherDeps` (`xxxHandler?: (req, res) => void`) para permitir injeção em testes (regressão).
4. Importar a factory e wire-up no `createDispatcher`: `const handler = deps.xxxHandler ?? createXxxHandler({ logger })`.
5. Adicionar `if (type === 'XXX') { handler(req, res); return; }` antes do fallback de RUN_CLAUDE_CODE.

**Why:** Plan-2026-05-13 §R11 — argus está em produção rodando RUN_CLAUDE_CODE. Qualquer regressão silenciosa do dispatcher bricka o canário.

**How to apply:** Sempre adicionar spec de regressão em `__tests__/dispatcher.spec.ts` que injeta um spy `runClaudeCodeHandler` e confirma que ele é chamado exatamente 1x quando `type=RUN_CLAUDE_CODE` E que os outros handlers NÃO são chamados.

ESLint hook bloqueia Edit intermediário se importar handler factory sem usá-la. Agrupar import + uso na mesma Edit. Ver [[eslint-hook-blocks-intermediate-edits]].
