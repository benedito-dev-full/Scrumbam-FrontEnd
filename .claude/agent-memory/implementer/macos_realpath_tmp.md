---
name: macos-realpath-tmp
description: Specs que usam mkdtempSync em /tmp e fazem prefix-check com realpathSync precisam canonicalizar ambos os lados
metadata:
  type: feedback
---

No macOS, `/tmp` é symlink para `/private/tmp`. Se um spec cria dir temp com `mkdtempSync(join(tmpdir(), 'x-'))` e o código sob teste faz `realpathSync(baseDir)` antes de comparar com o path candidato, o prefix-check falha porque um lado tem `/tmp/x-xxx` e o outro `/private/tmp/x-xxx`.

**Why:** Discovered durante implementação de `agent/src/ssh/deploy-key-generator.ts` (plan-2026-05-13 task1 fase 2). Specs em macOS jogavam PATH_ESCAPE quando o slug era válido.

**How to apply:** Sempre que código fizer checagem de "path está sob baseDir" usando `realpathSync`:
- Canonicalize o baseDir com realpath PRIMEIRO.
- Compute o path do arquivo a partir do baseDir CANONICAL (não do baseDir original).
- Aí o `dirname(candidate) === canonicalBase` funciona em macOS e Linux.

```ts
// CORRETO
const baseReal = realpathSync(baseDir);
const candidate = resolvePath(baseReal, slug);
if (dirname(candidate) !== baseReal) throw PATH_ESCAPE;

// ERRADO (falha em macOS)
const candidate = resolvePath(baseDir, slug);
const baseReal = realpathSync(baseDir);
if (dirname(candidate) !== baseReal) throw PATH_ESCAPE;
```
