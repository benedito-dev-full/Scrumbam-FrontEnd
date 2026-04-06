"use client";

import { Calendar, ListTodo, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCapacityForecast } from "@/lib/hooks/use-analytics";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CapacityForecastProps {
  projectId: string;
}

export function CapacityForecastCard({ projectId }: CapacityForecastProps) {
  const { data, isLoading } = useCapacityForecast(projectId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Previsao de Capacidade</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Previsao de Capacidade</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-start gap-2">
            <ListTodo className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xl font-bold">{data.backlogSize}</p>
              <p className="text-xs text-muted-foreground">
                Intencoes pendentes
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Zap className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xl font-bold">
                {data.avgWeeklyThroughput.toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground">Intencoes/semana</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xl font-bold">
                {data.weeksToComplete != null
                  ? `${data.weeksToComplete} sem`
                  : "--"}
              </p>
              <p className="text-xs text-muted-foreground">Para concluir</p>
            </div>
          </div>
        </div>

        {data.estimatedCompletionDate && (
          <p className="text-sm text-muted-foreground border-t pt-3">
            Conclusao estimada:{" "}
            <span className="font-medium text-foreground">
              {format(parseISO(data.estimatedCompletionDate), "dd MMM yyyy", {
                locale: ptBR,
              })}
            </span>
          </p>
        )}

        <p className="text-xs text-muted-foreground italic">{data.summary}</p>
      </CardContent>
    </Card>
  );
}
