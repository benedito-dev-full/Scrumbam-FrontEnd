"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Inbox,
  CheckCircle,
  Zap,
  CheckCheck,
  XCircle,
  Ban,
  Trash2,
  Eye,
  ShieldCheck,
  ExternalLink,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { activityApi } from "@/lib/api/activity";
import { projectsApi } from "@/lib/api/projects";
import type { ActivityEvent, ActivityEventType } from "@/types/intention";

// ============================================================
// Event type config (icon, color, label)
// ============================================================

interface EventConfig {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  label: string;
}

const EVENT_CONFIG: Record<ActivityEventType, EventConfig> = {
  "intention.created": {
    icon: Inbox,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    label: "Criada",
  },
  "intention.ready": {
    icon: CheckCircle,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    label: "Pronta",
  },
  "intention.executing": {
    icon: Zap,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    label: "Executando",
  },
  "intention.completed": {
    icon: CheckCheck,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    label: "Concluida",
  },
  "intention.failed": {
    icon: XCircle,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    label: "Falhou",
  },
  "intention.cancelled": {
    icon: Ban,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    label: "Cancelada",
  },
  "intention.discarded": {
    icon: Trash2,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    label: "Descartada",
  },
  "intention.validating": {
    icon: Eye,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    label: "Validando",
  },
  "intention.validated": {
    icon: ShieldCheck,
    color: "text-green-600",
    bgColor: "bg-green-600/10",
    label: "Validada",
  },
};

// ============================================================
// Relative time formatter
// ============================================================

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `ha ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `ha ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "ontem";
  return `ha ${days} dias`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ============================================================
// ActivityTimeline -- main component
// ============================================================

interface ProjectOption {
  id: string;
  name: string;
}

export function ActivityTimeline() {
  const [projectFilter, setProjectFilter] = useState("all");
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectsError, setProjectsError] = useState(false);

  const loadProjects = useCallback(() => {
    setProjectsError(false);
    setLoading(true);
    projectsApi
      .list()
      .then((list) => {
        setProjects(list.map((p) => ({ id: p.chave, name: p.nome })));
      })
      .catch(() => {
        setProjectsError(true);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Buscar eventos quando filtro muda
  const fetchEvents = useCallback(
    async (filter: string, projectList: ProjectOption[]) => {
      setLoading(true);
      setError(null);

      try {
        if (filter === "all") {
          // Buscar eventos de todos os projetos em paralelo
          if (projectList.length === 0) {
            setEvents([]);
            return;
          }
          const results = await Promise.all(
            projectList.map((p) =>
              activityApi
                .getProjectActivity(p.id, { limit: 50 })
                .catch(() => ({ events: [] as ActivityEvent[] })),
            ),
          );
          const allEvents = results.flatMap((r) => r.events);
          // Ordenar por timestamp desc
          allEvents.sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          );
          setEvents(allEvents);
        } else {
          const result = await activityApi.getProjectActivity(filter, {
            limit: 50,
          });
          setEvents(result.events);
        }
      } catch {
        setError("Erro ao carregar atividades");
        setEvents([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (projects.length > 0 || projectFilter !== "all") {
      fetchEvents(projectFilter, projects);
    } else {
      // Esperar projetos carregarem para "all"
      setLoading(projects.length === 0);
    }
  }, [projectFilter, projects, fetchEvents]);

  // Opcoes de filtro: "Todos" + projetos reais
  const filterOptions = useMemo(
    () => [
      { id: "all", name: "Todos os projetos" },
      ...projects.map((p) => ({ id: p.id, name: p.name })),
    ],
    [projects],
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-[220px] text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {filterOptions.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Badge variant="secondary" className="text-xs">
          {events.length} {events.length === 1 ? "evento" : "eventos"}
        </Badge>
      </div>

      {/* Projects error state */}
      {projectsError && (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <div>
            <p className="text-sm font-medium">Nao foi possivel carregar os projetos</p>
            <p className="text-xs text-muted-foreground mt-1">
              Verifique sua conexao ou se o servidor esta disponivel.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={loadProjects} className="gap-2">
            <RefreshCw className="h-3.5 w-3.5" />
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Error state */}
      {error && !projectsError && (
        <div className="text-center py-8 text-sm text-destructive">{error}</div>
      )}

      {/* Loading state */}
      {loading && !error && (
        <div className="flex items-center justify-center py-8 gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando atividades...
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && events.length === 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          Nenhum evento encontrado para este filtro.
        </div>
      )}

      {/* Timeline */}
      {!loading && !error && events.length > 0 && (
        <div className="relative pl-8">
          {/* Vertical line */}
          <div className="absolute left-3.5 top-2 bottom-2 w-px bg-border" />

          <div className="space-y-0">
            {events.map((event) => (
              <TimelineItem key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// TimelineItem -- single event in timeline
// ============================================================

function TimelineItem({ event }: { event: ActivityEvent }) {
  const config = EVENT_CONFIG[event.tipo];
  if (!config) return null;
  const Icon = config.icon;

  return (
    <div className="relative flex gap-3 pb-6 last:pb-0 group">
      {/* Dot / icon */}
      <div
        className={`absolute -left-8 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-background ${config.bgColor}`}
      >
        <Icon className={`h-3.5 w-3.5 ${config.color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm">
              <span className="font-medium">{event.intentionTitle}</span>
              <span className="text-muted-foreground"> — </span>
              <Badge
                variant="outline"
                className={`text-[10px] font-medium ${config.color} ${config.bgColor} border-transparent`}
              >
                {config.label}
              </Badge>
            </p>

            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant="outline"
                className="text-[10px] text-muted-foreground"
              >
                {event.projectSlug}
              </Badge>

              {event.details?.actorName && (
                <span className="text-xs text-muted-foreground">
                  por {event.details.actorName}
                </span>
              )}
            </div>

            {/* Details */}
            {event.details?.prUrl && (
              <a
                href={event.details.prUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-1.5 text-xs text-[var(--scrumban-brand)] hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                {event.details.prUrl.split("/").slice(-2).join("/")}
              </a>
            )}

            {event.details?.motivo && (
              <p className="mt-1.5 text-xs text-muted-foreground italic">
                Motivo: {event.details.motivo}
              </p>
            )}
          </div>

          {/* Timestamp */}
          <div className="shrink-0 text-right">
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(event.timestamp)}
            </span>
            <p className="text-[10px] text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity">
              {formatDate(event.timestamp)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
