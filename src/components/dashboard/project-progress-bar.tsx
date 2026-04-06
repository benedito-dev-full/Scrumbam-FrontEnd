"use client";

import type { ProjectProgress } from "@/types";

interface ProjectProgressBarProps {
  project: ProjectProgress;
}

export function ProjectProgressBar({ project }: ProjectProgressBarProps) {
  const { todo, doing, done, totalTasks, percentConcluido, projectNome } =
    project;

  const todoPercent = totalTasks > 0 ? (todo / totalTasks) * 100 : 0;
  const doingPercent = totalTasks > 0 ? (doing / totalTasks) * 100 : 0;
  const donePercent = totalTasks > 0 ? (done / totalTasks) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium truncate max-w-[200px]">
          {projectNome}
        </span>
        <span className="text-xs text-muted-foreground ml-2 shrink-0">
          {percentConcluido}% concluido
        </span>
      </div>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
        {donePercent > 0 && (
          <div
            className="transition-all"
            style={{
              width: `${donePercent}%`,
              backgroundColor: "var(--status-done)",
            }}
            title={`Concluido: ${done}`}
          />
        )}
        {doingPercent > 0 && (
          <div
            className="transition-all"
            style={{
              width: `${doingPercent}%`,
              backgroundColor: "var(--status-doing)",
            }}
            title={`Em progresso: ${doing}`}
          />
        )}
        {todoPercent > 0 && (
          <div
            className="transition-all"
            style={{
              width: `${todoPercent}%`,
              backgroundColor: "var(--status-todo)",
              opacity: 0.6,
            }}
            title={`A fazer: ${todo}`}
          />
        )}
      </div>
      <div className="flex gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: "var(--status-done)" }}
          />
          {done} Done
        </span>
        <span className="flex items-center gap-1">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: "var(--status-doing)" }}
          />
          {doing} Doing
        </span>
        <span className="flex items-center gap-1">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: "var(--status-todo)", opacity: 0.6 }}
          />
          {todo} Todo
        </span>
      </div>
    </div>
  );
}
