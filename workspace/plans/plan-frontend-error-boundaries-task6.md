# PLANO DETALHADO - Task 6: Error Boundaries e Paginas de Erro (Next.js)

**Criado por:** Strategist Agent
**Data:** 2026-04-07
**Modulo:** frontend (src/app)
**Estimativa Total:** 30min
**Principios V3 Impactados:** Nenhum (frontend-only, UX)

---

## 0. Triagem de Clareza

Intencao avaliada como CLARA — todos criterios atendidos (C1-C4).

**Estado atual descoberto:** Ja existem 3 dos 4 arquivos pedidos:
- `src/app/error.tsx` — error boundary raiz (existe, bem feito)
- `src/app/not-found.tsx` — 404 global (existe, bem feito)
- `src/app/global-error.tsx` — fallback fatal (existe, bem feito)
- `src/app/(app)/error.tsx` — **NAO EXISTE** (unico gap real)

## 1. Analise

### Contexto
O frontend ja possui error boundaries na raiz. O problema real e que quando um erro ocorre dentro do grupo `(app)/`, o `error.tsx` raiz captura o erro mas **perde o layout** (sidebar + header desaparecem). O usuario ve uma pagina full-screen de erro sem contexto de navegacao.

### Estado Atual
| Arquivo | Existe | Qualidade |
|---------|--------|-----------|
| `src/app/error.tsx` | Sim | Bom — "use client", reset, link home, digest |
| `src/app/not-found.tsx` | Sim | Bom — 404, link home |
| `src/app/global-error.tsx` | Sim | Bom — fallback com html/body proprio |
| `src/app/(app)/error.tsx` | **NAO** | Gap — erros na area autenticada perdem layout |

### Principios V3 Relevantes
Nenhum diretamente — task e puramente frontend UX.

## 2. Abordagem Escolhida

### Solucao
Criar `src/app/(app)/error.tsx` que renderiza **dentro do layout do (app)/** — preservando sidebar e header. O usuario ve o erro na area de conteudo, com botoes para tentar novamente ou navegar.

### Justificativa
- Unico arquivo faltante que gera impacto real
- Os 3 arquivos existentes ja atendem os requisitos 1, 2, 5 e 6 da task
- Criar o error.tsx no grupo (app) atende requisito 3

### Alternativas Consideradas
1. **Reescrever todos os 4 arquivos** — Rejeitada. Os existentes ja estao bons, usar shadcn/ui Button, design alinhado com dark theme.
2. **Apenas criar (app)/error.tsx** — Escolhida. Unico gap real.

## 3. Avaliacao de Pilares

### Pilar 1: Engine — N/A (frontend)
### Pilar 2: Endpoints Genericos — N/A (frontend)
### Pilar 3: Seed de Classes — N/A (frontend)

## 4. Estrutura Tecnica

### Arquivos a Criar
| Arquivo | Proposito |
|---------|-----------|
| `src/app/(app)/error.tsx` | Error boundary para area autenticada (preserva layout) |

### Arquivos Existentes (sem alteracao necessaria)
- `src/app/error.tsx` — ja atende requisitos 1 e 5
- `src/app/not-found.tsx` — ja atende requisitos 2 e 6
- `src/app/global-error.tsx` — fallback fatal ok

### Design do (app)/error.tsx
- `"use client"` obrigatorio (Next.js error boundary)
- Renderiza DENTRO do layout (app) — sidebar e header permanecem
- Icone visual de erro (usar emoji ou SVG inline, sem dependencia)
- Botao "Tentar novamente" (chama `reset()`)
- Botao "Voltar ao dashboard" (link para `/dashboard`)
- Exibe `error.digest` quando disponivel (debug)
- Cores: usa classes Tailwind do tema (bg-muted/20, text-foreground, etc.)
- Usa `Button` de `@/components/ui/button`

## 5. Plano de Implementacao (Fases)

### Fase Unica (~30min)

**Passo 1:** Criar `src/app/(app)/error.tsx`
```
- "use client"
- Props: { error: Error & { digest?: string }, reset: () => void }
- useEffect para console.error
- Layout: flex column centralizado na area de conteudo (nao full-screen)
- Botao primario: "Tentar novamente" (onClick={reset})
- Botao outline: "Ir para o dashboard" (Link href="/dashboard")
- Codigo digest em text-xs quando disponivel
```

**Passo 2:** Verificar build
```bash
cd /Users/devaritecnologia/Documents/Benedito/Scrumbam-FrontEnd
npm run build
```

## 6. Estimativa de Tempo

| Fase | Tempo |
|------|-------|
| Criar (app)/error.tsx | 15min |
| Verificar build | 5min |
| Buffer 20% | 5min |
| **Total** | **25min** |

## 7. Riscos e Mitigacoes

| Risco | Probabilidade | Mitigacao |
|-------|--------------|-----------|
| Error boundary nao captura erros de server components | Baixa | Next.js App Router propaga automaticamente |
| Layout nao renderiza quando error.tsx ativa | Baixa | Por design do Next.js, error.tsx no mesmo nivel renderiza dentro do layout pai |

## 8. Criterios de Sucesso

- [ ] `src/app/(app)/error.tsx` existe com "use client"
- [ ] Erro na area autenticada mostra sidebar + header + mensagem de erro
- [ ] Botao "Tentar novamente" funciona (chama reset)
- [ ] Botao de navegacao leva ao dashboard
- [ ] Build passa sem erros
- [ ] Design consistente com dark theme

---

**Handoff para Implementer:**
Criar apenas `src/app/(app)/error.tsx`. Os outros 3 arquivos (error.tsx raiz, not-found.tsx, global-error.tsx) ja existem e estao adequados. O novo arquivo deve seguir o mesmo padrao visual dos existentes, mas renderizar dentro da area de conteudo do layout (app) — sem ser full-screen. Usar `Button` de `@/components/ui/button` e classes Tailwind do tema.
