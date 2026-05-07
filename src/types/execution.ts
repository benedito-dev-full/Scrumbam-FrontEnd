export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH'
export type ApprovalFlow = 'queued' | 'awaiting_approval' | 'approved' | 'rejected' | 'expired'
export type ExecutionStatus = 'queued' | 'running' | 'success' | 'failed' | 'timeout' | 'rolled_back'

export interface Execution {
  id: string
  intent: string
  status: ExecutionStatus
  approvalFlow: ApprovalFlow
  riskLevel: RiskLevel
  riskExplanation: string
  claudeRuntimeData?: {
    stdout?: string
    stderr?: string
    exitCode?: number
    filesAffected?: string[]
  }
  pullRequestUrl?: string
  commitHash?: string
  rollbackRef?: string
  createdAt: string
  executedAt?: string
  approvedAt?: string
  rejectedAt?: string
  rejectedReason?: string
  createdBy: string
  approvedBy?: string
  durationMs?: number
}

export interface ClaudeCredentialStatus {
  configured: boolean
  account?: string
  error?: string
}

export interface ExecutionListResponse {
  items: Execution[]
  nextCursor?: string
  total: number
}
