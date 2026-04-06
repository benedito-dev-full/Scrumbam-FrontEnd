"use client";

import { Bot, User } from "lucide-react";
import type { TimelineEvent } from "@/types/intention";

interface IntentionTimelineProps {
  events: TimelineEvent[];
}

export function IntentionTimeline({ events }: IntentionTimelineProps) {
  if (events.length === 0) return null;

  // Show newest first
  const sorted = [...events].reverse();

  return (
    <div className="space-y-0">
      {sorted.map((event, idx) => {
        const isLast = idx === sorted.length - 1;
        const isSystem = event.actorType === "system";
        const time = formatTimestamp(event.timestamp);

        return (
          <div key={event.id} className="flex gap-3">
            {/* Vertical line + dot */}
            <div className="flex flex-col items-center">
              <div
                className={`flex items-center justify-center h-6 w-6 rounded-full shrink-0 ${
                  isSystem
                    ? "bg-[var(--ai-accent-muted)] text-[var(--ai-accent)]"
                    : "bg-primary/10 text-primary"
                }`}
              >
                {isSystem ? (
                  <Bot className="h-3 w-3" />
                ) : (
                  <User className="h-3 w-3" />
                )}
              </div>
              {!isLast && (
                <div className="w-px flex-1 min-h-[24px] bg-border" />
              )}
            </div>

            {/* Content */}
            <div className="pb-4 min-w-0 flex-1">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                  {time}
                </span>
                <span className="text-xs font-semibold truncate">
                  {event.actor}
                </span>
              </div>
              <p className="text-sm text-foreground/80 mt-0.5">
                {event.action}
              </p>
              {event.details && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {event.details}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatTimestamp(iso: string): string {
  try {
    const date = new Date(iso);
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "--:--";
  }
}
