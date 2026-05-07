'use client'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RiskBadge } from './risk-badge'
import { useExecution, useRollbackExecution } from '@/lib/hooks/use-automation'
import { EXECUTION_STATUS_CONFIG } from '@/lib/constants'
import { ExternalLink, GitBranch, Copy, Check, Loader2, RotateCcw } from 'lucide-react'
import type { Execution } from '@/types/execution'

interface ExecutionDetailModalProps {
  executionId: string | null
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExecutionDetailModal({
  executionId,
  projectId,
  open,
  onOpenChange,
}: ExecutionDetailModalProps) {
  const { data: execData, isLoading } = useExecution(executionId)
  const rollback = useRollbackExecution(projectId)
  const [copied, setCopied] = useState(false)
  const [confirmRollback, setConfirmRollback] = useState(false)

  // Compatibilidade: data pode vir wrapped em { data: Execution } ou direto
  const exec: Execution | undefined =
    (execData as unknown as { data?: Execution })?.data ?? (execData as unknown as Execution)

  async function handleCopyHash() {
    if (!exec?.commitHash) return
    await navigator.clipboard.writeText(exec.commitHash)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleRollback() {
    if (!executionId) return
    rollback.mutate(executionId, {
      onSuccess: () => {
        setConfirmRollback(false)
        onOpenChange(false)
      },
    })
  }

  const statusConfig = exec?.status ? EXECUTION_STATUS_CONFIG[exec.status] : null
  const stdout = exec?.claudeRuntimeData?.stdout?.slice(-5000) ?? ''
  const stderr = exec?.claudeRuntimeData?.stderr?.slice(-5000) ?? ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-[14px] flex items-center gap-2">
            Detalhes da Execucao
            {exec && statusConfig && (
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${statusConfig.className}`}>
                {statusConfig.label}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 space-y-3 py-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-8 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : exec ? (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Intencao */}
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1">
                Intencao
              </p>
              <p className="text-[13px] bg-muted/60 rounded-md px-3 py-2">{exec.intent}</p>
            </div>

            {/* Meta */}
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12px]">
              <div>
                <dt className="text-muted-foreground">Risco</dt>
                <dd className="mt-0.5">
                  <RiskBadge level={exec.riskLevel} explanation={exec.riskExplanation} size="sm" />
                </dd>
              </div>
              {exec.durationMs != null && (
                <div>
                  <dt className="text-muted-foreground">Duracao</dt>
                  <dd className="mt-0.5 font-mono">{(exec.durationMs / 1000).toFixed(1)}s</dd>
                </div>
              )}
              {exec.commitHash && (
                <div>
                  <dt className="text-muted-foreground">Commit</dt>
                  <dd className="mt-0.5 flex items-center gap-1">
                    <code className="font-mono text-[11px]">{exec.commitHash.slice(0, 7)}</code>
                    <button
                      onClick={handleCopyHash}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {copied ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                    {exec.pullRequestUrl && (
                      <a
                        href={exec.pullRequestUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </dd>
                </div>
              )}
              {exec.pullRequestUrl && (
                <div>
                  <dt className="text-muted-foreground">Pull Request</dt>
                  <dd className="mt-0.5">
                    <a
                      href={exec.pullRequestUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[12px] text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <GitBranch className="h-3 w-3" />
                      Ver PR
                    </a>
                  </dd>
                </div>
              )}
            </dl>

            {/* Arquivos afetados */}
            {exec.claudeRuntimeData?.filesAffected?.length ? (
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1">
                  Arquivos alterados ({exec.claudeRuntimeData.filesAffected.length})
                </p>
                <ul className="rounded-md bg-muted/60 divide-y divide-border/40 overflow-hidden">
                  {exec.claudeRuntimeData.filesAffected.map((f) => (
                    <li key={f} className="px-3 py-1.5 font-mono text-[11px] truncate">
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Output */}
            {stdout && (
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1">
                  Output
                </p>
                <pre className="rounded-md bg-muted p-3 text-[11px] font-mono overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap break-all">
                  {stdout}
                </pre>
              </div>
            )}

            {/* Stderr */}
            {stderr && (
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1">
                  Stderr
                </p>
                <pre className="rounded-md bg-destructive/5 border border-destructive/20 p-3 text-[11px] font-mono overflow-x-auto max-h-32 overflow-y-auto whitespace-pre-wrap break-all text-destructive">
                  {stderr}
                </pre>
              </div>
            )}

            {/* Rollback */}
            {exec.status === 'success' && exec.rollbackRef && (
              <div className="border-t border-border pt-3">
                {!confirmRollback ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-[12px] text-destructive border-destructive/30"
                    onClick={() => setConfirmRollback(true)}
                  >
                    <RotateCcw className="mr-1.5 h-3 w-3" />
                    Reverter esta execucao
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-[12px] text-muted-foreground">
                      Confirma o rollback para{' '}
                      <code className="font-mono text-[11px]">
                        {exec.rollbackRef?.slice(0, 7)}
                      </code>
                      ?
                    </p>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="text-[12px] h-7"
                      onClick={handleRollback}
                      disabled={rollback.isPending}
                    >
                      {rollback.isPending && (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      )}
                      Confirmar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[12px] h-7"
                      onClick={() => setConfirmRollback(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
