"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  icon: LucideIcon;
  title: string;
  badge?: string | number;
  variant?: "default" | "ai" | "agent";
  collapsible?: boolean;
  defaultOpen?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  icon: Icon,
  title,
  badge,
  variant = "default",
  collapsible = false,
  defaultOpen = true,
  children,
  className,
}: SectionHeaderProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const headerContent = (
    <div
      className={cn(
        "flex items-center gap-2 py-2",
        collapsible && "cursor-pointer select-none",
        variant === "ai" &&
          "bg-[var(--ai-accent-muted)] border-l-[3px] border-l-[var(--ai-accent)] px-3 rounded-r-md -mx-1",
        variant === "agent" &&
          "bg-[var(--ai-accent-muted)] border-l-[3px] border-l-[var(--ai-accent)] px-3 rounded-r-md -mx-1",
        className,
      )}
      onClick={collapsible ? () => setIsOpen(!isOpen) : undefined}
      role={collapsible ? "button" : undefined}
      tabIndex={collapsible ? 0 : undefined}
      onKeyDown={
        collapsible
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsOpen(!isOpen);
              }
            }
          : undefined
      }
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0",
          variant === "default" && "text-muted-foreground",
          variant === "ai" && "text-[var(--ai-accent)]",
          variant === "agent" && "text-[var(--ai-accent)]",
        )}
      />
      <h3
        className={cn(
          "text-sm font-medium flex-1",
          variant === "default" && "text-foreground",
          variant === "ai" && "text-foreground",
          variant === "agent" && "text-foreground",
        )}
      >
        {title}
      </h3>
      {badge != null && (
        <span
          className={cn(
            "text-[10px] font-medium rounded-full px-1.5 py-0.5",
            variant === "default" && "bg-muted text-muted-foreground",
            variant === "ai" &&
              "bg-[var(--ai-accent)]/15 text-[var(--ai-accent)]",
            variant === "agent" &&
              "bg-[var(--ai-accent)]/15 text-[var(--ai-accent)]",
          )}
        >
          {badge}
        </span>
      )}
      {collapsible &&
        (isOpen ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        ))}
    </div>
  );

  if (!collapsible) {
    return (
      <div>
        {headerContent}
        {children}
      </div>
    );
  }

  return (
    <div>
      {headerContent}
      {isOpen && children}
    </div>
  );
}
