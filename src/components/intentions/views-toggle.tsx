"use client";

import Link from "next/link";
import { ScrollText, BarChart3, Mountain } from "lucide-react";
import { cn } from "@/lib/utils";

type ViewKey = "intentions" | "hill-chart" | "timeline";

interface ViewsToggleProps {
  projectId: string;
  currentView: ViewKey;
}

const views: Array<{
  key: ViewKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  getHref: (pid: string) => string;
}> = [
  {
    key: "intentions",
    label: "Intencoes",
    icon: ScrollText,
    getHref: (pid) => `/projects/${pid}`,
  },
  {
    key: "hill-chart",
    label: "Hill Chart",
    icon: Mountain,
    getHref: (pid) => `/projects/${pid}?view=hill`,
  },
  {
    key: "timeline",
    label: "Timeline",
    icon: BarChart3,
    getHref: (pid) => `/dashboard/${pid}`,
  },
];

export function ViewsToggle({ projectId, currentView }: ViewsToggleProps) {
  return (
    <div className="inline-flex items-center rounded-lg bg-muted p-1 gap-0.5">
      {views.map((view) => {
        const isActive = view.key === currentView;
        const Icon = view.icon;

        return (
          <Link
            key={view.key}
            href={view.getHref(projectId)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {view.label}
          </Link>
        );
      })}
    </div>
  );
}
