# Changelog - Scrumban Frontend

Todas as mudanças notáveis neste projeto são documentadas neste arquivo.

## [Unreleased]

### Added
- **Security Headers** — Proteção contra ataques comuns
  - X-Frame-Options: DENY (previne clickjacking)
  - X-Content-Type-Options: nosniff (previne MIME-type sniffing)
  - X-XSS-Protection: 1; mode=block (proteção XSS adicional)
  - Referrer-Policy: strict-origin-when-cross-origin (controla informações de referência)
  - Permissions-Policy: desabilita camera, microphone, geolocation (reduz superfície de ataque)

- **Standalone Output** — Configuração para containerização Docker
  - Suporte a build standalone para deployment em containers

### Changed
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
