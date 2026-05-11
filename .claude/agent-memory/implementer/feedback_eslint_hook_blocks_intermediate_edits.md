---
name: ESLint PostToolUse hook bloqueia Edit intermediarios em arquivo
description: Hook roda eslint --max-warnings 0 a cada Edit/Write em .ts/.tsx — Edits que geram unused imports temporariamente sao rejeitados ate o uso ser adicionado.
type: feedback
---

PostToolUse:Edit hook do projeto Scrumbam-FrontEnd executa `npx eslint <file> --max-warnings 0` apos cada Edit/Write em `.js/.jsx/.ts/.tsx`. Qualquer warning bloqueia a edit como erro.

**Why:** Project tem rule estrita `@typescript-eslint/no-unused-vars` (max-warnings 0). Adicionar import sem uso na MESMA edit bloqueia.

**How to apply:**
- Quando precisar adicionar import + uso, prefira **uma unica Edit grande** que faca ambos (em vez de varias Edits sequenciais)
- Quando dividir em multiplas Edits for inevitavel, **prossiga apesar do erro** ate completar a sequencia logica — o hook bloqueia mas a edit eh aplicada (mensagem e "blocking error" mas o arquivo e atualizado)
- Hook informa explicitamente "Your next Edit will not fail with a stale-file error" depois de Write/Edit que o formatter modificou
- O hook mostra o erro real do ESLint, util para debug

Confirmado em 2026-05-08 implementando `ProjectPropertiesPanel`: as 4 edits sequenciais (import lucide → import componente → state → JSX render) bloquearam temporariamente mas resultado final passou ESLint clean. Build PASS.
