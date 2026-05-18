/**
 * Decodifica o payload de um JWT (base64url do segmento do meio).
 *
 * NUNCA usar para validar o token — apenas para LEITURA de claims que
 * o backend ja autorizou. Para validacao real, o backend e o unico
 * dono da chave de assinatura.
 *
 * Retorna null em qualquer falha (token mal formado, base64 invalido,
 * JSON quebrado) — call site decide o fallback.
 */
export interface JwtPayload {
  sub?: string; // DUserGroup.chave (id de login)
  entidadeId?: string; // DEntidade.chave (identidade real para FKs)
  email?: string;
  organizationId?: string;
  iat?: number;
  exp?: number;
}

function base64UrlDecode(input: string): string | null {
  try {
    // base64url -> base64
    const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
    // pad
    const pad = normalized.length % 4;
    const padded = pad === 0 ? normalized : normalized + "=".repeat(4 - pad);
    if (typeof atob === "function") {
      return atob(padded);
    }
    // Node fallback (usado em testes / SSR)
    return Buffer.from(padded, "base64").toString("utf8");
  } catch {
    return null;
  }
}

export function decodeJwt(token: string | null | undefined): JwtPayload | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const decoded = base64UrlDecode(parts[1]);
  if (!decoded) return null;
  try {
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Extrai entidadeId do JWT, com fallbacks na ordem mais segura:
 * 1. entidadeId explicito no JWT (V2 — fonte autoritativa)
 * 2. sub do JWT (fallback legado quando claim ausente)
 * 3. null
 */
export function getEntidadeIdFromToken(
  token: string | null | undefined,
): string | null {
  const payload = decodeJwt(token);
  if (!payload) return null;
  return payload.entidadeId || payload.sub || null;
}
