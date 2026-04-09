// Backend API endpoint constants
// All routes relative to NEXT_PUBLIC_API_URL

export const ENDPOINTS = {
  // Auth
  AUTH_LOGIN: "/auth/login",
  AUTH_REGISTER: "/auth/register",
  AUTH_LOGOUT: "/auth/logout",
  AUTH_REFRESH: "/auth/refresh",

  // Auth - Me
  AUTH_ME: "/auth/me",
  AUTH_DELETE_ACCOUNT: "/auth/me",
  AUTH_DELETE_ORG: (orgId: string) => `/auth/organizations/${orgId}`,

  // Organizations
  ORGANIZATIONS: "/organizations",
  ORG: (orgId: string) => `/organizations/${orgId}`,
  ORG_USERS: (orgId: string) => `/organizations/${orgId}/users`,
  ORG_USER: (orgId: string, userId: string) =>
    `/organizations/${orgId}/users/${userId}`,
  ORG_USER_ROLE: (orgId: string, userId: string) =>
    `/organizations/${orgId}/users/${userId}/role`,

  // Projects
  PROJECTS: "/projects",
  PROJECT: (id: string) => `/projects/${id}`,
  PROJECT_COLUMNS: (projectId: string) => `/projects/${projectId}/columns`,
  PROJECT_COLUMN: (projectId: string, columnId: string) =>
    `/projects/${projectId}/columns/${columnId}`,
  PROJECT_COLUMNS_REORDER: (projectId: string) =>
    `/projects/${projectId}/columns/reorder`,
  PROJECT_TASKS: (projectId: string) => `/projects/${projectId}/tasks`,
  PROJECT_TASKS_REORDER: (projectId: string) =>
    `/projects/${projectId}/tasks/reorder`,

  // Tasks
  TASKS: "/tasks",
  TASK: (id: string) => `/tasks/${id}`,
  TASK_STATUS: (id: string) => `/tasks/${id}/status`,
  TASK_SPRINT: (id: string) => `/tasks/${id}/sprint`,
  TASK_TAGS: (id: string) => `/tasks/${id}/tags`,
  TASK_TAG: (id: string, tagId: string) => `/tasks/${id}/tags/${tagId}`,

  // Tags
  TAGS: "/tags",
  TAG: (id: string) => `/tags/${id}`,

  // Dashboards
  DASHBOARDS: "/dashboards",
  DASHBOARDS_ME: "/dashboards/me",
  DASHBOARDS_COMPANY: "/dashboards/company",
  DASHBOARD_DAILY_SUMMARY: (projectId: string) =>
    `/dashboards/projects/${projectId}/daily-summary`,

  // Flow Metrics
  FLOW_METRICS: "/flow-metrics",
  FLOW_CYCLE_TIME: (projectId: string) =>
    `/flow-metrics/${projectId}/cycle-time`,
  FLOW_LEAD_TIME: (projectId: string) => `/flow-metrics/${projectId}/lead-time`,
  FLOW_THROUGHPUT: (projectId: string) =>
    `/flow-metrics/${projectId}/throughput`,
  FLOW_WIP_AGE: (projectId: string) => `/flow-metrics/${projectId}/wip-age`,
  FLOW_CFD: (projectId: string) => `/flow-metrics/${projectId}/cfd`,
  FLOW_DASHBOARD: (projectId: string) => `/flow-metrics/${projectId}/dashboard`,

  // Comments
  TASK_COMMENTS: (id: string) => `/tasks/${id}/comments`,

  // Forecast
  FORECAST: (projectId: string) => `/forecast/${projectId}`,

  // Retrospective
  TASK_FEEDBACK: (taskId: string) => `/tasks/${taskId}/feedback`,
  RETROSPECTIVE: (projectId: string) => `/retrospective/${projectId}`,

  // Circuit Breaker
  CIRCUIT_BREAKER: "/circuit-breaker",
  CIRCUIT_BREAKER_PROJECT: (projectId: string) =>
    `/circuit-breaker/${projectId}`,
  TASK_APPETITE: (id: string) => `/tasks/${id}/appetite`,
  TASK_APPETITE_EXTEND: (id: string) => `/tasks/${id}/appetite/extend`,

  // Notifications (integration config)
  NOTIFICATIONS_CONFIGURE: "/integrations/notifications/configure",
  NOTIFICATIONS_TEST: "/integrations/notifications/test",

  // In-App Notifications
  IN_APP_NOTIFICATIONS: "/notifications",
  IN_APP_NOTIFICATIONS_UNREAD_COUNT: "/notifications/unread-count",
  IN_APP_NOTIFICATIONS_READ: "/notifications/read",
  IN_APP_NOTIFICATIONS_READ_ALL: "/notifications/read-all",
  IN_APP_NOTIFICATION: (id: string) => `/notifications/${id}`,

  // Analytics
  ANALYTICS_COMPARE: (projectId: string) => `/analytics/${projectId}/compare`,
  ANALYTICS_CAPACITY_FORECAST: (projectId: string) =>
    `/analytics/${projectId}/capacity-forecast`,
  ANALYTICS_STAKEHOLDER_REPORT: (projectId: string) =>
    `/analytics/${projectId}/stakeholder-report`,
  // Project Activity
  PROJECT_ACTIVITY: (id: string) => `/projects/${id}/activity`,

  // Project Summaries (bulk stats for project cards)
  PROJECT_SUMMARIES: "/projects/summaries",

  // Branding (White Label)
  ORG_BRANDING: (orgId: string) => `/organizations/${orgId}/branding`,

  // Templates
  TEMPLATES: "/templates",
  TEMPLATE: (id: string) => `/templates/${id}`,
  PROJECT_FROM_TEMPLATE: "/projects/from-template",

  // Webhooks
  WEBHOOKS: "/webhooks",
  WEBHOOKS_CONFIGURE: "/webhooks/configure",
  WEBHOOK: (id: string) => `/webhooks/${id}`,

  // API Keys (per-project)
  PROJECT_API_KEY: (id: string) => `/projects/${id}/api-key`,

  // Search (global unified search)
  SEARCH: "/search",

  // Reports
  REPORT_PROJECT_PDF: (projectId: string) =>
    `/reports/projects/${projectId}/pdf`,
} as const;
