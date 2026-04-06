// === Request DTOs (o que o frontend ENVIA) ===

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nome: string; // Nome do admin (backend: "nome", NAO "nomeAdmin")
  email: string;
  senha: string; // PORTUGUES! Backend usa "senha", nao "password"
  nomeOrganizacao: string;
  cpfCnpj?: string; // Opcional
}

export interface RefreshRequest {
  refresh_token: string;
}

// === Response DTOs (o que o backend RETORNA) ===

export interface TokenPair {
  access_token: string;
  refresh_token: string;
}

export interface MemberInfo {
  chave: string;
  nome: string;
  email: string;
  role?: string; // Presente no login, ausente no register (assume 'admin')
}

export interface OrganizationInfo {
  chave: string;
  nome: string;
}

export interface ProjectInfo {
  chave: string;
  nome: string;
}

export interface LoginResponse {
  member: MemberInfo;
  organization: OrganizationInfo | null;
  tokens: TokenPair;
}

export interface RegisterResponse {
  organization: OrganizationInfo;
  member: MemberInfo;
  project: ProjectInfo;
  tokens: TokenPair;
}

export interface RefreshResponse {
  tokens: TokenPair;
}

// === User (estado local no Zustand, montado a partir dos responses) ===

export interface User {
  id: string; // DUserGroup.chave (login credentials)
  entidadeId: string; // DEntidade.chave (identity — usado para comparar membros)
  nome: string; // member.nome
  email: string; // member.email
  role: string; // member.role || 'admin' (register assume admin)
  orgId: string; // organization.chave
  orgNome: string; // organization.nome
}
