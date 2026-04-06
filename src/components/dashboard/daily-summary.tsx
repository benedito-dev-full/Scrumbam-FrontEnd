"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyMetrics } from "./empty-metrics";
import { Newspaper, Plus, CheckCheck, ArrowRight, Zap } from "lucide-react";
import { useDailySummary } from "@/lib/hooks/use-dashboards";
import { Skeleton } from "@/components/ui/skeleton";

interface DailySummaryProps {
  projectId: string;
}

function KpiItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-md bg-muted p-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="text-lg font-semibold">{value}</p>
      </div>
    </div>
  );
}

function KpiSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <Skeleton className="h-8 w-8 rounded-md" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-8" />
      </div>
    </div>
  );
}

export function DailySummary({ projectId }: DailySummaryProps) {
  const { data, isLoading, isError } = useDailySummary(projectId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Newspaper className="h-4 w-4" />
          Resumo Diario
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="grid grid-cols-2 gap-4">
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
          </div>
        )}

        {isError && (
          <EmptyMetrics description="Erro ao carregar resumo diario" />
        )}

        {!isLoading && !isError && !data && (
          <EmptyMetrics description="Sem dados para gerar resumo diario" />
        )}

        {data && (
          <div className="grid grid-cols-2 gap-4">
            <KpiItem
              icon={Plus}
              label="Criadas hoje"
              value={data.createdToday}
            />
            <KpiItem
              icon={CheckCheck}
              label="Completadas hoje"
              value={data.completedToday}
            />
            <KpiItem
              icon={ArrowRight}
              label="Movidas hoje"
              value={data.movedToday}
            />
            <KpiItem icon={Zap} label="Em execucao" value={data.activeNow} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
