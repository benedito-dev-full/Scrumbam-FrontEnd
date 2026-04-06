"use client";

import { use } from "react";
import { PageTransition } from "@/components/common/page-transition";
import { IntentionDetail } from "@/components/intentions/intention-detail";
import { useIntention } from "@/lib/hooks/use-intentions";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { Skeleton } from "@/components/ui/skeleton";

interface IntentionDetailPageProps {
  params: Promise<{ projectId: string; intentionId: string }>;
}

export default function IntentionDetailPage({
  params,
}: IntentionDetailPageProps) {
  const { projectId, intentionId } = use(params);
  const { data: intention, isLoading } = useIntention(intentionId);

  usePageTitle(intention?.title ? `${intention.title}` : "Intencao");

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mt-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!intention) {
    return (
      <PageTransition className="flex flex-col items-center justify-center py-20">
        <p className="text-lg font-semibold text-muted-foreground">
          Intencao nao encontrada
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Verifique o ID e tente novamente.
        </p>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <IntentionDetail intention={intention} projectId={projectId} />
    </PageTransition>
  );
}
