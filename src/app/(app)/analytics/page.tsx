"use client";

import { useState } from "react";
import { BarChart3, TrendingUp, Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageTransition } from "@/components/common/page-transition";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { useProjects } from "@/lib/hooks/use-projects";
import { PeriodComparison } from "@/components/analytics/period-comparison";
import { CapacityForecastCard } from "@/components/analytics/capacity-forecast";
import { StakeholderReportCard } from "@/components/analytics/stakeholder-report";

export default function AnalyticsPage() {
  const { data: projects, isLoading } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );

  usePageTitle("Analytics");

  const projectId =
    selectedProjectId ??
    (projects && projects.length > 0 ? projects[0].chave : null);

  const selectedProject = projects?.find((p) => p.chave === projectId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Analise avancada de performance
          </p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card p-12 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">Nenhum projeto</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Crie um projeto primeiro para ver analytics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <PageTransition className="space-y-8">
      {/* Header com seletor de projeto */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-[var(--scrumban-brand)]" />
            Analytics
          </h1>
          <p className="text-sm text-muted-foreground">
            Analise de performance
            {selectedProject ? ` — ${selectedProject.nome}` : ""}
          </p>
        </div>
        <Select value={projectId ?? ""} onValueChange={setSelectedProjectId}>
          <SelectTrigger className="w-[200px] text-sm">
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
      </div>

      {projectId && (
        <>
          <DashboardSection icon={TrendingUp} title="Performance">
            <div className="grid gap-4 md:grid-cols-2">
              <PeriodComparison projectId={projectId} />
              <CapacityForecastCard projectId={projectId} />
            </div>
          </DashboardSection>

          <DashboardSection icon={Calendar} title="Relatorios">
            <StakeholderReportCard projectId={projectId} />
          </DashboardSection>
        </>
      )}
    </PageTransition>
  );
}
