// Tipos do modulo Times — espelham backend `/api/v1/teams*`
// Backend: src/teams/ (Scrumbam-Backend), schema DEntidade idClasse=-460

export type TeamMemberRole = "ADMIN" | "MEMBER" | "VIEWER";

/**
 * Time da organizacao. Backend retorna `canEdit`/`canDelete` precomputados
 * baseado no role do usuario logado — o frontend NAO recalcula RBAC.
 */
export interface Team {
  id: string;
  name: string;
  /** Prefixo de issue (ex: "DEV"). 2-6 caracteres maiusculos. */
  key: string;
  /** Cor hex (#RRGGBB) ou null. Usada no avatar quadrado da sidebar. */
  color: string | null;
  /** Nome do icone Lucide (opcional). */
  icon: string | null;
  organizationId: string;
  /** Sequencia atual de identifier publico (ex: DEV-7). */
  lastIssueSeq: number;
  memberCount: number;
  createdAt: string;
  /** RBAC: pode editar este time? (calculado pelo backend) */
  canEdit: boolean;
  /** RBAC: pode deletar este time? (calculado pelo backend) */
  canDelete: boolean;
}

export interface TeamMember {
  userId: string;
  name: string;
  email?: string | null;
  cargo: TeamMemberRole;
  joinedAt: string;
}

// === DTOs (request bodies) ===

export interface CreateTeamDto {
  name: string;
  key: string;
  color?: string | null;
  icon?: string | null;
}

export interface UpdateTeamDto {
  name?: string;
  key?: string;
  color?: string | null;
  icon?: string | null;
}

export interface AddTeamMemberDto {
  userId: string;
  cargo?: TeamMemberRole;
}

export interface UpdateTeamMemberRoleDto {
  cargo: TeamMemberRole;
}
