# PLANO DETALHADO - Task 13: Limpeza de dados mock residuais no frontend

**Criado por:** Strategist Agent
**Data:** 2026-04-07
**Modulo:** common (frontend)
**Estimativa Total:** 15min
**Principios V3 Impactados:** Nenhum (housekeeping)

---

## 0. Triagem de Clareza

Intencao avaliada como CLARA — todos criterios atendidos:
- C1: Problema definido (arquivos mock inflam bundle)
- C2: Escopo delimitado (encontrar e deletar mocks nao usados)
- C3: Modulo identificavel (src/lib/mock/)
- C4: Sem ambiguidade critica

---

## 1. Analise

### Contexto
O frontend foi desenvolvido inicialmente com dados mock para prototipagem rapida. Agora que todas as telas consomem a API real, os arquivos mock sao peso morto.

### Estado Atual — Resultado da Investigacao

**Arquivos mock encontrados (2 arquivos):**

| Arquivo | Localizacao | Conteudo |
|---------|-------------|----------|
| `intentions-data.ts` | `src/lib/mock/` | ~820 linhas, MOCK_INTENTIONS + helpers |
| `activity-events-data.ts` | `src/lib/mock/` | Tamanho medio, MOCK_ACTIVITY_EVENTS |

**Resultado da busca de referencias:**

- `grep` por `intentions-data`, `activity-events-data`, `MOCK_INTENTIONS`, `MOCK_ACTIVITY_EVENTS`, `MOCK_PROJECTS`, `lib/mock`, `"mock"` em todo `src/`: **ZERO imports encontrados**
- Nenhum componente, hook, pagina ou adapter importa esses arquivos
- Nenhum teste no projeto frontend (nao ha `__tests__/` nem `*.test.*` em `src/`)
- Unica referencia externa: `docs/PRD-SCRUMBAN-V3-REFACTORING.md` (documentacao, nao codigo)

**Conclusao:** Arquivos sao 100% dead code. Podem ser deletados sem risco.

### Principios V3 Relevantes
Engine N/A — dominio agil, Prisma direto correto. Task de housekeeping frontend, sem impacto em principios V3.

---

## 2. Abordagem Escolhida

### Solucao
Deletar o diretorio `src/lib/mock/` inteiro (2 arquivos). Nenhuma correcao de import necessaria pois nenhum arquivo os referencia.

### Justificativa
- Zero referencias em codigo = zero risco de quebra
- Reduz bundle size (~820+ linhas de JS removidas)
- Elimina confusao para devs novos
- Diretorio `src/lib/mock/` fica vazio apos remocao, entao deletar o diretorio todo

### Alternativas Consideradas
1. **Mover para `__mocks__/` para uso futuro em testes** — Rejeitada. Testes futuros (P3-T13) devem usar mocks especificos por componente, nao dados globais gigantes.
2. **Manter e documentar como "exemplo"** — Rejeitada. Dados mock de 820 linhas nao servem como documentacao util.

---

## 3. Avaliacao de Pilares

### Pilar 1: Engine — N/A (dominio agil, frontend)
### Pilar 2: Endpoints Genericos — N/A (nao cria endpoints)
### Pilar 3: Seed de Classes — N/A (nao afeta seed)

---

## 4. Estrutura Tecnica

### Arquivos a Deletar
```
src/lib/mock/intentions-data.ts    (DELETAR)
src/lib/mock/activity-events-data.ts (DELETAR)
src/lib/mock/                       (DELETAR diretorio se vazio)
```

### Arquivos a Modificar
Nenhum. Zero imports para limpar.

### Verificacao Pos-Delecao
- `npm run build` deve passar sem erros
- Nenhum `import` quebrado

---

## 5. Plano de Implementacao (Fases)

### Fase Unica (~15min)

| Step | Acao | Tempo |
|------|------|-------|
| 1 | Deletar `src/lib/mock/intentions-data.ts` | 1min |
| 2 | Deletar `src/lib/mock/activity-events-data.ts` | 1min |
| 3 | Deletar diretorio `src/lib/mock/` se vazio | 1min |
| 4 | Rodar `npm run build` para confirmar zero quebras | 3min |
| 5 | Verificar se `src/lib/` esta vazio e pode ser removido tambem | 1min |
| 6 | Commit | 2min |

---

## 6. Estimativa de Tempo

| Fase | Tempo |
|------|-------|
| Delecao + build | 10min |
| Buffer 20% | 2min |
| **Total** | **12min** |

---

## 7. Riscos e Mitigacoes

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|---------------|---------|-----------|
| Componente com import dinamico nao detectado pelo grep | Muito Baixa | Alto | Build vai falhar e indicar exatamente onde |
| Diretorio lib/ tem outros arquivos uteis | Baixa | Nenhum | Verificar conteudo de lib/ antes de deletar |

---

## 8. Criterios de Sucesso

- [MUST] Arquivos `intentions-data.ts` e `activity-events-data.ts` removidos
- [MUST] `npm run build` passa sem erros
- [MUST] Zero imports quebrados
- [SHOULD] Diretorio `src/lib/mock/` removido
- [COULD] Diretorio `src/lib/` removido se vazio

---

**Handoff para Implementer:**

Task trivial. Executar:
1. `rm -rf src/lib/mock/`
2. Verificar se `src/lib/` tem outros arquivos — se vazio, deletar tambem
3. `npm run build` para confirmar
4. Commit: `chore(common): remove arquivos mock residuais nao utilizados`

Nenhuma logica precisa ser alterada. A investigacao ja confirmou zero referencias em todo o codebase.
