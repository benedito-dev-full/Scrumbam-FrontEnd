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

// === Response DTOs (o que o backend RETORNA) ===

/**
 * Login response — JWT e setado como cookie httpOnly pelo backend.
 * Body retorna apenas dados do usuario.
 */
export interface LoginResponse {
  user: {
    id: string;
    entidadeId: string | null;
    name: string;
    email: string;
    organizationId: string;
    organizationName: string | null;
    role: string;
  };
}

export interface MemberInfo {
  chave: string;
  nome: string;
  email: string;
  role?: string;
}

export interface OrganizationInfo {
  chave: string;
  nome: string;
}

/**
 * Register response — JWT e setado como cookie httpOnly pelo backend.
 * Body retorna organization e member (sem tokens).
 */
export interface RegisterResponse {
  organization: OrganizationInfo;
  member: MemberInfo;
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
