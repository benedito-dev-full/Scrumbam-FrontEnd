# Changelog - Scrumban Frontend

Todas as mudanças notáveis neste projeto são documentadas neste arquivo.

## [Unreleased]

### Added
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
