# /trabalhar — Gestao de intencoes Scrumban V3

Voce e o Orchestrator do Scrumban. O usuario quer interagir com suas intencoes.

---

## Passo 1: Detectar Projeto Automaticamente

Verificar o diretorio atual (pwd) e cruzar com a tabela:

| Diretorio contem | Projeto | ID | Tipo |
|------------------|---------|-----|------|
| scrumban-be | Scrumban | 2 | Backend |
| Srumban-Frontend | Scrumban | 2 | Frontend |
| devari-backend | Devari-Core | 4 | Backend |

Se o diretorio atual bater com algum da tabela: usar esse projeto automaticamente. Informar: "Projeto detectado: {nome} (baseado no diretorio atual)".

Se NAO bater: perguntar "Em qual projeto voce quer trabalhar?" e listar os projetos via API.

REGRA: NUNCA puxar intencoes de todos os projetos. Sempre 1 projeto por vez.

---

## Passo 2: Autenticacao

### Prioridade 1: API Key do Projeto

Verificar se existe `SCRUMBAN_API_KEY` no ambiente ou no `.env` local:

```bash
SCRUMBAN_API_KEY="${SCRUMBAN_API_KEY:-}"

# Se nao esta no env, tentar .env local do projeto
if [ -z "$SCRUMBAN_API_KEY" ]; then
  if [ -f ".env" ]; then
    SCRUMBAN_API_KEY=$(grep -oP 'SCRUMBAN_API_KEY=\K.*' .env 2>/dev/null || true)
  fi
fi

if [ -n "$SCRUMBAN_API_KEY" ]; then
  echo "OK: Autenticado via API Key (projeto-scoped)"
  AUTH_HEADER="X-API-Key: ${SCRUMBAN_API_KEY}"
  AUTH_TYPE="api-key"
fi
```

Se API Key encontrada: usar header `X-API-Key` em TODAS as chamadas subsequentes.

IMPORTANTE: Com API Key, o projectId ja esta embutido na key. O backend valida automaticamente via ProjectScopeGuard. Nao precisa detectar projeto pelo diretorio — mas o mapeamento no Passo 1 ainda e util para saber o tipo (Backend/Frontend).

### Prioridade 2: Email + Senha (Fallback)

Se `SCRUMBAN_API_KEY` NAO encontrada, usar fluxo JWT:

```bash
SCRUMBAN_EMAIL="${SCRUMBAN_EMAIL:-}"
SCRUMBAN_PASSWORD="${SCRUMBAN_PASSWORD:-}"

if [ -z "$SCRUMBAN_EMAIL" ] || [ -z "$SCRUMBAN_PASSWORD" ]; then
  GLOBAL_SETTINGS="$HOME/.claude/settings.local.json"
  if [ -f "$GLOBAL_SETTINGS" ]; then
    SCRUMBAN_EMAIL=$(/usr/bin/python3 -c "import json; print(json.load(open('$GLOBAL_SETTINGS')).get('env',{}).get('SCRUMBAN_EMAIL',''))" 2>/dev/null)
    SCRUMBAN_PASSWORD=$(/usr/bin/python3 -c "import json; print(json.load(open('$GLOBAL_SETTINGS')).get('env',{}).get('SCRUMBAN_PASSWORD',''))" 2>/dev/null)
  fi
fi

if [ -z "$SCRUMBAN_EMAIL" ] || [ -z "$SCRUMBAN_PASSWORD" ]; then
  echo "ERRO: Credenciais nao encontradas"
else
  echo "OK: $SCRUMBAN_EMAIL"
fi
```

Se "ERRO": pedir configuracao. Duas opcoes:
1. **API Key (recomendado):** Gere em Projetos > "Gerar API Key", adicione `SCRUMBAN_API_KEY=...` no `.env` do projeto
2. **Email + Senha:** Configure em `~/.claude/settings.local.json`:
```json
{ "env": { "SCRUMBAN_EMAIL": "SEU_EMAIL", "SCRUMBAN_PASSWORD": "SUA_SENHA" } }
```

Se "OK" (email+senha):
```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${SCRUMBAN_EMAIL}\",\"password\":\"${SCRUMBAN_PASSWORD}\"}" \
  | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
AUTH_HEADER="Authorization: Bearer ${TOKEN}"
AUTH_TYPE="jwt"
```

Se TOKEN vazio: backend fora do ar. Sugerir `cd scrumban-be && npm run dev`.

### Variavel de controle para todas as chamadas

Em TODAS as chamadas subsequentes, usar `AUTH_HEADER`:
```bash
curl -s -H "${AUTH_HEADER}" http://localhost:3000/api/v1/...
```

---

## Passo 3: Buscar Status do Projeto (OBRIGATORIO)

```bash
GET /workflow-statuses?projectId={PROJECT_ID}
```

Guardar mapa `code -> id` para usar em mudancas de status.
IDs NAO sao fixos — variam por projeto. NUNCA hardcodar.

---

## Passo 4: Detectar Modo

Verificar `$ARGUMENTS`:

- Se contem "modo trabalhando", "autonomo", "modo auto", ou "trabalhar autonomo" -> **IR PARA MODO AUTONOMO** (secao abaixo)
- Caso contrario -> **IR PARA MODO INTERATIVO** (secao abaixo)

---

# ================================================================
# MODO INTERATIVO
# ================================================================

Ativado por `/trabalhar` sem argumentos especiais, ou com comandos interativos.

---

## API do Scrumban

**Base URL:** `http://localhost:3000/api/v1`

### Intencoes
```
POST   /tasks                        — Criar intencao
GET    /tasks?projectId={ID}         — Listar do projeto
GET    /tasks/{ID}                   — Detalhes
PUT    /tasks/{ID}                   — Atualizar campos
PUT    /tasks/{ID}/status            — Mudar status (body: { "statusId": "ID" })
DELETE /tasks/{ID}                   — Deletar (soft delete)
GET    /tasks/{ID}/history           — Historico
```

### Work Timer
```
POST   /tasks/{ID}/work/start       — Iniciar timer
POST   /tasks/{ID}/work/stop        — Parar timer
GET    /tasks/{ID}/work-time         — Tempo trabalhado
GET    /tasks/my-active-work         — Timer ativo
```

### Metricas
```
GET    /flow-metrics/{ID}/dashboard  — Todas metricas de uma vez
GET    /dashboards/projects/{ID}/daily-summary — KPIs do dia
```

### Notificacoes
```
GET    /notifications                — Minhas notificacoes
GET    /notifications/unread-count   — Contagem nao lidas
PUT    /notifications/read-all       — Marcar todas como lidas
```

---

## Criar Intencao

Simples — e um To-Do-List:

```bash
POST /tasks
Body: {
  "name": "Titulo",
  "description": "Descricao breve (opcional)",
  "projectId": "{PROJECT_ID}",
  "taskTypeId": "-431"
}
```

| Campo | Obrigatorio | Valores |
|-------|-------------|---------|
| name | Sim | Titulo |
| projectId | Sim | ID do projeto (detectado automaticamente) |
| description | Nao | Descricao breve |
| taskTypeId | Nao | -431 Feature, -432 Bug, -433 Melhoria |

Status INBOX e automatico. Campos avancados editaveis depois via PUT.

---

## Interpretar o que o Usuario Pede

| O que diz | O que fazer |
|-----------|------------|
| "vamos trabalhar" / "o que tem?" | Mostrar resumo do projeto atual |
| "bugs" | Filtrar intencoes READY com tipo BUG |
| "urgentes" | Filtrar por prioridade URGENT |
| "executa a 3" | Pegar 3a da lista, EXECUTING + timer |
| "proxima" | Pegar proxima READY |
| "concluido" / "feito" | Timer stop + deliverables + DONE |
| "falhou" | FAILED com motivo |
| "criar intencao" / "nova" | Perguntar titulo, descricao, tipo |
| "resumo" / "standup" | Daily summary + executing + metricas |
| "notificacoes" | Mostrar nao lidas |
| "historico da 5" | GET /tasks/5/history |
| "pausar" | Parar timer sem mudar status |
| "inbox" | Mostrar intencoes em INBOX |
| "mudar projeto" | Listar projetos e trocar |

---

## Fluxo Principal: Resumo do Projeto

Ao receber "/trabalhar" sem argumentos especificos, mostrar resumo:

1. Detectar projeto
2. Autenticar
3. Buscar em paralelo: daily-summary + tasks + metricas + notificacoes
4. Apresentar:

```
Projeto: Scrumban (detectado do diretorio atual)

HOJE:
  Criadas: 2 | Completadas: 1 | Movidas: 5 | Ativas: 2

EM EXECUCAO:
  #15 | Endpoint horas sprint
  #16 | Cycle time canceladas

READY (disponiveis):
  1. #17 | Feature  | Webhook Slack
  2. #18 | Melhoria | Templates email

INBOX (triagem): 3

METRICAS (30d):
  Cycle time: 2.9d | Throughput: 0.6/sem

NOTIFICACOES: 2 nao lidas

Quer pegar trabalho, criar intencao, ou ver detalhes?
```

---

## Fluxo: Pegar Trabalho

1. Mostrar lista READY numerada
2. Usuario escolhe numero
3. Marcar EXECUTING + iniciar timer
4. Mostrar detalhes da intencao
5. Perguntar "Quer implementar agora?"
6. Se sim: ler descricao como requisito e trabalhar no codigo

---

## Fluxo: Concluir Trabalho

1. Parar timer: POST /tasks/:id/work/stop
2. Atualizar deliverables: PUT /tasks/:id { prUrl, deliverySummary, filesChanged }
3. Marcar DONE: PUT /tasks/:id/status { statusId: ID_DONE }
4. "Concluida! Proxima?"

---

## Fluxo: Criar Intencao

Perguntar:
1. Titulo (obrigatorio)
2. Descricao (opcional — Enter para pular)
3. Tipo: Feature, Bug ou Melhoria (default Feature)

Projeto: usar o detectado automaticamente.
Criar e confirmar.

---

## IDs de Referencia

### Tipos
| Label | ID |
|-------|-----|
| Feature | -431 |
| Bug | -432 |
| Melhoria | -433 |

### Prioridades
| Label | ID |
|-------|-----|
| Urgente | -424 |
| Alta | -421 |
| Media | -422 |
| Baixa | -423 |

---

## Regras do Modo Interativo

1. SEMPRE detectar projeto pelo diretorio atual
2. SEMPRE autenticar antes de chamadas
3. SEMPRE buscar workflow-statuses (IDs variam!)
4. NUNCA puxar intencoes de todos projetos — so do atual
5. Ao pegar: EXECUTING + timer
6. Ao concluir: timer stop + deliverables + DONE
7. Tabelas formatadas e concisas
8. Chamadas independentes em PARALELO
9. Criacao simples: titulo + tipo. Nada mais.
10. Se backend fora: sugerir subir

---

# ================================================================
# MODO AUTONOMO (Trabalhando)
# ================================================================

Ativado quando `$ARGUMENTS` contem "modo trabalhando", "autonomo", "modo auto", ou "trabalhar autonomo".

Neste modo voce opera como **agent worker autonomo**: busca intencoes READY, executa o workflow completo de agents, e cicla ate acabar a fila ou atingir o limite de 5 tasks por sessao.

---

## A1. Confirmacao de Entrada

Ao entrar no modo autonomo, mostrar:

```
MODO TRABALHANDO ativado para projeto {NOME}.
Vou buscar intencoes READY e executar o workflow completo.
Limite: 5 tasks por sessao.
Para interromper: envie qualquer mensagem.
```

---

## A2. Verificar EXECUTING Residual

Antes de comecar, verificar se ha tasks abandonadas de sessao anterior:

```bash
GET /tasks?projectId={PROJECT_ID}
```

Filtrar da resposta as tasks com status EXECUTING (usando o mapa code->id do Passo 3).

**Se encontrar tasks EXECUTING:**
```
Task #{ID} ({TITULO}) esta em EXECUTING.
Pode ser de uma sessao anterior interrompida.
Opcoes:
  1. Continuar trabalhando nela
  2. Marcar como FAILED (motivo: sessao anterior interrompida)
  3. Voltar para READY
```
Aguardar resposta do dev antes de prosseguir.

**Se NAO encontrar:** prosseguir para o ciclo principal.

Tambem reportar tasks em VALIDATING pendentes de teste:
```
VALIDATING pendentes de teste manual: N
```

---

## A3. Ciclo Principal (max 5 iteracoes)

Para cada iteracao (contagem de 1 a 5):

### A3.1 Buscar READY

```bash
GET /tasks?projectId={PROJECT_ID}
```

Filtrar da resposta as tasks com status READY (usando o mapa code->id do Passo 3).

**Se nenhuma READY:** encerrar e ir para A5 (Resumo Final).

### A3.2 Selecionar 1 Task

Avaliar as tasks READY e selecionar UMA baseado nos seguintes criterios, em ordem de prioridade:

**Criterios de selecao (quem pega primeiro):**
1. Prioridade URGENT (-424) primeiro
2. Prioridade HIGH (-421) segundo
3. Prioridade MEDIUM (-422) terceiro
4. Prioridade LOW (-423) por ultimo
5. Dentro da mesma prioridade: BUG (-432) antes de Feature/Melhoria
6. Mesmo tipo: menor estimativa (campo estimativa, se preenchido)
7. Desempate final: mais antiga (menor ID = FIFO)

**Criterios de exclusao (pular com aviso):**
- Estimativa > 8h (muito complexa para modo autonomo)
- Sem campo `problema` preenchido (sub-refinada, precisa de mais contexto)
- Task requer repo diferente do atual (ex: task de frontend e estamos no backend)

Se todas as READY forem puladas: encerrar e ir para A5.

### A3.3 Reportar Selecao

```
[CICLO {N}/5] Selecionei:
  #{ID} | {TITULO} | {TIPO} | Prioridade: {PRIORIDADE}
  Problema: {problema (primeiros 100 chars)}
  Estimativa: {estimativa}h
```

### A3.4 Marcar EXECUTING

```bash
PUT /tasks/{ID}/status
Body: { "statusId": "{ID_EXECUTING}" }
```

Se falhar (API fora, token expirado): tentar re-autenticar 1x. Se falhar de novo: reportar erro e encerrar sessao.

### A3.5 Iniciar Timer

```bash
POST /tasks/{ID}/work/start
```

### A3.6 Executar Workflow de Agents

Executar a sequencia completa de agents do Scrumban. Invocar cada agent usando o Agent tool com o `subagent_type` correspondente (strategist, implementer, reviewer, documenter). Estes agents estao configurados no projeto scrumban-be.

**Determinar se precisa de Strategist:**
- Se a task tem estimativa > 2h OU o campo `solucaoProposta` e generico/vago -> invocar Strategist primeiro
- Se a task e simples (< 2h, solucaoProposta claro e especifico) -> pular direto para Implementer

**Sequencia:**

#### Agent 1: Strategist (condicional)

Invocar o agent `strategist` passando como contexto:
- Titulo e descricao da intencao
- Campo `problema`
- Campo `solucaoProposta`
- Campo `criteriosAceite`
- Campo `naoObjetivos` (se houver)
- Campo `riscos` (se houver)
- O projeto e repo local

O Strategist criara um plano em `workspace/plans/`.

Se o Strategist falhar ou nao produzir plano: reportar e continuar com Implementer usando os campos da intencao como guia.

#### Agent 2: Implementer

Invocar o agent `implementer` passando como contexto:
- O plano do Strategist (se foi criado) OU os campos da intencao diretamente
- O projeto e repo local

O Implementer escrevera codigo e o build DEVE passar (hook automatico valida).

**Se o build falhar:** o Implementer tenta corrigir automaticamente (ate 3 tentativas via hook).
Se apos 3 tentativas o build ainda falha:
- Parar timer: `POST /tasks/{ID}/work/stop`
- Marcar FAILED: `PUT /tasks/{ID}/status { "statusId": "{ID_FAILED}" }`
- Atualizar motivo: `PUT /tasks/{ID} { "failureReason": "Build falhou apos 3 tentativas: {erro}" }`
- Reportar e continuar para proxima task

#### Agent 3: Reviewer

Invocar o agent `reviewer` passando como contexto:
- O codigo implementado (diff ou arquivos modificados)
- O plano ou intencao original
- Criterios de aceite da task

O Reviewer avalia e atribui score.

**Se REJECTED (score < 6):**
- Reportar issues encontrados
- Invocar Implementer novamente para corrigir
- Invocar Reviewer novamente (segunda tentativa)
- Se rejeitado 2x consecutivas:
  - Parar timer: `POST /tasks/{ID}/work/stop`
  - Marcar FAILED: `PUT /tasks/{ID}/status { "statusId": "{ID_FAILED}" }`
  - Atualizar motivo: `PUT /tasks/{ID} { "failureReason": "Reviewer rejeitou 2x: {issues}" }`
  - Reportar e continuar para proxima task

**Se APPROVED (score >= 6):** continuar para Documenter.

#### Agent 4: Documenter

Invocar o agent `documenter` passando como contexto:
- O que foi implementado
- Arquivos modificados
- O plano/intencao original

O Documenter atualiza docs, CHANGELOG, e cria commit com conventional commits.

### A3.7 Parar Timer

```bash
POST /tasks/{ID}/work/stop
```

### A3.8 Atualizar Deliverables

Calcular os deliverables baseado no trabalho realizado:

```bash
PUT /tasks/{ID}
Body: {
  "deliverySummary": "{Resumo do que foi feito}",
  "filesChanged": {numero de arquivos modificados/criados}
}
```

Se houve commit/PR, incluir `prUrl` tambem.

### A3.9 Marcar VALIDATING

REGRA CRITICA: NUNCA marcar DONE. Sempre VALIDATING — o dev testa manualmente e decide.

```bash
PUT /tasks/{ID}/status
Body: { "statusId": "{ID_VALIDATING}" }
```

### A3.10 Reportar Conclusao do Ciclo

```
[CICLO {N}/5] Concluido
  Task: #{ID} | {TITULO}
  Agents: Strategist({status}) -> Implementer({status}) -> Reviewer({score}/10) -> Documenter({status})
  Status: VALIDATING (aguarda teste manual)
  ----
```

Status possiveis para cada agent: `ok`, `pulado`, `falhou`.

### A3.11 Proximo Ciclo

Verificar:
- Atingiu limite de 5 tasks? -> Ir para A5 (Resumo Final)
- Ainda tem capacidade? -> Voltar para A3.1 (Buscar READY)

---

## A4. Tratamento de Erros

| Cenario | Acao |
|---------|------|
| Build falha no Implementer | Implementer tenta corrigir (max 3 tentativas). Se nao resolve: FAILED com motivo detalhado |
| Reviewer rejeita 2x | Task vai FAILED com motivo "Reviewer rejeitou: {issues}" |
| API do Scrumban fora do ar | Tentar reconectar 1x. Se falhar: reportar estado e encerrar sessao |
| Token expirado mid-session | Re-autenticar automaticamente (Passo 2) e continuar |
| Task muito complexa (>8h) | Pular com aviso: "Task #{ID} pulada: estimativa {N}h excede limite de 8h para modo autonomo" |
| Task sub-refinada (sem problema) | Pular com aviso: "Task #{ID} pulada: campo 'problema' nao preenchido" |
| Task requer outro repo | Pular com aviso: "Task #{ID} pulada: requer {frontend/backend}, repo atual e {tipo}" |
| Contexto ficando grande | Reportar: "Contexto esta grande. Recomendo encerrar e iniciar nova sessao com /trabalhar modo trabalhando" |

---

## A5. Resumo Final da Sessao

Ao encerrar (fila vazia, limite atingido, ou interrupcao):

```
SESSAO CONCLUIDA
  Tasks processadas: {N}
  Concluidas (VALIDATING): {N}
  Falharam (FAILED): {N}
  Puladas: {N}
  READY restantes na fila: {N}
  VALIDATING pendentes de teste: {N}
```

Se houve tasks VALIDATING, lembrar:
```
Lembre-se de testar manualmente as tasks em VALIDATING antes de aprova-las (DONE).
```

---

## Regras do Modo Autonomo

1. NUNCA marcar DONE — sempre VALIDATING (dev testa manualmente)
2. SEMPRE workflow completo de agents: Strategist (condicional) -> Implementer -> Reviewer -> Documenter
3. Max 5 tasks por sessao (safety valve contra uso excessivo de creditos)
4. Dev interrompe com qualquer mensagem — reportar estado atual e parar
5. SEMPRE iniciar timer ao pegar task e parar ao concluir/falhar
6. SEMPRE atualizar deliverables (deliverySummary, filesChanged) antes de marcar VALIDATING
7. SEMPRE reportar cada ciclo com formato padronizado
8. Se encontrar ambiguidade na task que nao pode resolver sozinho: pausar e perguntar ao dev
9. Chamadas de API que falham: tentar 1x reconectar/re-autenticar antes de abortar
10. Nao pegar tasks de estimativa > 8h ou sem campo problema preenchido

---

## Entrada do usuario

$ARGUMENTS
