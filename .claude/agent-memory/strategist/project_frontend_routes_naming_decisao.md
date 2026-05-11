---
name: Decisao naming rotas frontend issues vs intentions
description: Convencao adotada para URLs do frontend Scrumban — path em ingles tecnico (issues), copy UI em pt-BR (intencao)
type: project
---

Path final adotado em 2026-05-07 (plan task01 Frontend Routes Refactor):

- `/projects/[id]/issues/[issueId]` — segmento URL eh `issues` (ingles tecnico)
- Copy UI continua usando "intencao/intencoes" (vocabulario de produto do Scrumban V3)
- Componentes em `src/components/intentions/` mantem nome (refletem dominio de negocio)

**Why:** Alinhamento com convencoes universais de issue trackers (GitHub, Jira, Linear) facilita compreensao
em logs, links externos compartilhados, e onboarding de devs novos. Vocabulario "intencao" eh especifico do
Scrumban V3 (P3 — Intent-Driven) e faz sentido na UI/copy, mas seria ruido em URL publica.

**How to apply:**
- Em refactors/novas rotas escopadas a projeto: usar `/projects/[id]/<recurso-em-ingles>`
- `/intentions/*` reservado para operacoes cross-project (inbox global, criacao global)
- Nao renomear pasta `src/components/intentions/` — refere ao dominio de negocio, nao a URL
- Em DTOs e API: manter `IntentionDocument`, `intentionId` como nomes de dominio (V3 P3)
- Em params do Next.js App Router: usar `id` e `issueId` (nomes neutros de URL), e fazer rename local
  via destructuring se quiser preservar `projectId` no codigo: `const { id: projectId } = params`
