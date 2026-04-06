"use client";

import { use } from "react";
import { PageTransition } from "@/components/common/page-transition";
import { IntentionList } from "@/components/intentions/intention-list";
import { usePageTitle } from "@/lib/hooks/use-page-title";

interface IntentionsProjectPageProps {
  params: Promise<{ projectId: string }>;
}

export default function IntentionsProjectPage({
  params,
}: IntentionsProjectPageProps) {
  const { projectId } = use(params);

  usePageTitle("Intencoes");

  return (
    <PageTransition>
      <IntentionList projectId={projectId} />
    </PageTransition>
  );
}
