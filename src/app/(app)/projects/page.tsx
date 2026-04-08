"use client";

import {
  FolderKanban,
  Plus,
  LayoutDashboard,
  ArrowRight,
  Sparkles,
  Wifi,
  Trash2,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { PageTransition } from "@/components/common/page-transition";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { useProjects, useProjectSummaries } from "@/lib/hooks/use-projects";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsApi } from "@/lib/api/projects";
import { QUERY_KEYS } from "@/lib/constants";
import type { ProjectSummary } from "@/types/project";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ApiKeyManager } from "@/components/projects/api-key-manager";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

// ============================================================
// Relative time helper
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

// ============================================================
// Connection status badge config
// ============================================================

const CONNECTION_STATUS_CONFIG = {
  active: {
    label: "Ativo",
    className: "text-green-500 border-green-500/30 bg-green-500/10",
  },
  idle: {
    label: "Recente",
    className: "text-yellow-500 border-yellow-500/30 bg-yellow-500/10",
  },
  inactive: {
    label: "Inativo",
    className: "text-muted-foreground border-border bg-muted",
  },
} as const;

function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { nome: string }) => projectsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects });
      queryClient.invalidateQueries({ queryKey: ["project-summaries"] });
    },
  });
}

function useRemoveProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => projectsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects });
      queryClient.invalidateQueries({ queryKey: ["intentions"] });
      toast.success("Projeto desconectado");
    },
    onError: () => {
      toast.error("Erro ao desconectar projeto");
    },
  });
}

export default function ProjectsPage() {
  usePageTitle("Projetos");
  const router = useRouter();
  const orgId = useAuthStore.getState().user?.orgId;
  const { data: projects, isLoading } = useProjects();
  const { data: summaries } = useProjectSummaries(orgId || undefined);
  const createProject = useCreateProject();
  const removeProject = useRemoveProject();
  const [newName, setNewName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  // O(1) lookup map: projectId -> summary
  const summaryMap = useMemo(
    () => new Map(summaries?.map((s) => [s.projectId, s])),
    [summaries],
  );

  const handleCreate = () => {
    if (!newName.trim()) return;
    createProject.mutate(
      { nome: newName.trim() },
      {
        onSuccess: () => {
          setNewName("");
          setDialogOpen(false);
        },
      },
    );
  };

  if (isLoading) {
    return (
      <PageTransition className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Projetos</h1>
            <p className="text-sm text-muted-foreground">Carregando...</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 w-32 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-4 w-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projetos</h1>
          <p className="text-sm text-muted-foreground">
            {projects?.length || 0} projeto(s) conectado(s)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" asChild>
            <Link href="/projects/setup">
              <BookOpen className="h-4 w-4" /> Guia de Conexao
            </Link>
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-[var(--scrumban-brand)] hover:bg-[var(--scrumban-brand)]/90 text-white">
                <Plus className="h-4 w-4" /> Conectar Projeto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar novo projeto</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <Input
                  placeholder="Nome do projeto"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  autoFocus
                />
                <Button
                  className="w-full"
                  onClick={handleCreate}
                  disabled={!newName.trim() || createProject.isPending}
                >
                  {createProject.isPending ? "Criando..." : "Criar Projeto"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {!projects?.length ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card p-8 md:p-12 text-center">
          <div className="rounded-full bg-[var(--scrumban-brand-muted)] p-4">
            <FolderKanban className="h-10 w-10 text-[var(--scrumban-brand)]" />
          </div>
          <h3 className="mt-4 text-lg font-bold">
            Conecte seu primeiro projeto
          </h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            Projetos conectados puxam e executam intencoes de forma autonoma.
          </p>
          <div className="mt-6 flex items-start gap-6 text-left text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--scrumban-brand-muted)] text-xs font-bold text-[var(--scrumban-brand)]">
                1
              </span>
              <span>Conecte um projeto</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--scrumban-brand-muted)] text-xs font-bold text-[var(--scrumban-brand)]">
                2
              </span>
              <span>Disponibilize intencoes</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--scrumban-brand-muted)] text-xs font-bold text-[var(--scrumban-brand)]">
                3
              </span>
              <span>Acompanhe resultados</span>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <Button className="gap-2" onClick={() => setDialogOpen(true)}>
              <Sparkles className="h-4 w-4" /> Conectar Primeiro Projeto
            </Button>
            <Button variant="outline" className="gap-2" asChild>
              <Link href="/projects/setup">
                <BookOpen className="h-4 w-4" /> Ver guia completo
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map(
            (project: {
              chave: string;
              nome: string;
              descricao?: string | null;
              taskCount?: number;
            }) => (
              <ProjectCard
                key={project.chave}
                project={project}
                summary={summaryMap.get(project.chave)}
                onNavigate={(path) => router.push(path)}
                onDisconnect={(id) => {
                  if (
                    confirm("Tem certeza que deseja desconectar este projeto?")
                  ) {
                    removeProject.mutate(id);
                  }
                }}
              />
            ),
          )}
        </div>
      )}
    </PageTransition>
  );
}

// ============================================================
// ProjectCard -- uses real data from summaries API
// ============================================================

function ProjectCard({
  project,
  summary,
  onNavigate,
  onDisconnect,
}: {
  project: {
    chave: string;
    nome: string;
    descricao?: string | null;
    taskCount?: number;
  };
  summary?: ProjectSummary;
  onNavigate: (path: string) => void;
  onDisconnect: (id: string) => void;
}) {
  const user = useAuthStore.getState().user;
  const isAdmin = user?.role?.toUpperCase() === "ADMIN";

  const throughput = summary?.weeklyThroughput ?? 0;
  const lastActivity = summary?.lastActivity
    ? {
        time: formatRelativeTime(summary.lastActivity.timestamp),
        title: summary.lastActivity.intentionTitle,
      }
    : null;
  const connectionStatus = summary?.connectionStatus ?? "inactive";
  const statusConfig = CONNECTION_STATUS_CONFIG[connectionStatus];

  return (
    <Card
      className="group cursor-pointer border transition-all hover:shadow-lg hover:border-[var(--scrumban-brand)]/40 hover:-translate-y-0.5"
      onClick={() => onNavigate(`/intentions/${project.chave}`)}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--scrumban-brand-muted)]">
            <FolderKanban className="h-4 w-4 text-[var(--scrumban-brand)]" />
          </div>
          <h3 className="text-base font-bold tracking-tight">{project.nome}</h3>
        </div>

        {/* Connection status -- dynamic based on last activity */}
        <Badge
          variant="outline"
          className={`text-[10px] gap-1 ${statusConfig.className}`}
        >
          <Wifi className="h-3 w-3" />
          {statusConfig.label}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {project.descricao && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {project.descricao}
          </p>
        )}

        {/* API Key — ADMIN only */}
        {isAdmin && <ApiKeyManager projectId={project.chave} />}

        {/* Stats row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="bg-[var(--status-doing)]/10 text-[var(--status-doing)] text-xs"
            >
              {project.taskCount ?? 0} intencoes
            </Badge>
            {throughput > 0 && (
              <Badge
                variant="outline"
                className="text-[10px] text-green-500 border-green-500/20"
              >
                {throughput} intencoes/semana
              </Badge>
            )}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(`/dashboard/${project.chave}`);
              }}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation();
                onDisconnect(project.chave);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Last activity */}
        {lastActivity && (
          <p className="text-[11px] text-muted-foreground truncate border-t border-border pt-2">
            {lastActivity.time} — {lastActivity.title}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
