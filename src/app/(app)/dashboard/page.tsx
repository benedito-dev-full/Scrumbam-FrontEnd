"use client";

import { useState, useCallback } from "react";
import {
  Clock,
  Timer,
  Zap,
  AlertTriangle,
  BarChart3,
  PieChart,
  TrendingUp,
  Layers,
  Activity,
  LayoutDashboard,
  FileDown,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { PeriodSelector } from "@/components/dashboard/period-selector";
import { StatusDistribution } from "@/components/dashboard/status-distribution";
import { MemberDistribution } from "@/components/dashboard/member-distribution";
import { ThroughputChart } from "@/components/dashboard/throughput-chart";
import { CfdChart } from "@/components/dashboard/cfd-chart";
import { WipAgeAlerts } from "@/components/dashboard/wip-age-alerts";
import { MonteCarloChart } from "@/components/dashboard/monte-carlo-chart";
import { DailySummary } from "@/components/dashboard/daily-summary";
import { EmptyMetrics } from "@/components/dashboard/empty-metrics";
import { PageTransition } from "@/components/common/page-transition";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { useProjects } from "@/lib/hooks/use-projects";
import {
  useTeamDashboard,
  useFlowDashboard,
  useThroughput,
  useCfd,
  useWipAge,
} from "@/lib/hooks/use-dashboards";
import { reportsApi } from "@/lib/api/reports";

export default function DashboardPage() {
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const [period, setPeriod] = useState(30);
  const [isExporting, setIsExporting] = useState(false);

  usePageTitle("Dashboard");

  // Default ao primeiro projeto quando carrega
  const projectId =
    selectedProjectId ??
    (projects && projects.length > 0 ? projects[0].chave : null);

  const teamDash = useTeamDashboard(projectId ?? undefined);
  const flowDash = useFlowDashboard(projectId ?? undefined, period);
  const throughput = useThroughput(projectId ?? undefined, period);
  const cfd = useCfd(projectId ?? undefined, period);
  const wipAge = useWipAge(projectId ?? undefined);

  const isKpiLoading = flowDash.isLoading;
  const flow = flowDash.data;

  // Loading projetos
  if (projectsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Sem projetos
  if (!projects || projects.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Metricas e visao geral do time
          </p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card p-12 text-center">
          <LayoutDashboard className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">Nenhum projeto</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Crie um projeto primeiro para visualizar o dashboard.
          </p>
        </div>
      </div>
    );
  }

  const selectedProject = projects.find((p) => p.chave === projectId);

  const handleExportPdf = useCallback(async () => {
    if (!projectId) return;
    setIsExporting(true);
    try {
      const blob = await reportsApi.downloadProjectPdf(projectId, {
        periodDays: period,
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `relatorio-projeto-${projectId}-${period}d.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("PDF exportado com sucesso");
    } catch {
      toast.error("Erro ao exportar PDF. Tente novamente.");
    } finally {
      setIsExporting(false);
    }
  }, [projectId, period]);

  return (
    <PageTransition className="space-y-8">
      {/* Header com seletor de projeto */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Metricas de fluxo e performance
            {selectedProject ? ` — ${selectedProject.nome}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <Select value={projectId ?? ""} onValueChange={setSelectedProjectId}>
            <SelectTrigger className="flex-1 sm:flex-none sm:w-[200px] text-sm">
              <SelectValue placeholder="Selecionar projeto" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.chave} value={p.chave}>
                  {p.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <PeriodSelector value={period} onChange={setPeriod} />
          {projectId && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPdf}
              disabled={isExporting}
              className="min-w-[44px] min-h-[44px] sm:min-h-0"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Exportar PDF</span>
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards - Flow Metrics */}
      <DashboardSection icon={Activity} title="Metricas de Fluxo">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icon={Clock}
            title="Cycle Time"
            variant="blue"
            value={
              isKpiLoading
                ? "-"
                : `${flow?.cycleTime.average.toFixed(1) ?? "0"} dias`
            }
            subtitle={
              flow
                ? `mediana: ${flow.cycleTime.median.toFixed(1)} dias`
                : undefined
            }
            isLoading={isKpiLoading}
          />
          <KpiCard
            icon={Timer}
            title="Lead Time"
            variant="amber"
            value={
              isKpiLoading
                ? "-"
                : `${flow?.leadTime.average.toFixed(1) ?? "0"} dias`
            }
            subtitle={
              flow
                ? `mediana: ${flow.leadTime.median.toFixed(1)} dias`
                : undefined
            }
            isLoading={isKpiLoading}
          />
          <KpiCard
            icon={TrendingUp}
            title="Throughput"
            variant="green"
            value={
              isKpiLoading
                ? "-"
                : `${flow?.throughputPerWeek.toFixed(1) ?? "0"}/sem`
            }
            subtitle={
              flow ? `${flow.completedCards} intencoes concluidas` : undefined
            }
            isLoading={isKpiLoading}
          />
          <KpiCard
            icon={Layers}
            title="WIP Alerts"
            variant="red"
            value={isKpiLoading ? "-" : (flow?.wipAgingCount ?? 0)}
            subtitle={flow ? `${flow.totalCards} intencoes total` : undefined}
            trend={
              flow ? (flow.wipAgingCount > 0 ? "down" : "neutral") : undefined
            }
            isLoading={isKpiLoading}
          />
        </div>
      </DashboardSection>

      {/* Status + Member Distribution */}
      <DashboardSection icon={PieChart} title="Distribuicao">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <StatusDistribution
            data={teamDash.data?.tasksByStatus}
            isLoading={teamDash.isLoading}
          />
          <MemberDistribution
            data={teamDash.data?.tasksByMember}
            isLoading={teamDash.isLoading}
          />
        </div>
      </DashboardSection>

      {/* Velocity mini-cards */}
      {teamDash.data && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
            <Zap className="h-5 w-5 text-[var(--status-done)]" />
            <div>
              <p className="text-lg font-bold">
                {teamDash.data.velocity?.tasksCompletedLast7Days ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Velocity (7 dias)</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
            <BarChart3 className="h-5 w-5 text-[var(--status-doing)]" />
            <div>
              <p className="text-lg font-bold">{teamDash.data.totalTasks}</p>
              <p className="text-xs text-muted-foreground">
                Total de intencoes
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
            <Activity className="h-5 w-5 text-[var(--ai-accent)]" />
            <div>
              <p className="text-lg font-bold">
                {(teamDash.data.velocity?.tasksCompletedLast7Days ?? 0) > 0
                  ? Math.round(
                      ((teamDash.data.velocity?.tasksCompletedLast7Days ?? 0) /
                        teamDash.data.totalTasks) *
                        100,
                    )
                  : 0}
                %
              </p>
              <p className="text-xs text-muted-foreground">Taxa semanal</p>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <DashboardSection icon={BarChart3} title="Graficos de Fluxo">
        <ThroughputChart
          data={throughput.data}
          isLoading={throughput.isLoading}
        />
        <CfdChart data={cfd.data} isLoading={cfd.isLoading} />
      </DashboardSection>

      {/* Forecasting */}
      <DashboardSection icon={TrendingUp} title="Previsibilidade">
        {projectId && <MonteCarloChart projectId={projectId} />}
        {projectId && <DailySummary projectId={projectId} />}
      </DashboardSection>

      {/* WIP Age Alerts */}
      <DashboardSection icon={AlertTriangle} title="Alertas">
        <WipAgeAlerts
          data={wipAge.data}
          isLoading={wipAge.isLoading}
          projectId={projectId ?? ""}
        />
      </DashboardSection>

      {/* No data at all */}
      {!flowDash.isLoading &&
        !teamDash.isLoading &&
        flow?.totalCards === 0 &&
        teamDash.data?.totalTasks === 0 && (
          <EmptyMetrics
            title="Projeto sem intencoes"
            description="Crie intencoes para comecar a gerar metricas de fluxo."
          />
        )}
    </PageTransition>
  );
}
