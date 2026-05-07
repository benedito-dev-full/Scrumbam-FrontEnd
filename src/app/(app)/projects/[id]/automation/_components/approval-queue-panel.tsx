'use client'
import { useState } from 'react'
import { ShieldAlert, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RiskBadge } from './risk-badge'
import { RejectDialog } from './reject-dialog'
import { useExecutionsByStatus, useApproveExecution, useRejectExecution } from '@/lib/hooks/use-automation'
import type { Execution } from '@/types/execution'

// Utilitario de data relativa (sem dependencia adicional, data-fns ja disponivel)
function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return 'agora'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m atras`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h atras`
  return `${Math.floor(hr / 24)}d atras`
}

interface ApprovalQueuePanelProps {
  projectId: string
}

export function ApprovalQueuePanel({ projectId }: ApprovalQueuePanelProps) {
  const [rejectTarget, setRejectTarget] = useState<string | null>(null)
  const { data, isLoading } = useExecutionsByStatus(projectId, 'awaiting_approval')
  const approve = useApproveExecution(projectId)
  const reject = useRejectExecution(projectId)

  // Compatibilidade com formato de resposta (data pode ser wrapped ou direto)
  const rawData = (data as unknown as { data?: { items?: Execution[] }; items?: Execution[] })
  const executions: Execution[] = rawData?.data?.items ?? rawData?.items ?? []

  // Nao renderiza se vazio e nao carregando
  if (!isLoading && executions.length === 0) return null

  return (
    <>
      <section className="rounded-md border border-border bg-card overflow-hidden border-l-4 border-l-purple-500">
        <header className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border bg-card/40">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-3.5 w-3.5 text-purple-500" />
            <h2 className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
              Aprovacoes Pendentes
            </h2>
            {executions.length > 0 && (
              <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-purple-500 text-[10px] font-bold text-white">
                {executions.length}
              </span>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Atualiza a cada 15s
          </span>
        </header>

        {isLoading && executions.length === 0 ? (
          <div className="px-4 py-4 space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <ul className="divide-y divide-border/40">
            {executions.map((exec) => (
              <li key={exec.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <p className="text-[13px] font-medium line-clamp-2">{exec.intent}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <RiskBadge level={exec.riskLevel} explanation={exec.riskExplanation} size="sm" />
                      <span className="text-[11px] text-muted-foreground">
                        {formatRelative(exec.createdAt)}
                      </span>
                    </div>
                    {exec.riskExplanation && (
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {exec.riskExplanation}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[12px] text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => setRejectTarget(exec.id)}
                      disabled={approve.isPending || reject.isPending}
                    >
                      <XCircle className="mr-1 h-3 w-3" />
                      Rejeitar
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 text-[12px]"
                      onClick={() => approve.mutate(exec.id)}
                      disabled={approve.isPending || reject.isPending}
                    >
                      {approve.isPending ? (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      ) : (
                        <CheckCircle className="mr-1 h-3 w-3" />
                      )}
                      Aprovar
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <RejectDialog
        open={!!rejectTarget}
        onOpenChange={o => { if (!o) setRejectTarget(null) }}
        isPending={reject.isPending}
        onConfirm={(reason) => {
          if (!rejectTarget) return
          reject.mutate(
            { executionId: rejectTarget, reason },
            { onSuccess: () => setRejectTarget(null) },
          )
        }}
      />
    </>
  )
}
