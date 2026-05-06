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
  FileDown,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
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
import {
  useTeamDashboard,
  useFlowDashboard,
  useThroughput,
  useCfd,
  useWipAge,
} from "@/lib/hooks/use-dashboards";
import { reportsApi } from "@/lib/api/reports";

interface ProjectInsightsProps {
  projectId: string;
}

/**
 * Tab "Insights" do Project detail.
 * KPIs de fluxo, distribuicoes, charts de throughput/CFD, forecasting Monte Carlo
 * e alertas de WIP. Migrada de /dashboard/[projectId] (Fase 2 de limpeza).
 */
export function ProjectInsights({ projectId }: ProjectInsightsProps) {
  const [period, setPeriod] = useState(30);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPdf = useCallback(async () => {
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

  const teamDash = useTeamDashboard(projectId);
  const flowDash = useFlowDashboard(projectId, period);
  const throughput = useThroughput(projectId, period);
  const cfd = useCfd(projectId, period);
  const wipAge = useWipAge(projectId);

  const isKpiLoading = flowDash.isLoading;
  const flow = flowDash.data;

  return (
    <div className="px-8 py-6 space-y-8">
      {/* Period selector + export */}
      <div className="flex items-center justify-end gap-2">
        <PeriodSelector value={period} onChange={setPeriod} />
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportPdf}
          disabled={isExporting}
          className="text-[12px] h-8"
        >
          {isExporting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <FileDown className="h-3 w-3" />
          )}
          <span className="ml-1.5">Export PDF</span>
        </Button>
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

      {/* Distributions */}
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
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
            <Zap className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="text-lg font-bold">
                {teamDash.data.velocity?.tasksCompletedLast7Days ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Velocity (7 dias)</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
            <BarChart3 className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-lg font-bold">{teamDash.data.totalTasks}</p>
              <p className="text-xs text-muted-foreground">
                Total de intencoes
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
            <Activity className="h-5 w-5 text-violet-500" />
            <div>
              <p className="text-lg font-bold">
                {(teamDash.data.velocity?.tasksCompletedLast7Days ?? 0 > 0)
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
        <MonteCarloChart projectId={projectId} />
        <DailySummary projectId={projectId} />
      </DashboardSection>

      {/* WIP Age Alerts */}
      <DashboardSection icon={AlertTriangle} title="Alertas">
        <WipAgeAlerts
          data={wipAge.data}
          isLoading={wipAge.isLoading}
          projectId={projectId}
        />
      </DashboardSection>

      {/* Empty */}
      {!flowDash.isLoading &&
        !teamDash.isLoading &&
        flow?.totalCards === 0 &&
        teamDash.data?.totalTasks === 0 && (
          <EmptyMetrics
            title="Projeto sem intencoes"
            description="Crie intencoes para comecar a gerar metricas de fluxo."
          />
        )}
    </div>
  );
}
