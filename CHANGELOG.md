# Changelog - Scrumban Frontend

Todas as mudanças notáveis neste projeto são documentadas neste arquivo.

## [Unreleased]

### Added
- **Error Pages Customizadas** — Tratamento visual de erros (Task [MEDIUM])
  - `not-found.tsx` (404) — Server component, layout centered, Button Link Next.js
  - `error.tsx` (500) — Client component, useEffect para logging, botões Tentar/Voltar
  - `global-error.tsx` (erro no layout raiz) — Client component, html/body próprios, design minimal hardcoded
  - WCAG AA compliant (contrast ratios, keyboard accessible)
  - Score: 8.5/10

- **Session Expiration Toast** — Feedback visual ao logout por 401
  - Toast warning "Sessão expirada. Faça login novamente." por 6 segundos
  - Melhora UX ao interceptar respostas 401 (exceto rotas auth)
  - Zero dependências novas (usa `sonner` existente)

- **Security Headers** — Proteção contra ataques comuns
  - X-Frame-Options: DENY (previne clickjacking)
  - X-Content-Type-Options: nosniff (previne MIME-type sniffing)
  - X-XSS-Protection: 1; mode=block (proteção XSS adicional)
  - Referrer-Policy: strict-origin-when-cross-origin (controla informações de referência)
  - Permissions-Policy: desabilita camera, microphone, geolocation (reduz superfície de ataque)

- **Standalone Output** — Configuração para containerização Docker
  - Suporte a build standalone para deployment em containers

### Changed
- `src/lib/api/client.ts` — Response interceptor adiciona toast ao deslogar
- `next.config.ts` — Adicionada função `headers()` para retorno de security headers globais

---

## Template

### Fixed
- **Description** (Task [N])
  - Details

### Changed
- **Description** (Task [N])
  - Details

### Added
- **Description** (Task [N])
  - Details
