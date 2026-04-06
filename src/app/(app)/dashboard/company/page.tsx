"use client";

import {
  Building2,
  FolderKanban,
  ListChecks,
  CheckCircle,
  BarChart3,
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { ProjectProgressBar } from "@/components/dashboard/project-progress-bar";
import { EmptyMetrics } from "@/components/dashboard/empty-metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageTransition } from "@/components/common/page-transition";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { useCompanyDashboard } from "@/lib/hooks/use-dashboards";

export default function CompanyDashboardPage() {
  usePageTitle("Visao da Empresa");
  const { data, isLoading } = useCompanyDashboard();

  const globalPercent =
    data && data.totalTasks > 0
      ? Math.round((data.totalDone / data.totalTasks) * 100)
      : 0;

  return (
    <PageTransition className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Visao da Empresa</h1>
        <p className="text-sm text-muted-foreground">
          Visao consolidada de todos os projetos da organizacao
        </p>
      </div>

      {/* KPI Cards */}
      <DashboardSection icon={BarChart3} title="Visao Geral">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icon={FolderKanban}
            title="Projetos"
            variant="purple"
            value={isLoading ? "-" : (data?.totalProjetos ?? 0)}
            subtitle="projetos ativos"
            isLoading={isLoading}
          />
          <KpiCard
            icon={ListChecks}
            title="Total Intencoes"
            variant="blue"
            value={isLoading ? "-" : (data?.totalTasks ?? 0)}
            subtitle="em todos os projetos"
            isLoading={isLoading}
          />
          <KpiCard
            icon={CheckCircle}
            title="Concluidas"
            variant="green"
            value={isLoading ? "-" : (data?.totalDone ?? 0)}
            subtitle={`${globalPercent}% do total`}
            isLoading={isLoading}
          />
          <KpiCard
            icon={Building2}
            title="Em Progresso"
            variant="amber"
            value={isLoading ? "-" : (data?.totalDoing ?? 0)}
            subtitle={`${data?.totalTodo ?? 0} a fazer`}
            isLoading={isLoading}
          />
        </div>
      </DashboardSection>

      {/* Project Progress List */}
      <DashboardSection icon={FolderKanban} title="Progresso por Projeto">
        {isLoading ? (
          <Card>
            <CardContent className="pt-6 space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-2.5 w-full" />
                  <Skeleton className="h-3 w-32" />
                </div>
              ))}
            </CardContent>
          </Card>
        ) : !data || data.projetos.length === 0 ? (
          <EmptyMetrics
            icon={FolderKanban}
            title="Nenhum projeto encontrado"
            description="Crie projetos para ver a visao consolidada da empresa."
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                {data.projetos.length} projetos ativos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {data.projetos.map((project) => (
                <ProjectProgressBar key={project.projectId} project={project} />
              ))}
            </CardContent>
          </Card>
        )}
      </DashboardSection>
    </PageTransition>
  );
}
