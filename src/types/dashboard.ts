// Dashboard types -- aligned with backend DTOs (real contracts)
// Backend: Scrumban-Backend/src/scrumban/dashboard/dto/

export interface StatusCount {
  statusId: string;
  statusNome: string;
  count: number;
}

export interface MemberCount {
  memberId: string;
  memberNome: string;
  count: number;
}

export interface Velocity {
  tasksCompletedLast7Days: number;
}

export interface TeamDashboard {
  tasksByStatus: StatusCount[];
  tasksByMember: MemberCount[];
  velocity: Velocity;
  totalTasks: number;
}

export interface MemberDashboard {
  memberId: string;
  memberNome: string;
  tasksByStatus: StatusCount[];
  tasksCompletedLast30Days: number;
  totalTasks: number;
}

export interface ProjectProgress {
  projectId: string;
  projectNome: string;
  totalTasks: number;
  todo: number;
  doing: number;
  done: number;
  percentConcluido: number;
}

export interface CompanyOverview {
  totalProjetos: number;
  totalTasks: number;
  totalTodo: number;
  totalDoing: number;
  totalDone: number;
  projetos: ProjectProgress[];
}
