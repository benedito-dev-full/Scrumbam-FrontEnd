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

// === Response DTOs (o que o backend RETORNA) ===

export interface UserProfile {
  id: string;
  entidadeId: string | null;
  name: string;
  email: string;
  organizationId?: string;
  organizationName?: string | null;
  role?: string;
  orgRole?: string;
}

/**
 * Backend AuthResponseDto — retornado por /auth/login, /auth/register e /auth/refresh.
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

// === User (estado local no Zustand, montado a partir dos responses) ===

export interface User {
  id: string; // DUserGroup.chave (login credentials)
  entidadeId: string; // DEntidade.chave (identity — usado para comparar membros)
  nome: string; // member.nome
  email: string; // member.email
  role: string; // member.role || 'admin' (register assume admin)
  orgId: string; // organization.chave
  orgNome: string; // organization.nome
  onboardingCompleted?: boolean; // true se usuario ja completou o onboarding
}
