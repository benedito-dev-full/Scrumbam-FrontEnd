---
name: Decisoes UX Polish task01 (Frontend)
description: Decisoes tipograficas e de componentes tomadas no plan-frontend-ux-polish-task01.md (2026-05-07) — sao norte para futuras mudancas frontend
type: project
---

Decisoes autonomas tomadas no plan UX Polish (Fases A-D), 2026-05-07. Aplicaveis a qualquer task frontend futura.

**Why:** O dev relatou fontes pequenas, botoes mal estilizados e fluxo rigido apos validar Automation. Auditoria de 11 arquivos confirmou 35 problemas concretos (uso ad-hoc de text-[Npx], H1 das paginas em 13px, botao primario indistinguivel do secundario, etc.).

**How to apply:** Em qualquer task frontend nova, considerar essas decisoes como o canone atual.

## Decisoes-chave

1. **Body em 14px (text-sm), nao 13px**
   - globals.css ganha `body { font-size: 14px; line-height: 1.5; }`
   - Afasta-se ligeiramente de Linear-puro (13px), mas Linear 2026 tambem usa 14px
   - Ganho de legibilidade > densidade ultra-extrema

2. **Sistema tipografico de 6 niveis canonicos:**
   - `display` (text-2xl 24px) — heros
   - `title` (text-lg font-semibold 18px) — H1 padrao de pagina
   - `subtitle` (text-base font-semibold 16px) — H2 de secao
   - `body` (text-sm 14px) — corpo padrao
   - `label` (text-xs 12px) — labels, badges, headers de coluna
   - `meta` (text-[11px] muted-foreground) — timestamps, helpers
   - **Eliminar text-[13px] e text-[15px]** — sao limbo

3. **Cards e PageHeader sempre via componente:**
   - Proibido `rounded-md border bg-card` ad-hoc
   - Criar `src/components/ui/card.tsx` (shadcn) e `src/components/common/page-header.tsx`
   - Padronizar altura header (h-14, 56px) e padding (px-6)

4. **Botoes — variants padronizados (nao criar novos):**
   - default (primary) — 1 acao primaria por tela
   - outline — secundarios multiplos (toolbar)
   - ghost — icon-buttons, navegacao
   - destructive — destrutivo (NAO ghost+text-destructive)
   - Adicionar prop `loading` em button.tsx (helper centralizado)

5. **Atalhos de teclado:** `?` abre cheat-sheet (NOVO). Cmd+K e C ja existem. Esc e Enter auditar.

6. **Mobile e Settings ficam para planos futuros** (Fases E e F do plan task01). Nao incluir em task atual sem replanejamento.

7. **PRs incrementais:** Cada uma das 4 fases (A, B, C, D) e mergeavel sozinha. Nao tentar big-bang.

## Anti-padroes documentados (evitar daqui em diante)

- `<h1 className="text-[13px]">` em pagina (encontrado em 4 paginas)
- `<Button variant="ghost" className="text-destructive">` para destrutivo (deve ser `variant="destructive"` ou `variant="outline"` com border destrutiva)
- `<Button className="text-[12px]">` override (sintoma de desuso de variants)
- Botao primario com `size="sm"` quando e a CTA principal da tela (perde hierarquia)
- Tooltips via `title=""` HTML em vez de `<Tooltip>` shadcn
- Skeleton com `bg-muted rounded animate-pulse` ad-hoc (usar `<Skeleton>` shadcn)
- Confirmar acao critica (executar IA) com dialog vazio (mostrar branch, path, timeout)

## KPIs de validacao

```bash
# Antes de qualquer fase, rodar e contar:
rg "text-\[1[0-5]px\]" src/ -c | wc -l   # ~80 antes, meta <10
rg "h-1 font-medium" src/                 # h1 minusculos
rg "Button.*text-\[12px\]" src/           # overrides de botao
```
