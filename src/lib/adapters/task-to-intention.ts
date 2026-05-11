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
  if (!tipoTask) return "feature";

  if (tipoTask.codigo) {
    const normalized = tipoTask.codigo.toLowerCase().replace(/[-_\s]/g, "");
    return TYPE_CODE_MAP[normalized] ?? "feature";
  }

  if (tipoTask.nome) {
    const normalized = tipoTask.nome.toLowerCase().replace(/[-_\s]/g, "");
    return TYPE_CODE_MAP[normalized] ?? "feature";
  }

  return "feature";
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

// Detect if value is V2 string enum vs legacy object shape.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isObj(v: any): v is Record<string, unknown> {
  return v !== null && typeof v === "object";
}

// V2 status strings (uppercase enum) -> frontend lowercase status
const V2_STATUS_TO_STRING: Record<string, IntentionStatus> = {
  INBOX: "inbox",
  READY: "ready",
  EXECUTING: "executing",
  DONE: "done",
  FAILED: "failed",
  CANCELLED: "cancelled",
  DISCARDED: "discarded",
  VALIDATING: "validating",
  VALIDATED: "validated",
};

const V2_PRIORITY_TO_STRING: Record<string, IntentionPriority> = {
  CRITICAL: "urgent",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapTaskToIntention(task: any): IntentionDocument {
  // Normalize: V2 returns id/nome/status="INBOX"/priority="HIGH"/dados{…},
  // legacy returned chave/titulo/status={id,code,name}/priority={…}
  const raw = task as Record<string, unknown>;
  const dados = isObj(raw.dados) ? (raw.dados as Record<string, unknown>) : {};

  // ID
  const id = String(raw.chave ?? raw.id ?? "");

  // Title
  const title = String(raw.titulo ?? raw.name ?? raw.nome ?? "");

  // Status — V2 retorna string enum direto; legado retornava objeto.
  let status: IntentionStatus;
  if (typeof raw.status === "string") {
    status = V2_STATUS_TO_STRING[raw.status as string] ?? "inbox";
  } else {
    const statusObj = (raw.status ?? {}) as Record<string, unknown>;
    status = resolveStatus({
      chave: String(statusObj.chave ?? statusObj.id ?? ""),
      nome: String(statusObj.nome ?? statusObj.name ?? ""),
      codigo: String(statusObj.codigo ?? statusObj.code ?? ""),
    });
  }

  // Type — V2 nao tem tipoTask. Tenta ler de dados.taskType ou inferir.
  const typeFromDados = isObj(dados.taskType)
    ? (dados.taskType as Record<string, unknown>)
    : null;
  const typeObj =
    (raw.tipoTask as Record<string, unknown> | null) ??
    (raw.taskType as Record<string, unknown> | null) ??
    typeFromDados;
  const normalizedType = typeObj
    ? {
        chave: String(typeObj.chave ?? typeObj.id ?? ""),
        nome: String(typeObj.nome ?? typeObj.name ?? ""),
        codigo: String(typeObj.codigo ?? typeObj.code ?? ""),
      }
    : null;
  const type = resolveType(normalizedType);

  // Priority — V2 retorna string enum 'CRITICAL'|'HIGH'|... ou null; legado retornava objeto.
  let priority: IntentionPriority;
  if (typeof raw.priority === "string") {
    priority = V2_PRIORITY_TO_STRING[raw.priority as string] ?? "medium";
  } else {
    const prioObj = (raw.prioridade ?? raw.priority ?? null) as Record<
      string,
      unknown
    > | null;
    priority = resolvePriority(
      prioObj
        ? {
            chave: String(prioObj.chave ?? prioObj.id ?? ""),
            nome: String(prioObj.nome ?? prioObj.name ?? ""),
            codigo: String(prioObj.codigo ?? prioObj.code ?? ""),
          }
        : null,
    );
  }

  // Canal: V2 nao retorna. Tenta dados.canal (codigo) ou raw.canal (legado).
  const canalObj =
    (raw.canal as Record<string, unknown> | null) ??
    (isObj(dados.canal) ? (dados.canal as Record<string, unknown>) : null);
  let canal: IntentionCanal = "web";
  if (canalObj) {
    const canalCode = String(canalObj.codigo ?? canalObj.code ?? "");
    const canalNorm = canalCode
      .toLowerCase()
      .replace(/^canal_/, "")
      .trim();
    const canalMap: Record<string, IntentionCanal> = {
      web: "web",
      whatsapp: "whatsapp",
      email: "email",
      slack: "slack",
      api: "api",
      telegram: "telegram",
    };
    canal = canalMap[canalNorm] ?? "web";
  } else if (typeof dados.source === "string") {
    // V2 salva 'source' enum em dados (ou no proprio campo)
    const src = String(dados.source).toLowerCase();
    if (
      src === "web" ||
      src === "whatsapp" ||
      src === "email" ||
      src === "slack" ||
      src === "api" ||
      src === "telegram"
    ) {
      canal = src as IntentionCanal;
    }
  }

  // Project
  const projectSlug = String(raw.idProject ?? raw.projectId ?? "");

  // Assignee — V2 retorna so `assigneeId` (string) sem objeto; legado tinha `assignee` objeto.
  const assigneeObj = isObj(raw.assignee)
    ? (raw.assignee as Record<string, unknown>)
    : null;
  const _assigneeIdFromRaw =
    raw.assigneeId !== undefined && raw.assigneeId !== null
      ? String(raw.assigneeId)
      : assigneeObj?.chave
        ? String(assigneeObj.chave)
        : assigneeObj?.id
          ? String(assigneeObj.id)
          : null;
  // Para compatibilidade com filtros que esperam `assignee.chave`, sintetizamos
  // o objeto a partir do assigneeId. Nome fica vazio quando V2 nao hidrata.
  const assigneeForFilter = _assigneeIdFromRaw
    ? {
        chave: _assigneeIdFromRaw,
        nome: assigneeObj
          ? String(assigneeObj.nome ?? assigneeObj.name ?? "")
          : "",
      }
    : null;
  // createdBy: prefere idCreator (V2) -> dados.createdBy -> assignee.nome -> "Sistema"
  const createdBy = raw.idCreator
    ? String(raw.idCreator)
    : typeof dados.createdBy === "string"
      ? String(dados.createdBy)
      : assigneeObj
        ? String(assigneeObj.nome ?? assigneeObj.name ?? "Sistema")
        : "Sistema";

  // Timestamps
  const createdAt = String(
    raw.criadoEm ?? raw.createdAt ?? new Date().toISOString(),
  );
  const updatedAt = String(raw.atualizadoEm ?? raw.updatedAt ?? createdAt);

  // V3 timestamps — V2 guarda em dados.telemetry.{readyAt,executingAt,doneAt}
  const telemetry = isObj(dados.telemetry)
    ? (dados.telemetry as Record<string, unknown>)
    : {};
  const readyAt =
    (raw.readyAt as string | undefined) ??
    (telemetry.readyAt as string | undefined) ??
    (status !== "inbox" ? updatedAt : null);
  const executingAt =
    (raw.executingAt as string | undefined) ??
    (telemetry.executingAt as string | undefined) ??
    (status === "executing" || status === "done" || status === "failed"
      ? updatedAt
      : null);
  const completedAt =
    (raw.completedAt as string | undefined) ??
    (telemetry.doneAt as string | undefined) ??
    (telemetry.completedAt as string | undefined) ??
    (status === "done" ? updatedAt : null);

  // V3 fields: prefere top-level (legado), fallback pra dados.{...} (V2 com expansão DTO).
  const pickStr = (k: string): string => String(raw[k] ?? dados[k] ?? "");
  const problema = pickStr("problema");
  const contexto = pickStr("contexto");
  const solucaoProposta = pickStr("solucaoProposta");

  // Arrays: aceita array, JSON string, ou faltando
  const pickArr = (k: string): string[] => {
    const v = raw[k] ?? dados[k];
    if (Array.isArray(v)) return v.map(String);
    if (typeof v === "string") return parseStringArray(v);
    return [];
  };
  const criteriosAceite = pickArr("criteriosAceite");
  const naoObjetivos = pickArr("naoObjetivos");
  const riscos = pickArr("riscos");

  const apetiteDias = Number(
    raw.storyPoints ??
      raw.apetiteDias ??
      dados.apetiteDias ??
      raw.estimativa ??
      raw.estimativaHoras ??
      0,
  );

  const hillPosition = Number(raw.hillPosition ?? dados.hillPosition ?? 0);

  // Deliverables — top-level (legado) ou dados.deliverables (V2)
  const deliverablesDados = isObj(dados.deliverables)
    ? (dados.deliverables as Record<string, unknown>)
    : {};
  const prUrl =
    (raw.prUrl as string | undefined) ??
    (deliverablesDados.prUrl as string | undefined) ??
    null;
  const deliverySummary =
    (raw.deliverySummary as string | undefined) ??
    (deliverablesDados.summary as string | undefined) ??
    null;
  const filesChanged = Number(
    raw.filesChanged ?? deliverablesDados.filesChanged ?? 0,
  );
  const deliverables: IntentionDeliverables | null = prUrl
    ? {
        prUrl,
        prNumber: Number(deliverablesDados.prNumber ?? 0),
        summary: deliverySummary ?? "",
        filesChanged: filesChanged || 0,
      }
    : null;

  const failureReason =
    (raw.failureReason as string | undefined) ??
    (dados.failureReason as string | undefined) ??
    undefined;

  const intention: IntentionDocument = {
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
        assignee: assigneeObj ? { nome: createdBy } : null,
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

  // Anexa `assignee` para componentes que filtram por `i.assignee?.chave`
  // (a tela /intentions faz cast IntentionDocument & { assignee?: ... }).
  return Object.assign(intention, { assignee: assigneeForFilter });
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
