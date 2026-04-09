"use client";

import Link from "next/link";
import { AlertTriangle, Clock, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyMetrics } from "./empty-metrics";
import type { WipAgeResponse } from "@/types";

interface WipAgeAlertsProps {
  data: WipAgeResponse | undefined;
  isLoading?: boolean;
  projectId: string;
}

export function WipAgeAlerts({
  data,
  isLoading,
  projectId,
}: WipAgeAlertsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!data || data.cards.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">WIP Age</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyMetrics
            icon={AlertTriangle}
            title="Nenhuma intencao em WIP"
            description="Todas as intencoes estao na coluna final ou nao existem intencoes no projeto"
          />
        </CardContent>
      </Card>
    );
  }

  const agingCards = data.cards.filter((c) => c.isAging);
  const normalCards = data.cards.filter((c) => !c.isAging);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            WIP Age
          </CardTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Threshold: {data.agingThresholdDays.toFixed(1)} dias</span>
            {data.agingCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {data.agingCount} alertas
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Aging cards first (with alert) */}
          {agingCards.map((card) => (
            <WipAgeCard
              key={card.taskId}
              card={card}
              projectId={projectId}
              isAging
            />
          ))}

          {/* Normal WIP cards */}
          {normalCards.map((card) => (
            <WipAgeCard
              key={card.taskId}
              card={card}
              projectId={projectId}
              isAging={false}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function WipAgeCard({
  card,
  isAging,
}: {
  card: WipAgeResponse["cards"][number];
  projectId?: string;
  isAging: boolean;
}) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between rounded-md p-3 text-sm transition-colors gap-2 sm:gap-0 ${
        isAging
          ? "border-l-[3px] border-l-[var(--priority-high)] border border-[var(--priority-high)]/20 bg-[var(--priority-high)]/5"
          : "border border-border bg-card"
      }`}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {isAging && (
          <AlertTriangle className="h-4 w-4 shrink-0 text-[var(--priority-high)]" />
        )}
        <span className="truncate font-medium">{card.titulo}</span>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 sm:ml-2">
        <Badge variant="outline" className="text-xs">
          {card.columnName}
        </Badge>
        <span
          className={`text-xs font-mono ${isAging ? "text-[var(--priority-high)] font-semibold" : "text-muted-foreground"}`}
        >
          {card.ageDays.toFixed(1)}d
        </span>
        <Link
          href="/intentions"
          className="text-muted-foreground hover:text-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center sm:min-h-0 sm:min-w-0"
          title="Ver intencoes"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
