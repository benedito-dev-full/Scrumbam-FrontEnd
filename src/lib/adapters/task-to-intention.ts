/**
 * Adapter: Backend Task -> Frontend IntentionDocument
 *
 * Maps the backend DTask response shape to the frontend IntentionDocument type.
 * Handles missing fields gracefully with safe defaults for V3-specific fields
 * that don't yet exist in the backend schema (hillPosition, canal, timestamps, etc.).
 */

import type { Task } from "@/types/task";
import type {
  IntentionDocument,
  IntentionStatus,
  IntentionType,
  IntentionPriority,
  IntentionCanal,
  IntentionDeliverables,
  TimelineEvent,
} from "@/types/intention";
import { STATUS_IDS } from "@/types/intention";

// ============================================================
// Status mapping: DTabela chave/codigo -> IntentionStatus string
// ============================================================

const STATUS_CHAVE_TO_STRING: Record<string, IntentionStatus> = {
  [STATUS_IDS.INBOX]: "inbox",
  [STATUS_IDS.READY]: "ready",
  [STATUS_IDS.EXECUTING]: "executing",
  [STATUS_IDS.DONE]: "done",
  [STATUS_IDS.FAILED]: "failed",
  [STATUS_IDS.CANCELLED]: "cancelled",
  [STATUS_IDS.DISCARDED]: "discarded",
  [STATUS_IDS.VALIDATING]: "validating",
  [STATUS_IDS.VALIDATED]: "validated",
};

// Fallback: try to match by codigo string (case insensitive)
const STATUS_CODE_TO_STRING: Record<string, IntentionStatus> = {
  inbox: "inbox",
  ready: "ready",
  executing: "executing",
  done: "done",
  failed: "failed",
  cancelled: "cancelled",
  discarded: "discarded",
  validating: "validating",
  validated: "validated",
  // V1 status fallbacks (DTabela idClasse=-200)
  todo: "inbox",
  doing: "executing",
};

function resolveStatus(status: Task["status"]): IntentionStatus {
  // Try by chave first (most reliable)
  const byChave = STATUS_CHAVE_TO_STRING[status.chave];
  if (byChave) return byChave;

  // Try by codigo
  if (status.codigo) {
    const normalized = status.codigo.toLowerCase().replace(/[-_\s]/g, "");
    const byCode = STATUS_CODE_TO_STRING[normalized];
    if (byCode) return byCode;
  }

  // Try by nome
  if (status.nome) {
    const normalized = status.nome.toLowerCase().replace(/[-_\s]/g, "");
    const byNome = STATUS_CODE_TO_STRING[normalized];
    if (byNome) return byNome;
  }

  // Safe default
  return "inbox";
}

// ============================================================
// Type mapping: DTabela tipoTask -> IntentionType
// ============================================================

const TYPE_CODE_MAP: Record<string, IntentionType> = {
  feature: "feature",
  bug: "bug",
  improvement: "improvement",
  review: "review",
  explain: "analysis",
  documentation: "documentation",
  test: "test",
  code: "feature",
  analysis: "analysis",
  refactor: "improvement",
};

function resolveType(tipoTask: Task["tipoTask"]): IntentionType {
  if (!tipoTask) return "code";

  if (tipoTask.codigo) {
    const normalized = tipoTask.codigo.toLowerCase().replace(/[-_\s]/g, "");
    return TYPE_CODE_MAP[normalized] ?? "code";
  }

  if (tipoTask.nome) {
    const normalized = tipoTask.nome.toLowerCase().replace(/[-_\s]/g, "");
    return TYPE_CODE_MAP[normalized] ?? "code";
  }

  return "code";
}

// ============================================================
// Priority mapping: DTabela prioridade -> IntentionPriority
// ============================================================

const PRIORITY_CODE_MAP: Record<string, IntentionPriority> = {
  urgent: "urgent",
  urgente: "urgent",
  high: "high",
  alta: "high",
  medium: "medium",
  media: "medium",
  low: "low",
  baixa: "low",
};

function resolvePriority(prioridade: Task["prioridade"]): IntentionPriority {
  if (!prioridade) return "medium";

  if (prioridade.codigo) {
    const normalized = prioridade.codigo.toLowerCase().replace(/[-_\s]/g, "");
    return PRIORITY_CODE_MAP[normalized] ?? "medium";
  }

  if (prioridade.nome) {
    const normalized = prioridade.nome.toLowerCase().replace(/[-_\s]/g, "");
    return PRIORITY_CODE_MAP[normalized] ?? "medium";
  }

  return "medium";
}

// ============================================================
// Canal mapping (not in backend yet -- always "web" for now)
// ============================================================

// Canal resolution is now inline in mapTaskToIntention (handles both formats)

// ============================================================
// JSON string fields -> arrays
// ============================================================

function parseStringArray(value: string | null | undefined): string[] {
  if (!value) return [];

  // Try JSON parse first (backend stores as JSON stringified array)
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
    if (typeof parsed === "string") return [parsed];
    return [];
  } catch {
    // Fallback: split by newlines or semicolons
    return value
      .split(/[;\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
}

// ============================================================
// Deliverables (not in backend yet)
// ============================================================

// Deliverables resolution is now inline in mapTaskToIntention (reads prUrl/deliverySummary/filesChanged directly)

// ============================================================
// Timeline (not in backend yet -- generate minimal from timestamps)
// ============================================================

function resolveTimeline(task: Task, status: IntentionStatus): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  // Always: creation event
  events.push({
    id: `tl-${task.chave}-created`,
    timestamp: task.criadoEm,
    actor: task.assignee?.nome ?? "Sistema",
    actorType: "system",
    action: "Intencao criada",
  });

  // Infer transitions from status (minimal -- backend doesn't track individual timestamps)
  if (
    status === "ready" ||
    status === "executing" ||
    status === "done" ||
    status === "failed"
  ) {
    events.push({
      id: `tl-${task.chave}-ready`,
      timestamp: task.atualizadoEm,
      actor: "Sistema",
      actorType: "system",
      action: "Movido para Ready",
    });
  }

  if (status === "executing" || status === "done" || status === "failed") {
    events.push({
      id: `tl-${task.chave}-exec`,
      timestamp: task.atualizadoEm,
      actor: "Sistema",
      actorType: "system",
      action: "Execucao iniciada",
    });
  }

  if (status === "done") {
    events.push({
      id: `tl-${task.chave}-done`,
      timestamp: task.atualizadoEm,
      actor: "Sistema",
      actorType: "system",
      action: "Concluida",
    });
  }

  return events;
}

// ============================================================
// Main mapper: Task -> IntentionDocument
// ============================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapTaskToIntention(task: any): IntentionDocument {
  // Normalize: backend returns id/name/status.id/status.code, frontend type uses chave/titulo/status.chave
  const raw = task as Record<string, unknown>;

  // ID
  const id = String(raw.chave ?? raw.id ?? "");

  // Title
  const title = String(raw.titulo ?? raw.name ?? raw.nome ?? "");

  // Status object (backend: {id, name, code}, frontend: {chave, nome, codigo})
  const statusObj = (raw.status ?? {}) as Record<string, unknown>;
  const normalizedStatus = {
    chave: String(statusObj.chave ?? statusObj.id ?? ""),
    nome: String(statusObj.nome ?? statusObj.name ?? ""),
    codigo: String(statusObj.codigo ?? statusObj.code ?? ""),
  };
  const status = resolveStatus(normalizedStatus);

  // Type (backend: taskType, frontend: tipoTask)
  const typeObj = (raw.tipoTask ?? raw.taskType ?? null) as Record<
    string,
    unknown
  > | null;
  const normalizedType = typeObj
    ? {
        chave: String(typeObj.chave ?? typeObj.id ?? ""),
        nome: String(typeObj.nome ?? typeObj.name ?? ""),
        codigo: String(typeObj.codigo ?? typeObj.code ?? ""),
      }
    : null;
  const type = resolveType(normalizedType);

  // Priority (backend: priority, frontend: prioridade)
  const prioObj = (raw.prioridade ?? raw.priority ?? null) as Record<
    string,
    unknown
  > | null;
  const normalizedPrio = prioObj
    ? {
        chave: String(prioObj.chave ?? prioObj.id ?? ""),
        nome: String(prioObj.nome ?? prioObj.name ?? ""),
        codigo: String(prioObj.codigo ?? prioObj.code ?? ""),
      }
    : null;
  const priority = resolvePriority(normalizedPrio);

  // Canal (backend: canal object, frontend: not in type yet)
  const canalObj = (raw.canal ?? null) as Record<string, unknown> | null;
  let canal: IntentionCanal = "web";
  if (canalObj) {
    const canalCode = String(canalObj.codigo ?? canalObj.code ?? "");
    const canalNorm = canalCode.toLowerCase().replace("canal_", "");
    const canalMap: Record<string, IntentionCanal> = {
      web: "web",
      whatsapp: "whatsapp",
      email: "email",
      slack: "slack",
      api: "api",
    };
    canal = canalMap[canalNorm] ?? "web";
  }

  // Project
  const projectSlug = String(raw.idProject ?? raw.projectId ?? "");

  // Assignee name
  const assignee = raw.assignee as Record<string, unknown> | null;
  const createdBy = assignee
    ? String(assignee.nome ?? assignee.name ?? "Sistema")
    : "Sistema";

  // Timestamps (backend: createdAt, frontend: criadoEm)
  const createdAt = String(
    raw.criadoEm ?? raw.createdAt ?? new Date().toISOString(),
  );
  const updatedAt = String(raw.atualizadoEm ?? raw.updatedAt ?? createdAt);

  // V3 timestamps from backend
  const readyAt = raw.readyAt
    ? String(raw.readyAt)
    : status !== "inbox"
      ? updatedAt
      : null;
  const executingAt = raw.executingAt
    ? String(raw.executingAt)
    : status === "executing" || status === "done" || status === "failed"
      ? updatedAt
      : null;
  const completedAt = raw.completedAt
    ? String(raw.completedAt)
    : status === "done"
      ? updatedAt
      : null;

  // V3 fields (backend has these as real columns now)
  const problema = String(raw.problema ?? "");
  const contexto = String(raw.contexto ?? "");
  const solucaoProposta = String(raw.solucaoProposta ?? "");

  // Arrays: backend may return real arrays or JSON strings
  const criteriosRaw = raw.criteriosAceite;
  const criteriosAceite = Array.isArray(criteriosRaw)
    ? criteriosRaw.map(String)
    : parseStringArray(criteriosRaw as string);
  const naoObjRaw = raw.naoObjetivos;
  const naoObjetivos = Array.isArray(naoObjRaw)
    ? naoObjRaw.map(String)
    : parseStringArray(naoObjRaw as string);
  const riscosRaw = raw.riscos;
  const riscos = Array.isArray(riscosRaw)
    ? riscosRaw.map(String)
    : parseStringArray(riscosRaw as string);

  // Appetite
  const apetiteDias = Number(
    raw.storyPoints ??
      raw.apetiteDias ??
      raw.estimativa ??
      raw.estimativaHoras ??
      0,
  );

  // Hill position
  const hillPosition = Number(raw.hillPosition ?? 0);

  // Deliverables
  const prUrl = raw.prUrl ? String(raw.prUrl) : null;
  const deliverySummary = raw.deliverySummary
    ? String(raw.deliverySummary)
    : null;
  const filesChanged = raw.filesChanged ? Number(raw.filesChanged) : null;
  const deliverables: IntentionDeliverables | null = prUrl
    ? {
        prUrl,
        prNumber: 0,
        summary: deliverySummary ?? "",
        filesChanged: filesChanged ?? 0,
      }
    : null;

  // Failure reason
  const failureReason = raw.failureReason
    ? String(raw.failureReason)
    : undefined;

  return {
    id,
    title,
    status,
    type,
    priority,
    canal,
    projectSlug,
    deliverables,
    problema,
    contexto,
    solucaoProposta,
    criteriosAceite,
    naoObjetivos,
    riscos,
    apetiteDias,
    createdBy,
    timeline: resolveTimeline(
      {
        chave: id,
        criadoEm: createdAt,
        atualizadoEm: updatedAt,
        assignee: assignee ? { nome: createdBy } : null,
      } as Task,
      status,
    ),
    hillPosition,
    createdAt,
    updatedAt,
    inboxAt: createdAt,
    readyAt,
    executingAt,
    completedAt,
    failureReason,
  };
}

/**
 * Batch mapper with null safety.
 * Filters out any null/undefined items from the input array.
 */
export function mapTasksToIntentions(
  tasks: Task[] | null | undefined,
): IntentionDocument[] {
  if (!tasks) return [];
  return tasks.map(mapTaskToIntention);
}
