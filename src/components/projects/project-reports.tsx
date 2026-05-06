"use client";

import { TrendingUp, Calendar } from "lucide-react";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { PeriodComparison } from "@/components/analytics/period-comparison";
import { CapacityForecastCard } from "@/components/analytics/capacity-forecast";
import { StakeholderReportCard } from "@/components/analytics/stakeholder-report";

interface ProjectReportsProps {
  projectId: string;
}

/**
 * Tab "Reports" do Project detail.
 * Period comparison, capacity forecast e stakeholder report.
 * Migrada de /analytics/[projectId] (Fase 2 de limpeza).
 */
export function ProjectReports({ projectId }: ProjectReportsProps) {
  return (
    <div className="px-8 py-6 space-y-8">
      <DashboardSection icon={TrendingUp} title="Performance">
        <div className="grid gap-4 md:grid-cols-2">
          <PeriodComparison projectId={projectId} />
          <CapacityForecastCard projectId={projectId} />
        </div>
      </DashboardSection>

      <DashboardSection icon={Calendar} title="Relatorios">
        <StakeholderReportCard projectId={projectId} />
      </DashboardSection>
    </div>
  );
}
