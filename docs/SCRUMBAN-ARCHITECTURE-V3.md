# Scrumban — Arquitetura Definitiva: Repositorio de Intencoes

**Data:** 2026-03-26
**Autor:** Devari Tecnologia
**Status:** Documento fundacional — governa TODAS as decisoes de produto e engenharia
**Base:** Pesquisa Agile/IA 2026 (150+ fontes) + Analise de Big Techs + Visao do Fundador

---

## 1. O Que e o Scrumban

O Scrumban e um **repositorio de intencoes com visualizacao de fluxo**. Ele captura demandas de multiplos canais (WhatsApp, email, Slack, interface web), organiza e prioriza essas intencoes, e as disponibiliza para que projetos as puxem e executem de forma autonoma.

O Scrumban nao executa trabalho. Nao dispara agentes. Nao sabe como cada projeto funciona. Ele e o ponto central onde intencoes nascem, sao refinadas, e de onde resultados sao acompanhados.

Quem executa sao os **projetos** — repositorios independentes com seus proprios agentes, suas proprias regras, suas proprias stacks. Cada projeto e uma caixa preta que recebe uma intencao e devolve um resultado.

---

## 2. Fundacao na Pesquisa (Evidencias)

Toda decisao neste documento esta ancorada na pesquisa "O Estado do Scrum, Agile e Desenvolvimento de Software na Era da IA (2025-2026)". Nao e opiniao — sao dados.

### 2.1 Como as Big Techs Realmente Funcionam

| Empresa | Sistema de Gestao | Quem Executa | O sistema dispara execucao? |
|---------|-------------------|--------------|----------------------------|
| **Meta** | Phabricator (tracking) | Engenheiro cria suas proprias tasks a partir do PRD | **NAO.** PM escreve PRD, eng decide o que fazer |
| **Amazon** | SIM (ticketing) | Two-pizza team com ownership total | **NAO.** PR/FAQ define intencao, time puxa trabalho |
| **Google** | Buganizer (tasks) | Engenheiro + TL a partir do Design Doc | **NAO.** Design Doc e intencao, eng puxa tasks |
| **Netflix** | Nao tem formal | Full Cycle Dev com autonomia total | **NAO.** "Gestor NAO cria tickets" |
| **Basecamp** | Hill Charts (visual) | Time de 2-3 executa o pitch selecionado | **NAO.** Betting Table seleciona, time puxa |
| **Spotify** | Varia por squad | Squad decide framework e execucao | **NAO.** Cada squad e autonomo |
| **Shopify** | Interno | Dev com `/shipit` | **NAO.** "Meeting Armageddon" — cancelaram tudo |

**Fonte:** Pesquisa Parte II, secoes 2.1 a 2.8

**Padrao universal:** O sistema de gestao e **passivo**. Ele armazena intencoes/decisoes. Quem puxa o trabalho e o time/engenheiro/agente que esta **dentro do projeto**.

**Nenhuma dessas empresas usa Kanban board como ferramenta principal de gestao de alto nivel.** Usam listas de tickets (Amazon SIM, Google Buganizer), dashboards (Netflix Atlas), ou Hill Charts (Basecamp). O Kanban board classico de 6 colunas e para o **time de execucao**, nao para o sistema de gestao.

### 2.2 O Padrao Orchestrator (Secao 4.7)

A pesquisa descreve o Padrao Orchestrator assim:

> "Em vez de escrever codigo, o dev e **orquestrador que dirige agentes**."
>
> ```
> MANHA: Revisar execucoes noturnas, merge PRs de agentes, despachar novas tarefas
> DIA: Trabalho profundo + agentes operando em paralelo
> NOITE: Despachar tarefas para execucao overnight
> ```

Quem despacha e o **dev sentado no projeto**, nao uma plataforma externa. O dev olha as intencoes pendentes, pega uma, e usa seus agentes locais para executar.

### 2.3 Intent-Driven Development (Secao 4.4)

> "A qualidade da sua especificacao determina a qualidade do resultado — nao sua velocidade, nao o tamanho da equipe, mas sua **clareza de intencao**."

A intencao fica num lugar (Scrumban). A execucao acontece em outro (projeto). Sao separados por design.

### 2.4 Spec-Driven Development — ThoughtWorks (Secao 4.3)

```
Humano escreve SPEC (requisitos bem elaborados)
    -> Agente gera codigo executavel a partir da spec
    -> Humano revisa
    -> Deploy
```

O agente que gera codigo esta **dentro do projeto**, lendo o codebase, entendendo a arquitetura. Nao esta numa plataforma de gestao.

### 2.5 O Fluxo Devari na Pesquisa (Secao 9.2)

```
CHEFE chega com demanda
    |
    v
DESENVOLVEDOR descreve a intencao para agente(s):
    "Preciso de um endpoint que retorne resumo de horas
     por sprint, agrupado por usuario"
    |
    v
AGENTE (Claude Code / Codex / Devin):
    |-- Le o codebase (NestJS + Prisma + DEvento)
    |-- Entende a arquitetura
    |-- Planeja a implementacao
    |-- Escreve o codigo (controller, service, DTO)
    |-- Escreve os testes
    |-- Roda e corrige
    |-- Entrega PR pronta
    |
    v
DESENVOLVEDOR revisa o PR (minutos)
    |
    v
DEPLOY (CI/CD automatico)
```

**"Le o codebase"** — isso so acontece DENTRO do projeto. O Scrumban nao tem codebase. Nao tem Prisma schema. Nao tem CLAUDE.md. O agente precisa estar no repositorio do projeto para funcionar.

### 2.6 Dados que Sustentam o Modelo

| Dado | Valor | Fonte | Implicacao |
|------|-------|-------|-----------|
| Organizacoes usando modelos hibridos | 74% | Digital.ai 2025 | Frameworks rigidos nao funcionam |
| Proficiencia real em Agile | 7% | Forrester 2025 | Maioria faz "agile theater" |
| Big Techs usando Scrum puro | 0 de 8 | Pesquisa Parte II | Nenhuma usa framework rigido |
| Codigo global gerado por IA | 42% | GitHub Octoverse 2025 | IA ja e mainstream |
| Devs como Orquestradores de Agentes | tendencia | Scrum.org, Anthropic | O dev orquestra, a ferramenta nao |
| "Escrita > Reunioes" | unanime | Todas Big Techs | Documentos de intencao, nao cerimonias |

---

## 3. O Modelo: Dois Mundos Separados

### 3.1 Diagrama Conceitual

```
MUNDO 1: GESTAO (Scrumban)              MUNDO 2: EXECUCAO (Projetos)
============================            ================================

Stakeholders                            Projeto A (ex: devari-backend)
  |-- WhatsApp                          +-- Repositorio GitHub
  |-- Email                             +-- CLAUDE.md (regras do projeto)
  |-- Reuniao                           +-- Agents proprios:
  |-- Slack                             |     strategist
  |-- Direto na plataforma              |     implementer
  |                                     |     reviewer
  v                                     |     documenter
                                        +-- Stack propria (NestJS, Prisma)
[SCRUMBAN]                              +-- CI/CD proprio
  |                                     |
  +-- Recebe intencoes                  |  Projeto B (outro SaaS)
  +-- Organiza (lista, prioridade)      +-- Repositorio GitHub
  +-- Visualiza fluxo                   +-- CLAUDE.md diferente
  +-- Mede metricas de intencao         +-- Agents diferentes
  +-- Expoe API publica                 +-- Stack diferente
  |                                     |
  | <--- API --->                       |
  |                                     |
  | GET /intentions?status=ready        |
  | PUT /intentions/:id/status          |
  | POST /intentions/:id/report         |
  |                                     |
  +-- Projeto PUXA intencao    -------> +-- Agentes EXECUTAM
  +-- Projeto REPORTA resultado <------ +-- "concluido" ou "falhou"
  +-- Scrumban ATUALIZA status          |
  +-- Stakeholder VE progresso          |
```

### 3.2 Execucao como Operacao Atomica

Do ponto de vista do Scrumban, a execucao dentro do projeto e uma **operacao atomica**. O projeto pega a intencao, e internamente acontece um ciclo completo:

```
Dentro do projeto (INVISIVEL para o Scrumban):
  Orchestrator le a intencao
      -> Strategist cria plano
      -> Implementer codifica
      -> Reviewer valida
      -> (se rejeitou, Implementer corrige, Reviewer valida de novo)
      -> Documenter documenta
      -> PR aberto, revisado, merged
      -> CI/CD deploya
```

Tudo isso acontece numa unica sessao de trabalho. O Scrumban nao ve — e nao precisa ver — os estados internos (planning, implementing, reviewing, testing). Para o Scrumban, existem apenas dois momentos:

1. **Projeto pegou a intencao** (status: `executing`)
2. **Projeto devolveu o resultado** (status: `completed` ou `failed`)

Nao existe "Review" no Scrumban porque code review acontece dentro do projeto. Nao existe "Testing" no Scrumban porque testes rodam no CI/CD do projeto. Nao existe "In Progress" com sub-estados porque o ciclo interno e autonomo.

Se o resultado nao ficou bom, o dev no projeto simplesmente itera na proxima sessao — corrige e reporta novamente. O Scrumban nao gerencia esse loop de correcao.

### 3.3 Separacao de Responsabilidades

#### O que o Scrumban FAZ:

1. **Receber intencoes** de multiplos canais (WhatsApp, email, API, interface web)
2. **Organizar intencoes** em lista com prioridades, categorias, apetite
3. **Expor intencoes** via API para que projetos consultem o que precisa ser feito
4. **Receber resultados** dos projetos (concluido ou falhou, com deliverables)
5. **Visualizar fluxo** (lista de intencoes, Hill Charts, metricas)
6. **Medir metricas de intencao** (cycle time criacao->conclusao, throughput intencoes/semana)
7. **Alertar** (planning trigger quando fila esvazia, circuit breaker quando apetite estoura)
8. **Gerar relatorios** para stakeholders (Monte Carlo, forecasting, status por projeto)

#### O que o Scrumban NAO FAZ:

1. ~~Disparar agentes IA~~ — isso e responsabilidade do projeto
2. ~~Saber a stack do projeto~~ — NestJS, Prisma, React sao problemas do projeto
3. ~~Gerenciar agents~~ — cada projeto tem seus proprios agents
4. ~~Configurar Claude API keys~~ — pertence ao projeto
5. ~~Fazer code review~~ — o dev no projeto revisa
6. ~~Medir tokens/custo de agente~~ — metrica do projeto, nao do Scrumban
7. ~~Criar branches/PRs~~ — GitHub e do projeto
8. ~~Executar testes~~ — CI/CD e do projeto
9. ~~Gerenciar estados internos de execucao~~ — o projeto e uma caixa preta

### 3.4 Analogia

O Scrumban e mais proximo do **Linear** do que do Trello. Linear organiza trabalho em listas com status badges, prioridades, e metricas. Nao finge que controla a execucao — mostra o que existe e em que estado esta.

A diferenca do Scrumban para Linear e:
- **Intent-Driven** (nao tickets): documentos de intencao com problema, solucao, criterios de aceite
- **Metricas de fluxo** (nao story points): cycle time, throughput, Monte Carlo
- **Shape Up elements**: Hill Charts, appetite, circuit breaker
- **Multi-canal**: recebe intencoes de WhatsApp, email, Slack — nao so da interface
- **API-first**: projetos se conectam via API, nao via integracao acoplada

---

## 4. Ciclo de Vida da Intencao

### 4.1 Estados

Uma intencao tem exatamente **4 estados principais** e 3 estados terminais:

```
INBOX -----> READY -----> EXECUTING -----> DONE
  |                          |
  |                          +--> FAILED (projeto nao conseguiu)
  |
  +--> DISCARDED (nao e relevante, nunca foi refinada)
  |
  +--> CANCELLED (era relevante mas nao e mais)

Transicao opcional apos DONE:
  DONE --> VALIDATING --> VALIDATED (stakeholder nao-tecnico aprovou)
```

**Por que so 4 estados principais:**
- **INBOX**: Intencao chegou de algum canal. Precisa ser refinada por um humano.
- **READY**: Intencao refinada, com problema claro, criterios de aceite, projeto atribuido. Disponivel para o projeto puxar.
- **EXECUTING**: Projeto pegou a intencao. Operacao atomica em andamento. Scrumban nao interfere.
- **DONE**: Projeto reportou conclusao com deliverables.

Nao existe "Review" porque review e interno ao projeto. Nao existe "Testing" porque testes sao do CI/CD do projeto. Nao existe "In Progress" com sub-estados porque a execucao e atomica.

### 4.2 Fluxo Completo

```
FASE 1: CAPTURA DA INTENCAO
============================

Canal de entrada             Scrumban
  |                            |
  |-- WhatsApp msg  ---------> |
  |-- Email         ---------> | -> Parser extrai: titulo, problema, contexto
  |-- Slack msg     ---------> |
  |-- Interface web ---------> | -> Wizard: Problema -> Solucao -> Config
  |-- API direta    ---------> |
                               |
                               v
                        [Intencao Criada]
                        Status: INBOX
                        Campos:
                          titulo
                          problema (o que resolver)
                          contexto (por que agora)
                          solucao proposta (como, opcional)
                          criterios de aceite
                          nao-objetivos (explicitamente excluido)
                          riscos
                          tipo (code, analysis, docs, test, refactor)
                          prioridade (urgent, high, medium, low)
                          apetite em dias (budget de tempo — Shape Up)
                          projeto destino (qual repo vai executar)
                          criado por (stakeholder)
                          canal de origem (whatsapp, email, web, api)


FASE 2: REFINAMENTO E DISPONIBILIZACAO
=======================================

Responsavel: PO / Tech Lead / Fundador (humano)

  [Intencao INBOX]
        |
        v
  Humano revisa, refina, prioriza
  (adiciona criterios de aceite, define projeto, ajusta prioridade)
        |
        v
  [Intencao READY]  <-- Disponivel para projetos puxarem


FASE 3: PROJETO PUXA INTENCAO
==============================

Projeto A (backend com seus agents)
        |
        | GET /api/intentions?status=ready&projectId=projeto-a
        |
        v
  Recebe lista de intencoes prontas para ele
        |
        | PUT /api/intentions/:id/status
        | Body: { status: "executing" }
        |
        v
  Scrumban atualiza status para EXECUTING
  Stakeholder ve que o projeto esta trabalhando


FASE 4: EXECUCAO (OPERACAO ATOMICA — INVISIVEL PARA O SCRUMBAN)
================================================================

Tudo acontece DENTRO do projeto numa unica sessao de trabalho.
O Scrumban nao ve, nao controla, nao interfere.

  Projeto A internamente:
    Dev/Orchestrator le a intencao
        -> Agents executam ciclo completo
        -> (plan -> implement -> review -> fix -> review -> document)
        -> PR aberto, revisado, merged
        -> CI/CD deploya
        -> FEITO (ou falhou)


FASE 5: PROJETO REPORTA RESULTADO
==================================

Projeto A reporta de volta ao Scrumban:

  POST /api/intentions/:id/report
  Body: {
    status: "completed",          // ou "failed"
    completedAt: "2026-03-26T14:30:00Z",
    deliverables: {
      prUrl: "https://github.com/devari/projeto-a/pull/42",
      summary: "Endpoint criado com controller, service, DTO e testes",
      filesChanged: 8
    },
    metrics: {                    // Opcionais — projeto decide se envia
      executionTimeMinutes: 45
    }
  }

  Scrumban atualiza:
    |-- Status muda para DONE
    |-- Metricas de fluxo atualizadas (cycle time calculado)
    |-- Stakeholder notificado
    |-- Hill Chart atualizado (100%)

  Se falhou:
    |-- Status muda para FAILED
    |-- Motivo registrado
    |-- Dev pode criar nova tentativa ou o PO re-prioriza


FASE 6: VALIDACAO DO STAKEHOLDER (OPCIONAL)
============================================

Se a intencao veio de um stakeholder nao-tecnico:

  Stakeholder recebe notificacao (WhatsApp, email, interface)
        |
        v
  Valida o resultado:
    |-- "Aprovado" -> VALIDATED (intencao finalizada)
    |-- "Precisa ajuste" -> nova intencao criada com referencia a original
```

### 4.3 O Que Cada Ator Ve

| Ator | O que ve no Scrumban | O que faz |
|------|---------------------|-----------|
| **Stakeholder** (chefe, cliente) | Suas intencoes e status atual | Cria intencoes via WhatsApp/email/web. Valida resultados quando concluidos. |
| **PO / Tech Lead** | Lista completa de intencoes, metricas, Hill Charts | Refina intencoes (INBOX -> READY). Prioriza. Define projeto destino. |
| **Dev / Orchestrator** | Intencoes READY do seu projeto | Puxa intencoes via API. Executa com agents do projeto. Reporta resultado. |
| **Projeto (via API)** | Intencoes atribuidas a ele | Consulta pendencias. Reporta "concluido" ou "falhou" com deliverables. |

---

## 5. Interface: Lista de Intencoes (Nao Kanban Board)

### 5.1 Por Que Lista e Nao Board

Um Kanban board classico (Backlog -> Ready -> In Progress -> Review -> Testing -> Done) pressupoe que o usuario ve e controla cada transicao entre colunas. No modelo do Scrumban, a execucao e uma operacao atomica — nao existem estados intermediarios visiveis entre "projeto pegou" e "projeto entregou".

Um board de 6 colunas para 4 estados reais seria artificial. As colunas "Review" e "Testing" estariam sempre vazias porque esses estados acontecem dentro do projeto.

A pesquisa confirma: nenhuma Big Tech usa Kanban board para gestao de alto nivel (secao 2.8). Amazon usa SIM (tickets), Google usa Buganizer (lista), Basecamp usa Hill Charts. O board Kanban e para o time de execucao, nao para o sistema de gestao.

### 5.2 View Principal: Lista de Intencoes

A interface principal e uma **lista agrupada por status** com badges, prioridade, projeto, canal e tempo:

```
+-------------------------------------------------------------+
|  Intencoes                                   [+ Nova]        |
|-------------------------------------------------------------+
|  Filtros: [Todas] [Projeto] [Prioridade] [Canal] [Tipo]     |
|-------------------------------------------------------------+
|                                                              |
|  INBOX (3)                                                   |
|  |-- "Filtro por regiao no relatorio"  WhatsApp  hoje        |
|  |-- "Bug no login com Google"         Email     ontem       |
|  |-- "Dashboard de vendas mensal"      Slack     ontem       |
|                                                              |
|  READY (4)                          Planning Trigger: OK     |
|  |-- "Endpoint resumo por sprint"  devari  Alta   3d         |
|  |-- "Corrigir calculo cycle time" scrumban Urg   1d         |
|  |-- "Webhook notificacao Slack"   scrumban Med   2d         |
|  |-- "Refatorar auth middleware"   devari   Low   5d         |
|                                                              |
|  EXECUTING (2)                                               |
|  |-- "Cache Redis para dashboards" devari       ha 2h        |
|  |-- "Modulo de templates"         scrumban-be  ha 5h        |
|                                                              |
|  DONE HOJE (3)                                               |
|  |-- "Fix N+1 query /entidades"    devari    PR #42          |
|  |-- "Docs da API publica"         scrumban  PR #18          |
|  |-- "Seed classes Scrumban"        scrumban  PR #15          |
|                                                              |
+-------------------------------------------------------------+
```

### 5.3 Views Complementares

| View | Proposito | Quando usar |
|------|----------|-------------|
| **Lista de Intencoes** | View principal. Visao completa de todas intencoes por status. | Uso diario. PO refinando, dev consultando, stakeholder acompanhando. |
| **Hill Chart** | Progresso macro de intencoes estrategicas. | PO acompanhando intencoes complexas ao longo de dias/semanas. |
| **Dashboard de Metricas** | Cycle time, throughput, WIP, Monte Carlo. | Retrospectiva, planejamento, relatorio stakeholder. |
| **Timeline de Atividade** | Feed cronologico: "projeto X completou intencao Y". | Acompanhamento em tempo real. |
| **Projetos Conectados** | Status de cada projeto: quantas intencoes em cada estado. | Visao gerencial por projeto. |

### 5.4 O Hill Chart no Modelo Correto

Hill Charts sao do Shape Up (Basecamp). No Scrumban, representam o **progresso de refinamento** de uma intencao, nao o progresso de execucao.

```
            Clareza
              /\
             /  \
            /    \
           /      \
  Descoberta      Entregue
  (refinamento)   (resultado)
```

| Fase | O que representa | Quem move |
|------|-----------------|-----------|
| **Uphill (0-49%)** | PO esta refinando: problema esta claro? Solucao faz sentido? Criterios de aceite existem? | PO/humano arrasta o dot conforme refina |
| **Topo (50%)** | Intencao totalmente especificada. READY para projeto puxar. | PO marca READY |
| **Downhill (51-99%)** | Projeto puxou, esta executando. | Automatico quando projeto reporta `executing` |
| **Base direita (100%)** | Projeto reportou conclusao. | Automatico quando projeto reporta `completed` |

A descida e **binaria**: quando o projeto pega a intencao, pula para ~70%. Quando o projeto reporta conclusao, pula para 100%. Nao existem estados intermediarios porque a execucao e atomica do ponto de vista do Scrumban.

Isso torna o Hill Chart uma ferramenta focada no **refinamento** (a parte que o PO controla) — que e exatamente onde ele agrega valor. A execucao e acompanhada por tempo (`ha 2h`, `ha 5h`), nao por posicao no hill.

---

## 6. Metricas: O Que Pertence ao Scrumban vs Projeto

### 6.1 Metricas do Scrumban (nivel intencao)

Estas metricas medem o **fluxo de intencoes**, nao a execucao tecnica:

| Metrica | O que mede | Como calcula |
|---------|-----------|--------------|
| **Cycle Time** | Da criacao da intencao ate DONE | completedAt - createdAt |
| **Lead Time** | De READY ate DONE | completedAt - readyAt |
| **Execution Time** | De EXECUTING ate DONE | completedAt - executingAt |
| **Throughput** | Intencoes completadas por semana | COUNT(done) / semanas |
| **WIP** | Intencoes em execucao agora | COUNT(status = executing) |
| **WIP Age** | Ha quanto tempo cada intencao esta em execucao | now - executingAt |
| **Queue Time** | Quanto tempo ficou em READY antes de ser puxada | executingAt - readyAt |
| **Refinement Time** | Quanto tempo ficou em INBOX antes de ficar READY | readyAt - createdAt |
| **Appetite Compliance** | % de intencoes entregues dentro do apetite | COUNT(onTime) / COUNT(done) |
| **Failure Rate** | % de intencoes que falharam | COUNT(failed) / COUNT(total) |
| **Channel Distribution** | De onde vem as intencoes | GROUP BY canal_origem |
| **Project Throughput** | Throughput por projeto | GROUP BY projeto |
| **Monte Carlo Forecast** | Previsao de quando backlog sera concluido | Simulacao sobre throughput historico |
| **CFD** | Cumulative Flow Diagram | Contagem acumulada por status ao longo do tempo |

### 6.2 Metricas que NAO pertencem ao Scrumban

Estas metricas sao do **projeto**, nao do Scrumban:

| Metrica | Por que nao pertence ao Scrumban |
|---------|--------------------------------|
| ~~Tokens gastos por agente~~ | Cada projeto tem seus agentes com seus custos |
| ~~Custo por task em R$~~ | Custo de API e do projeto |
| ~~Human vs AI ratio~~ | O projeto decide quanto usa de IA |
| ~~Agent model usado~~ | Cada projeto escolhe Haiku/Sonnet/Opus |
| ~~Linhas de codigo geradas~~ | Metrica de engenharia, nao de gestao |
| ~~Cobertura de testes~~ | Qualidade de codigo e do projeto |
| ~~Build status~~ | CI/CD e do projeto |
| ~~Sub-estados de execucao~~ | Plan/implement/review/test sao internos ao projeto |

**Excecao:** Se o projeto **optar** por enviar metricas extras no report, o Scrumban pode armazena-las e exibi-las como informacao complementar. Mas nunca como funcionalidade core.

---

## 7. API do Scrumban (Contrato com Projetos)

### 7.1 Endpoints Publicos (para projetos consumirem)

```
# Autenticacao
POST   /api/auth/project-token        # Projeto se autentica com API key

# Consultar intencoes
GET    /api/intentions                 # Lista intencoes (filtros: status, projectId, priority)
GET    /api/intentions/:id             # Detalhe de uma intencao

# Atualizar status (so 2 transicoes possiveis para o projeto)
PUT    /api/intentions/:id/execute     # Projeto informa: "estou executando"
PUT    /api/intentions/:id/complete    # Projeto informa: "concluido" (com deliverables)
PUT    /api/intentions/:id/fail        # Projeto informa: "falhou" (com motivo)

# Webhooks (Scrumban notifica projeto)
POST   /api/webhooks/subscribe         # Projeto se inscreve para receber eventos
```

A API reflete a natureza atomica da execucao: o projeto so pode fazer 3 coisas — pegar (`execute`), entregar (`complete`), ou reportar falha (`fail`). Nao existem estados intermediarios.

### 7.2 Webhooks (Scrumban -> Projeto)

O Scrumban notifica projetos quando ha novidades:

```json
{
  "event": "intention.ready",
  "intention": {
    "id": "int_abc123",
    "title": "Criar endpoint de resumo por sprint",
    "priority": "high",
    "apetiteDias": 3,
    "type": "code"
  },
  "project": {
    "id": "proj_xyz",
    "name": "devari-backend"
  }
}
```

Eventos possiveis:
- `intention.ready` — nova intencao disponivel para o projeto
- `intention.cancelled` — intencao foi cancelada pelo PO
- `intention.priority_changed` — prioridade mudou
- `intention.appetite_exceeded` — circuit breaker: apetite estourou

### 7.3 Exemplo de Integracao (Projeto Consumindo)

```typescript
// No projeto (ex: devari-backend), um script/agent faz:

// 1. Buscar intencoes prontas
const intentions = await fetch(
  'https://scrumban.devari.com/api/intentions?status=ready&projectId=devari-backend',
  { headers: { 'Authorization': `Bearer ${PROJECT_API_KEY}` } }
).then(r => r.json());

// 2. Pegar a de maior prioridade
const next = intentions[0];

// 3. Marcar como executando
await fetch(`https://scrumban.devari.com/api/intentions/${next.id}/execute`, {
  method: 'PUT',
  headers: { 'Authorization': `Bearer ${PROJECT_API_KEY}` }
});

// 4. Executar com agents do projeto (ciclo completo, atomico)
// ... plan -> implement -> review -> fix -> document -> PR -> merge

// 5. Reportar resultado
await fetch(`https://scrumban.devari.com/api/intentions/${next.id}/complete`, {
  method: 'PUT',
  headers: { 'Authorization': `Bearer ${PROJECT_API_KEY}` },
  body: JSON.stringify({
    deliverables: {
      prUrl: 'https://github.com/devari/devari-backend/pull/42',
      summary: 'Endpoint criado com controller, service, DTO e 8 testes'
    }
  })
});
```

---

## 8. Canais de Entrada (Multi-Canal)

Um dos diferenciais do Scrumban e receber intencoes de qualquer lugar, nao so da interface web.

### 8.1 Canais Suportados

| Canal | Como funciona | Parser necessario |
|-------|--------------|-------------------|
| **Interface Web** | Wizard de 3 passos (Problema -> Solucao -> Config) | Nenhum (input estruturado) |
| **API Direta** | `POST /api/intentions` com JSON | Nenhum (input estruturado) |
| **WhatsApp** | Webhook recebe mensagem -> IA extrai intencao | Sim (LLM extrai titulo, problema, contexto) |
| **Email** | Webhook recebe email -> IA extrai intencao | Sim (LLM extrai titulo, problema, contexto) |
| **Slack** | Bot recebe mensagem/comando -> cria intencao | Sim (parser de comando ou LLM) |
| **GitHub Issue** | Webhook detecta nova issue -> cria intencao | Sim (mapeia titulo/body) |

### 8.2 Fluxo Multi-Canal

```
Stakeholder manda WhatsApp:
  "Preciso que o relatorio de vendas mostre filtro por regiao"
      |
      v
  Webhook recebe mensagem
      |
      v
  LLM extrai:
    titulo: "Filtro por regiao no relatorio de vendas"
    problema: "Relatorio atual nao permite filtrar por regiao"
    contexto: "Stakeholder precisa analisar performance regional"
    tipo: "code"
    prioridade: "medium" (inferida)
      |
      v
  Intencao criada como INBOX
  PO recebe notificacao para refinar e aprovar
      |
      v
  PO refina (ajusta prioridade, define projeto, adiciona criterios)
      |
      v
  Move para READY
```

Intencoes de canais nao-estruturados (WhatsApp, email) SEMPRE entram como INBOX. Um humano SEMPRE refina antes de disponibilizar para projetos. Nao existe automacao que pula o refinamento — isso evita "garbage in, garbage out".

---

## 9. Navegacao (Sidebar)

```
Intencoes
  Lista               -- View principal: todas intencoes com status badges
  Hill Chart           -- Progresso macro de intencoes estrategicas
  Novo                 -- Wizard de 3 passos para criar intencao

Insights
  Dashboard            -- Metricas de fluxo (cycle time, throughput, WIP, CFD)
  Forecasting          -- Monte Carlo, previsao de conclusao do backlog
  Analytics            -- Relatorio stakeholder, comparacao de periodos

Projetos
  Conectados           -- Projetos conectados, status, API keys, throughput
  Atividade            -- Timeline de eventos (projeto puxou, completou, falhou)

Equipe
  Retrospectiva        -- Coleta assincrona de feedback
  Templates            -- Templates de intencao reutilizaveis

Sistema
  Configuracoes        -- Branding, notificacoes, webhooks de saida
  Canais               -- Config WhatsApp, email, Slack (webhooks de entrada)
```

---

## 10. Estado Atual: Diagnostico dos Repositorios

### 10.1 Srumban-Frontend (Next.js)

| Aspecto | Valor |
|---------|-------|
| **Total arquivos .ts/.tsx** | 215 |
| **Total linhas** | 23.032 |
| **Linhas alinhadas** (intentions, dashboard, common, analytics, lib) | ~9.445 (41%) |
| **Linhas a remover** (agents, impact, review, agent-worker, board Kanban, mocks de execucao) | ~5.800 (25%) |
| **Linhas neutras** (UI lib, types, infra) | ~7.787 (34%) |

**Componentes a manter e adaptar:**

| Componente | Adaptacao necessaria |
|-----------|---------------------|
| `intentions/` (intention-wizard, intention-list, intention-detail, intention-doc-view, hill-chart) | Manter. Adaptar hill chart para modelo atomico. |
| `dashboard/` (throughput-chart, cfd-chart, monte-carlo-chart, kpi-card, wip-age-alerts) | Manter. Contexto muda para intencoes (ja esta correto conceptualmente). |
| `card-detail/` (card-detail-sheet, card-details-form, card-comments, card-appetite-indicator) | Manter. Remover card-agent-executor e card-agent-output. |
| `analytics/` (capacity-forecast, period-comparison, stakeholder-report) | Manter integralmente. |
| `common/` (app-header, theme-toggle, breadcrumb-nav, page-transition) | Manter. Refazer sidebar para novo modelo. |
| `lib/api/` (auth, comments, dashboards, endpoints, flow-metrics, forecast, projects, tasks, webhooks) | Manter. Adicionar intentions API. |
| `lib/hooks/` (use-board, use-card-detail, use-dashboards, use-forecast, use-auth, use-analytics, use-intentions) | Manter. |
| `lib/stores/` (auth-store) | Manter. |

**Componentes a remover:**

| Componente | Por que |
|-----------|--------|
| `components/agents/` (inteiro) | Agents pertencem ao projeto, nao ao Scrumban |
| `components/impact/` (inteiro) | Metricas de execucao de agente sao do projeto |
| `components/review/` (inteiro) | Code review e dentro do projeto |
| `components/board/` (inteiro) | Board Kanban de 6 colunas nao reflete os 4 estados reais |
| `card-detail/card-agent-executor.tsx` | Scrumban nao dispara agentes |
| `card-detail/card-agent-output.tsx` | Output de agente e do projeto |
| `card-detail/card-github-links.tsx` | GitHub e do projeto |
| `intentions/agent-execution-panel.tsx` | Execucao e atomica, sem painel de acompanhamento |
| `intentions/agent-files-list.tsx` | Arquivos gerados sao do projeto |
| `settings/agent-config-page.tsx` | Config de Claude API key pertence ao projeto |
| `lib/hooks/use-agent-worker.ts` | Hook de execucao de agente |
| `lib/hooks/use-ai-agents.ts` | Hook de gestao de agentes |
| `lib/hooks/use-github.ts` | GitHub pertence ao projeto |
| `lib/api/agent-worker.ts`, `ai-agents.ts`, `github.ts`, `automation.ts` | APIs de execucao |
| `lib/mock/` (inteiro) | Dados fake de execucao de agente |
| `lib/stores/board-store.ts` | Estado do board Kanban |

**Componentes a criar:**

| Componente | O que faz |
|-----------|----------|
| `components/intentions/intention-list-view.tsx` | View principal: lista agrupada por status com badges |
| `components/projects/connected-projects.tsx` | Lista de projetos conectados, API keys, throughput |
| `components/projects/activity-timeline.tsx` | Feed de eventos: projeto X completou intencao Y |
| `components/inbox/inbox-page.tsx` | Intencoes de canais nao-estruturados aguardando refinamento |
| `components/settings/channels-config.tsx` | Config de WhatsApp, email, Slack |

### 10.2 scrumban-be (NestJS — backend limpo)

| Aspecto | Valor |
|---------|-------|
| **Total arquivos .ts** | 40 |
| **Total linhas** | 5.028 |
| **Refs Dinpayz** | 0 |
| **Modulos** | auth, orgs, projects, tasks, sprints, dashboards, workflow-statuses, integrations/openai |

Este backend esta proximo do correto. E CRUD limpo. O que falta:

| Adicionar | O que faz |
|-----------|----------|
| Modulo `intentions/` | CRUD de intencoes com 4 estados (substitui "tasks" como unidade principal) |
| Modulo `channels/` | Receber intencoes de WhatsApp, email, Slack |
| Modulo `project-integrations/` | API keys por projeto, webhook subscriptions |
| Endpoints `execute`, `complete`, `fail` | Transicoes atomicas para projetos |
| Metricas de intencao | Cycle time, throughput, Monte Carlo baseados em intencoes |

**Remover:** `integrations/openai` — nao precisa de OpenAI no Scrumban. Se precisar de IA, e para parsing de mensagens (WhatsApp -> intencao), que e um modulo diferente.

### 10.3 Scrumban-Backend (contaminado)

355K linhas, 125 arquivos contaminados com Dinpayz, 30+ modulos irrelevantes. **Abandonar.** Custo de limpeza maior que construir no scrumban-be.

---

## 11. Principios Fundamentais (Regras Inviolaveis)

Estas regras governam TODAS as decisoes de produto e engenharia:

### P1: Scrumban e Passivo, Projetos sao Ativos

O Scrumban NUNCA dispara execucao. Ele armazena intencoes e recebe resultados. Projetos PUXAM trabalho e REPORTAM resultados. Qualquer feature que viole isso esta errada.

### P2: Execucao e Atomica

Do ponto de vista do Scrumban, a execucao dentro do projeto e uma operacao atomica. Entrou "executando", saiu "concluido" ou "falhou". Os estados internos (planning, implementing, reviewing, testing) sao invisiveis e irrelevantes. O Scrumban nao gerencia o loop de correcao do projeto.

### P3: Intent-Driven, Nao Task-Driven

A unidade de trabalho e "intencao" — um documento com problema, solucao, criterios de aceite, e nao-objetivos. Nao e "task", "ticket" ou "story". Inspirado em Shape Up Pitches e Intent-Driven Development.

### P4: 4 Estados, Nao 6 Colunas

Uma intencao tem exatamente 4 estados principais: INBOX, READY, EXECUTING, DONE. Nao existem estados intermediarios de execucao no Scrumban. A interface principal e uma lista com status badges, nao um Kanban board de multiplas colunas.

### P5: Metricas de Fluxo, Nao de Execucao

O Scrumban mede: cycle time, throughput, WIP, Monte Carlo, appetite compliance. O Scrumban NAO mede: tokens, custo de agente, linhas de codigo, build status, sub-estados de execucao.

### P6: API-First

Projetos se conectam via API. Nao existe integracao acoplada. O Scrumban funciona mesmo que o projeto use Claude Code, Copilot, Devin, ou um humano sem IA. Ele e agnostico a como o trabalho e executado.

### P7: Multi-Canal para Entrada, API para Saida

Intencoes entram de qualquer lugar (WhatsApp, email, Slack, web, API). Resultados entram via API dos projetos. O Scrumban e o HUB de intencoes.

### P8: Humano Sempre Refina

Intencoes de canais nao-estruturados (WhatsApp, email) SEMPRE entram como INBOX. Um humano SEMPRE refina antes de disponibilizar. Automacao nao pula o julgamento humano.

### P9: Cada Projeto e Autonomo

O Scrumban nao sabe a stack, os agents, o schema, o CI/CD de nenhum projeto. Cada projeto e uma caixa preta que recebe intencoes e devolve resultados. Isso permite que projetos com stacks completamente diferentes (NestJS, Django, Go) usem o mesmo Scrumban.

---

## 12. Visao de Futuro

### 12.1 MVP (Proximo Passo Imediato)

```
Scrumban como repositorio de intencoes:
  - Lista de intencoes com status badges (view principal)
  - Wizard de intencao (Problema -> Solucao -> Config)
  - Hill Chart para intencoes estrategicas
  - API publica para projetos puxarem/reportarem
  - Dashboard com metricas de fluxo
  - Planning trigger e circuit breaker
```

### 12.2 V2 (Curto Prazo)

```
Multi-canal:
  - WhatsApp webhook com parser IA
  - Email inbound com parser IA
  - Slack bot
  - Notificacoes push para stakeholders
```

### 12.3 V3 (Medio Prazo)

```
Inteligencia sobre intencoes:
  - Deteccao de duplicatas entre intencoes
  - Sugestao de prioridade baseada em historico
  - Agrupamento automatico de intencoes relacionadas
  - Forecasting avancado com contexto de projetos
```

### 12.4 V4 (Longo Prazo)

```
Ecossistema:
  - Marketplace de conectores (GitHub, GitLab, Jira import)
  - SDK para projetos (npm install @scrumban/client)
  - Dashboard cross-projetos para empresas com multiplos repos
  - IA assistiva para PO (sugerir refinamento de intencoes)
```

---

## 13. Referencia Cruzada com Pesquisa

| Conceito Scrumban | Secao da Pesquisa | O Que Diz |
|-------------------|-------------------|-----------|
| Repositorio passivo de intencoes | Parte II (todas Big Techs) | "Sistema de tracking e passivo, time puxa trabalho" |
| Execucao atomica | 4.7 Padrao Orchestrator | "Dev dirige agentes no projeto, despacha e recebe resultados" |
| Lista (nao board) como view principal | 2.8 Tabela Comparativa | "Nenhuma Big Tech usa Kanban board para gestao de alto nivel" |
| Intent-Driven | 4.4 Intent-Driven Development | "Humano declara intencao, agente interpreta e executa" |
| Metricas de fluxo | 8.4 Scrumban, 8.6 NoEstimates | "Cycle time, throughput, Monte Carlo em vez de story points" |
| Hill Charts (refinamento) | 2.6 Shape Up | "Uphill (descoberta) -> topo (clareza) -> downhill (execucao)" |
| Appetite / Circuit Breaker | 2.6 Shape Up | "Appetite =/= estimativa. E budget de tempo fixo." |
| Planning Trigger | 8.4 Scrumban | "Quando Ready < threshold, convocar sessao de refinamento" |
| Multi-canal | 9.3 Recomendacoes | "Comunicacao escrita e assincrona" |
| Projeto executa, nao a plataforma | 9.2 Fluxo Novo | "Agente le codebase, entende arquitetura, entrega PR" |
| Sem sprint/daily/story points | 2.8 Padrao Universal | "Nenhuma Big Tech usa sprint planning, daily, story points" |
| Escrita > Reunioes | 2.8 Padrao Universal | "Docs, RFCs, PR/FAQs substituem planning e refinement" |

---

## 14. Glossario

| Termo | Definicao no Contexto Scrumban |
|-------|-------------------------------|
| **Intencao** | Documento estruturado que descreve um problema a resolver, com solucao proposta, criterios de aceite e nao-objetivos. Substitui "task", "ticket", "story". |
| **Operacao Atomica** | A execucao dentro do projeto, do ponto de vista do Scrumban. O projeto pega a intencao e devolve "concluido" ou "falhou". Os estados internos sao invisiveis. |
| **Projeto** | Um repositorio com codebase, agents proprios e CI/CD. O projeto puxa intencoes do Scrumban e reporta resultados. Caixa preta. |
| **Stakeholder** | Pessoa que cria intencoes (chefe, cliente, PO, dev). Pode ser tecnico ou nao-tecnico. |
| **PO / Tech Lead** | Humano que refina e prioriza intencoes. Move de INBOX para READY. |
| **Orchestrator** | Dev que trabalha dentro do projeto. Puxa intencoes, orquestra agents locais, reporta resultados. |
| **Appetite** | Budget de tempo para uma intencao (em dias). Conceito do Shape Up. Nao e estimativa — e limite. |
| **Circuit Breaker** | Quando appetite e excedido, intencao e sinalizada. Pode ser cancelada ou re-priorizada. |
| **Planning Trigger** | Quando a fila READY cai abaixo do threshold, alerta para sessao de refinamento. |
| **Hill Chart** | Visualizacao de progresso de refinamento: Descoberta (uphill) -> Clareza (topo). A descida e automatica quando o projeto executa e completa. |
| **Deliverable** | O que o projeto entrega ao Scrumban: link do PR, resumo, arquivos alterados. |
| **Canal** | Meio pelo qual intencoes entram no Scrumban: web, API, WhatsApp, email, Slack. |

---

**Qualquer decisao de produto ou engenharia que contradiga estes principios deve ser questionada e justificada.**

---

*Fundamentado em: Pesquisa "O Estado do Scrum, Agile e Desenvolvimento de Software na Era da IA (2025-2026)" — 150+ fontes internacionais e nacionais, dados de 8 Big Techs, frameworks pos-Agile (Shape Up, Scrumban, Intent-Driven, Spec-Driven, Agentic Manifesto).*
