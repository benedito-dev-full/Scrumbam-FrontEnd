"use client";

import { User, CheckCircle, ListChecks, Target } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { EmptyMetrics } from "@/components/dashboard/empty-metrics";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageTransition } from "@/components/common/page-transition";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { useMyDashboard } from "@/lib/hooks/use-dashboards";
import { STATUS } from "@/lib/constants";

const STATUS_STYLES: Record<
  string,
  { label: string; cssVar: string; bgClass: string }
> = {
  [STATUS.TODO]: {
    label: "A Fazer",
    cssVar: "--status-todo",
    bgClass:
      "bg-[var(--status-todo)]/10 text-[var(--status-todo)] border-[var(--status-todo)]/20",
  },
  [STATUS.DOING]: {
    label: "Em Andamento",
    cssVar: "--status-doing",
    bgClass:
      "bg-[var(--status-doing)]/10 text-[var(--status-doing)] border-[var(--status-doing)]/20",
  },
  [STATUS.DONE]: {
    label: "Concluido",
    cssVar: "--status-done",
    bgClass:
      "bg-[var(--status-done)]/10 text-[var(--status-done)] border-[var(--status-done)]/20",
  },
};

export default function MyDashboardPage() {
  usePageTitle("Meu Painel");
  const { data, isLoading } = useMyDashboard();

  return (
    <PageTransition className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Meu Painel</h1>
        <p className="text-sm text-muted-foreground">
          {data
            ? `Ola, ${data.memberNome}! Aqui esta seu progresso.`
            : "Suas metricas pessoais em todos os projetos"}
        </p>
      </div>

      {/* KPI Cards */}
      <DashboardSection icon={Target} title="Suas Metricas">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard
            icon={ListChecks}
            title="Total de Intencoes"
            variant="blue"
            value={isLoading ? "-" : (data?.totalTasks ?? 0)}
            subtitle="intencoes atribuidas a voce"
            isLoading={isLoading}
          />
          <KpiCard
            icon={CheckCircle}
            title="Concluidas (30d)"
            variant="green"
            value={isLoading ? "-" : (data?.tasksCompletedLast30Days ?? 0)}
            subtitle="ultimos 30 dias"
            isLoading={isLoading}
          />
          <KpiCard
            icon={User}
            title="Taxa de Conclusao"
            variant="purple"
            value={
              isLoading
                ? "-"
                : data && data.totalTasks > 0
                  ? `${Math.round((data.tasksCompletedLast30Days / data.totalTasks) * 100)}%`
                  : "0%"
            }
            subtitle="concluidas / total"
            isLoading={isLoading}
          />
        </div>
      </DashboardSection>

      {/* Tasks by Status */}
      {isLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-36" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : !data || data.tasksByStatus.length === 0 ? (
        <EmptyMetrics
          icon={User}
          title="Sem intencoes atribuidas"
          description="Quando voce receber intencoes, elas aparecerao aqui."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Minhas Intencoes por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.tasksByStatus.map((item) => {
                const style = STATUS_STYLES[item.statusId] || {
                  label: item.statusNome,
                  cssVar: "--status-backlog",
                  bgClass: "bg-muted text-muted-foreground",
                };
                return (
                  <div
                    key={item.statusId}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <Badge className={style.bgClass} variant="secondary">
                      {style.label}
                    </Badge>
                    <span className="text-lg font-semibold">{item.count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </PageTransition>
  );
}
