"use client";

import Link from "next/link";
import { BookOpen, ArrowLeft } from "lucide-react";
import { PageTransition } from "@/components/common/page-transition";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { ConnectionGuide } from "@/components/projects/connection-guide";
import { Button } from "@/components/ui/button";

export default function ProjectSetupPage() {
  usePageTitle("Setup de Conexao");

  return (
    <PageTransition className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-emerald-500" />
            Setup de Conexao
          </h1>
          <p className="text-sm text-muted-foreground">
            Conecte o Claude Code ao Scrumban para gerenciar intencoes pelo
            terminal.
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 shrink-0" asChild>
          <Link href="/projects">
            <ArrowLeft className="h-4 w-4" />
            Voltar para Projetos
          </Link>
        </Button>
      </div>

      <div className="max-w-3xl">
        <ConnectionGuide />
      </div>
    </PageTransition>
  );
}
