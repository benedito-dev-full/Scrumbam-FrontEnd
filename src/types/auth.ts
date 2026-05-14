// === Request DTOs (o que o frontend ENVIA) ===

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  organizationName?: string;
}

export interface SwitchOrgRequest {
  organizationId: string;
}

// === Response DTOs (o que o backend RETORNA) ===

/**
 * Resumo de uma organização à qual o usuário tem vínculo ativo
 * (ADR-V2-030 — Multi-tenant identity).
 *
 * Populado em `auth.user.availableOrgs[]` no login, register, refresh,
 * `/auth/me` e `/auth/switch-org`. O frontend usa para renderizar o
 * workspace switcher na sidebar e auto-resolver "última org usada" via
 * `localStorage['scrumban-last-org']`.
 */
export interface AvailableOrg {
  id: string;
  nome: string;
  role: "ADMIN" | "MEMBER" | "VIEWER";
}

export interface UserProfile {
  id: string;
  entidadeId: string | null;
  name: string;
  email: string;
  organizationId?: string;
  organizationName?: string | null;
  role?: string;
  orgRole?: string;
  /** Lista de orgs com vínculo ativo do usuário (ADR-V2-030). */
  availableOrgs?: AvailableOrg[];
  /**
   * Estado órfão (ADR-V2-038). `true` quando o usuário não está em
   * nenhuma workspace ativa — JWT válido sem `organizationId`.
   */
  isOrphan?: boolean;
}

/**
 * Backend AuthResponseDto — retornado por /auth/login, /auth/register,
 * /auth/refresh e /auth/switch-org.
 */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: "Bearer";
  user: UserProfile;
}

export type LoginResponse = AuthResponse;
export type RegisterResponse = AuthResponse;
export type SwitchOrgResponse = AuthResponse;

// === User (estado local no Zustand, montado a partir dos responses) ===

export interface User {
  id: string; // DUserGroup.chave (login credentials)
  entidadeId: string; // DEntidade.chave (identity — usado para comparar membros)
  nome: string; // member.nome
  email: string; // member.email
  role: string; // member.role || 'admin' (register assume admin)
  orgId: string; // organization.chave
  orgNome: string; // organization.nome
  /**
   * Lista de orgs disponíveis (ADR-V2-030). Default `[]`.
   *
   * Quando length > 1, a sidebar renderiza o workspace switcher.
   * Quando length <= 1, mostra apenas o nome da org atual (sem dropdown).
   */
  availableOrgs: AvailableOrg[];
  /**
   * Estado órfão (ADR-V2-038). `true` quando o usuário não está em
   * nenhuma workspace ativa. Renderização condicional na sidebar
   * (esconder switcher, esconder tenant-scoped routes) e middleware
   * de redirect para `/orphan`.
   */
  isOrphan?: boolean;
}
