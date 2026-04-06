"use client";

import { useState } from "react";
import { FileText, Copy, Check, Clock, Zap, ListTodo } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useStakeholderReport } from "@/lib/hooks/use-analytics";

interface StakeholderReportProps {
  projectId: string;
}

export function StakeholderReportCard({ projectId }: StakeholderReportProps) {
  const { data, isLoading } = useStakeholderReport(projectId);
  const [copied, setCopied] = useState(false);

  const handleCopyJson = () => {
    if (!data) return;
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    toast.success("Relatorio copiado para clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyText = () => {
    if (!data) return;
    const text = [
      `Relatorio: ${data.projectNome}`,
      `Periodo: ${data.periodDays} dias`,
      "",
      "Resumo:",
      `  Total: ${data.summary.totalTasks} intencoes`,
      `  Concluidas: ${data.summary.tasksCompleted} (${data.summary.completionPercent.toFixed(0)}%)`,
      `  Em progresso: ${data.summary.tasksInProgress}`,
      `  Pendentes: ${data.summary.tasksPending}`,
      "",
      "Performance:",
      `  Cycle Time Medio: ${data.performance.avgCycleTimeDays != null ? data.performance.avgCycleTimeDays.toFixed(1) + " dias" : "N/A"}`,
      `  Throughput: ${data.performance.throughputPerWeek.toFixed(1)} intencoes/semana`,
      `  WIP: ${data.performance.wipCount}`,
      "",
      "Previsao:",
      `  Backlog: ${data.forecast.backlogSize} intencoes`,
      `  Conclusao estimada: ${data.forecast.estimatedCompletionDate ?? "N/A"}`,
    ].join("\n");

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Relatorio em texto copiado");
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Relatorio para Stakeholders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Relatorio para Stakeholders
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={handleCopyText}
          >
            {copied ? (
              <Check className="h-3 w-3 mr-1" />
            ) : (
              <Copy className="h-3 w-3 mr-1" />
            )}
            Texto
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={handleCopyJson}
          >
            {copied ? (
              <Check className="h-3 w-3 mr-1" />
            ) : (
              <Copy className="h-3 w-3 mr-1" />
            )}
            JSON
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-2">
            {data.projectNome} - Ultimos {data.periodDays} dias
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-md border p-3 text-center">
              <p className="text-lg font-bold">{data.summary.totalTasks}</p>
              <p className="text-[11px] text-muted-foreground">Total</p>
            </div>
            <div className="rounded-md border p-3 text-center">
              <p
                className="text-lg font-bold"
                style={{ color: "var(--status-done)" }}
              >
                {data.summary.tasksCompleted}
              </p>
              <p className="text-[11px] text-muted-foreground">Concluidas</p>
            </div>
            <div className="rounded-md border p-3 text-center">
              <p
                className="text-lg font-bold"
                style={{ color: "var(--status-doing)" }}
              >
                {data.summary.tasksInProgress}
              </p>
              <p className="text-[11px] text-muted-foreground">Em progresso</p>
            </div>
            <div className="rounded-md border p-3 text-center">
              <p
                className="text-lg font-bold"
                style={{ color: "var(--status-review)" }}
              >
                {data.summary.tasksPending}
              </p>
              <p className="text-[11px] text-muted-foreground">Pendentes</p>
            </div>
          </div>
          <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${data.summary.completionPercent}%`,
                backgroundColor: "var(--status-done)",
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {data.summary.completionPercent.toFixed(0)}% concluido
          </p>
        </div>

        <Separator />

        <div>
          <h4 className="text-sm font-medium mb-2">Performance</h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-semibold">
                  {data.performance.avgCycleTimeDays != null
                    ? `${data.performance.avgCycleTimeDays.toFixed(1)}d`
                    : "N/A"}
                </p>
                <p className="text-[11px] text-muted-foreground">Cycle Time</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Zap className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-semibold">
                  {data.performance.throughputPerWeek.toFixed(1)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Intencoes/semana
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <ListTodo className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-semibold">
                  {data.performance.wipCount}
                </p>
                <p className="text-[11px] text-muted-foreground">WIP</p>
              </div>
            </div>
          </div>
        </div>

        {data.forecast.backlogSize > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-1">Previsao</h4>
              <p className="text-sm text-muted-foreground">
                {data.forecast.backlogSize} intencoes restantes
                {data.forecast.weeksToComplete != null && (
                  <> — conclusao em ~{data.forecast.weeksToComplete} semanas</>
                )}
                {data.forecast.estimatedCompletionDate && (
                  <> ({data.forecast.estimatedCompletionDate})</>
                )}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
