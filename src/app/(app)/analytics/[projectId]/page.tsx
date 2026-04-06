"use client";

import { use } from "react";
import { BarChart3, TrendingUp, Calendar } from "lucide-react";
import { PageTransition } from "@/components/common/page-transition";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { useProject } from "@/lib/hooks/use-projects";
import { PeriodComparison } from "@/components/analytics/period-comparison";
import { CapacityForecastCard } from "@/components/analytics/capacity-forecast";
import { StakeholderReportCard } from "@/components/analytics/stakeholder-report";

export default function AnalyticsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  usePageTitle("Analytics");
  const { data: project } = useProject(projectId);

  return (
    <PageTransition className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-[var(--scrumban-brand)]" />
          Analytics
        </h1>
        {project && (
          <p className="text-sm text-muted-foreground">{project.nome}</p>
        )}
      </div>

      <DashboardSection icon={TrendingUp} title="Performance">
        <div className="grid gap-4 md:grid-cols-2">
          <PeriodComparison projectId={projectId} />
          <CapacityForecastCard projectId={projectId} />
        </div>
      </DashboardSection>

      <DashboardSection icon={Calendar} title="Relatorios">
        <StakeholderReportCard projectId={projectId} />
      </DashboardSection>
    </PageTransition>
  );
}
