/**
 * Adapter: Backend Dashboard responses -> Frontend Dashboard types
 *
 * Maps the backend dashboard responses (which may use English field names
 * like userId/userName or statusId/statusName) to the frontend types
 * (which use memberId/memberNome, statusId/statusNome).
 *
 * Accepts BOTH formats gracefully -- if data already comes in the
 * correct format, it passes through.
 */

import type {
  TeamDashboard,
  MemberDashboard,
  CompanyOverview,
  StatusCount,
  MemberCount,
  ProjectProgress,
} from "@/types/dashboard";

// ============================================================
// Sub-mappers
// ============================================================

/**
 * Maps a status count item from backend to frontend format.
 * Backend may return statusId/statusName or statusId/statusNome.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapStatusCount(raw: any): StatusCount {
  return {
    statusId: String(raw.statusId ?? raw.id ?? ""),
    statusNome: String(
      raw.statusNome ?? raw.statusName ?? raw.nome ?? raw.name ?? "",
    ),
    count: Number(raw.count ?? raw.total ?? 0),
  };
}

/**
 * Maps a member count item from backend to frontend format.
 * Backend may return userId/userName instead of memberId/memberNome.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapMemberCount(raw: any): MemberCount {
  return {
    memberId: String(raw.memberId ?? raw.userId ?? raw.id ?? ""),
    memberNome: String(
      raw.memberNome ??
        raw.memberName ??
        raw.userName ??
        raw.nome ??
        raw.name ??
        "",
    ),
    count: Number(raw.count ?? raw.total ?? 0),
  };
}

/**
 * Maps a project progress item from backend to frontend format.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProjectProgress(raw: any): ProjectProgress {
  return {
    projectId: String(raw.projectId ?? raw.id ?? ""),
    projectNome: String(
      raw.projectNome ?? raw.projectName ?? raw.nome ?? raw.name ?? "",
    ),
    totalTasks: Number(raw.totalTasks ?? raw.total ?? 0),
    todo: Number(raw.todo ?? 0),
    doing: Number(raw.doing ?? raw.inProgress ?? 0),
    done: Number(raw.done ?? raw.completed ?? 0),
    percentConcluido: Number(raw.percentConcluido ?? raw.percentComplete ?? 0),
  };
}

// ============================================================
// Main mappers
// ============================================================

/**
 * Maps backend team dashboard response to frontend TeamDashboard type.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapApiTeamDashboard(raw: any): TeamDashboard {
  if (!raw) {
    return {
      tasksByStatus: [],
      tasksByMember: [],
      velocity: { tasksCompletedLast7Days: 0 },
      totalTasks: 0,
    };
  }

  // Backend retorna { summary, tasksByUser, velocity, burndown }
  // Frontend espera { tasksByStatus, tasksByMember, velocity, totalTasks }
  const summary = raw.summary ?? {};

  // Mapear summary → tasksByStatus
  const tasksByStatus: StatusCount[] = [];
  if (summary.todoTasks > 0)
    tasksByStatus.push({
      statusId: "todo",
      statusNome: "Inbox",
      count: summary.todoTasks,
    });
  if (summary.doingTasks > 0)
    tasksByStatus.push({
      statusId: "doing",
      statusNome: "Em progresso",
      count: summary.doingTasks,
    });
  if (summary.doneTasks > 0)
    tasksByStatus.push({
      statusId: "done",
      statusNome: "Concluidas",
      count: summary.doneTasks,
    });

  // Se backend ja retorna tasksByStatus diretamente, usar isso
  if (Array.isArray(raw.tasksByStatus)) {
    tasksByStatus.length = 0;
    tasksByStatus.push(...raw.tasksByStatus.map(mapStatusCount));
  }

  // Mapear tasksByUser → tasksByMember
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tasksByMember: MemberCount[] = Array.isArray(raw.tasksByUser)
    ? raw.tasksByUser.map((u: Record<string, unknown>) => ({
        memberId: String(u.userId ?? u.memberId ?? ""),
        memberNome: String(u.userName ?? u.memberNome ?? ""),
        count: Number(u.total ?? u.count ?? 0),
      }))
    : Array.isArray(raw.tasksByMember)
      ? raw.tasksByMember.map(mapMemberCount)
      : [];

  // Mapear velocity (backend retorna array de sprints, frontend espera { tasksCompletedLast7Days })
  let tasksCompletedLast7Days = 0;
  if (Array.isArray(raw.velocity)) {
    tasksCompletedLast7Days = raw.velocity.reduce(
      (sum: number, s: Record<string, unknown>) =>
        sum + (Number(s.doneTasks) || 0),
      0,
    );
  } else if (raw.velocity?.tasksCompletedLast7Days != null) {
    tasksCompletedLast7Days = raw.velocity.tasksCompletedLast7Days;
  }

  return {
    tasksByStatus,
    tasksByMember,
    velocity: { tasksCompletedLast7Days },
    totalTasks: Number(summary.totalTasks ?? raw.totalTasks ?? raw.total ?? 0),
  };
}

/**
 * Maps backend member dashboard response to frontend MemberDashboard type.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapApiMemberDashboard(raw: any): MemberDashboard {
  if (!raw) {
    return {
      memberId: "",
      memberNome: "",
      tasksByStatus: [],
      tasksCompletedLast30Days: 0,
      totalTasks: 0,
    };
  }

  return {
    memberId: String(raw.memberId ?? raw.userId ?? raw.id ?? ""),
    memberNome: String(
      raw.memberNome ?? raw.memberName ?? raw.userName ?? raw.nome ?? "",
    ),
    tasksByStatus: Array.isArray(raw.tasksByStatus)
      ? raw.tasksByStatus.map(mapStatusCount)
      : [],
    tasksCompletedLast30Days: Number(
      raw.tasksCompletedLast30Days ?? raw.completedLast30Days ?? 0,
    ),
    totalTasks: Number(raw.totalTasks ?? raw.total ?? 0),
  };
}

/**
 * Maps backend company overview response to frontend CompanyOverview type.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapApiCompanyOverview(raw: any): CompanyOverview {
  if (!raw) {
    return {
      totalProjetos: 0,
      totalTasks: 0,
      totalTodo: 0,
      totalDoing: 0,
      totalDone: 0,
      projetos: [],
    };
  }

  return {
    totalProjetos: Number(
      raw.totalProjetos ?? raw.totalProjects ?? raw.projectCount ?? 0,
    ),
    totalTasks: Number(raw.totalTasks ?? raw.taskCount ?? 0),
    totalTodo: Number(raw.totalTodo ?? 0),
    totalDoing: Number(raw.totalDoing ?? raw.totalInProgress ?? 0),
    totalDone: Number(raw.totalDone ?? raw.totalCompleted ?? 0),
    projetos: Array.isArray(raw.projetos ?? raw.projects)
      ? (raw.projetos ?? raw.projects).map(mapProjectProgress)
      : [],
  };
}
