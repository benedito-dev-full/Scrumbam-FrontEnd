"use client";

import { use } from "react";

import { PageTransition } from "@/components/common/page-transition";
import { IssueDetailBody } from "@/components/issues/issue-detail-body";
import { IssueDetailHeader } from "@/components/issues/issue-detail-header";

interface IssueDetailPageProps {
  params: Promise<{ id: string; issueId: string }>;
}

export default function IssueDetailPage({ params }: IssueDetailPageProps) {
  const { id: projectId, issueId: intentionId } = use(params);

  return (
    <PageTransition className="h-full">
      <div className="flex h-full flex-col">
        <IssueDetailHeader
          variant="page"
          projectId={projectId}
          intentionId={intentionId}
        />
        <IssueDetailBody
          variant="page"
          projectId={projectId}
          intentionId={intentionId}
        />
      </div>
    </PageTransition>
  );
}
