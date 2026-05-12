import { IssueModal } from "@/components/issues/issue-modal";

interface InterceptedIssuePageProps {
  params: Promise<{ id: string; issueId: string }>;
}

export default async function InterceptedIssuePage({
  params,
}: InterceptedIssuePageProps) {
  const { id, issueId } = await params;
  return <IssueModal projectId={id} issueId={issueId} />;
}
