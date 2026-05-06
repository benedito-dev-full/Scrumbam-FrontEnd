"use client";

import { Construction } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageTransition } from "@/components/common/page-transition";

interface SidebarStubProps {
  title: string;
  description: string;
  gapRef?: string;
  icon?: LucideIcon;
}

/**
 * Placeholder Linear-style para rotas da sidebar que ainda nao tem schema/feature.
 * Usado para evitar 404 em itens marcados `stub: true` no navigation.
 */
export function SidebarStub({
  title,
  description,
  gapRef,
  icon: Icon = Construction,
}: SidebarStubProps) {
  return (
    <PageTransition className="h-full">
      <div className="flex h-full flex-col">
        <header className="flex h-11 shrink-0 items-center px-8 border-b border-border">
          <h1 className="text-[13px] font-medium">{title}</h1>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center px-8 py-16 text-center">
          <Icon className="h-12 w-12 text-muted-foreground/30" strokeWidth={1.25} />
          <h2 className="mt-4 text-base font-medium">{title}</h2>
          <p className="mt-1.5 max-w-md text-[13px] text-muted-foreground leading-relaxed">
            {description}
          </p>
          {gapRef && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 text-[11px] text-muted-foreground/80">
              <Construction className="h-3 w-3" />
              {gapRef}
            </p>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
