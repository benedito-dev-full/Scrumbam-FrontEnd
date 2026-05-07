'use client'
import { useState } from 'react'
import { Play, Loader2, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { RiskBadge } from './risk-badge'
import { useDispatchExecution } from '@/lib/hooks/use-automation'
import { useTasks } from '@/lib/hooks/use-projects'
import type { RiskLevel } from '@/types/execution'
import type { Task } from '@/types'

// Estimativa de risco baseada no texto da intencao (frontend apenas)
function estimateRisk(intent: string): RiskLevel {
  const lower = intent.toLowerCase()
  if (/migration|drop|delete|\.env|secret|password|production|prod|deploy|force/.test(lower)) return 'HIGH'
  if (/refactor|migrate|schema|database|config|dependency|package/.test(lower)) return 'MEDIUM'
  return 'LOW'
}

interface ExecuteIntentionPanelProps {
  projectId: string
}

export function ExecuteIntentionPanel({ projectId }: ExecuteIntentionPanelProps) {
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null)
  const { data: tasks, isLoading } = useTasks(projectId)
  const dispatch = useDispatchExecution(projectId)

  // Filtra intenções INBOX e READY no frontend (evita dependencia de statusId hardcoded)
  const activeTasks = (tasks ?? []).filter((t: Task) => {
    const code = (t.status?.codigo ?? '').toUpperCase()
    return code === 'INBOX' || code === 'READY' || code === '' || !code
  }).slice(0, 10)

  async function handleConfirm() {
    if (!selected) return
    await dispatch.mutateAsync(selected.id)
    setSelected(null)
  }

  const estimatedRisk: RiskLevel | null = selected ? estimateRisk(selected.name) : null

  return (
    <>
      <section className="rounded-md border border-border bg-card overflow-hidden">
        <header className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-card/40">
          <Zap className="h-3.5 w-3.5 text-muted-foreground" />
          <h2 className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
            Disparar Execucao
          </h2>
        </header>

        {isLoading ? (
          <div className="px-4 py-4 space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-8 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : !activeTasks.length ? (
          <div className="flex flex-col items-center justify-center px-8 py-10 text-center">
            <Play className="h-8 w-8 text-muted-foreground/30" strokeWidth={1.25} />
            <p className="mt-2 text-[13px] font-medium">Nenhuma intencao disponivel</p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Crie intencoes no INBOX ou mova para READY para disparar execucoes.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border/40">
            {activeTasks.map((task: Task) => {
              const taskId = String(task.chave)
              const taskName = task.titulo
              const statusCode = (task.status?.codigo ?? 'INBOX').toUpperCase()
              return (
                <li
                  key={taskId}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-accent/40 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] truncate font-medium">{taskName}</p>
                    <p className="text-[11px] text-muted-foreground uppercase">
                      {statusCode}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[12px] shrink-0"
                    onClick={() => setSelected({ id: taskId, name: taskName })}
                  >
                    <Play className="mr-1.5 h-3 w-3" />
                    Executar
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <Dialog
        open={!!selected}
        onOpenChange={o => { if (!dispatch.isPending && !o) setSelected(null) }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[14px]">Confirmar execucao</DialogTitle>
            <DialogDescription className="text-[12px]">
              O Claude Code sera executado na VPS do projeto com a intencao abaixo.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="py-2 space-y-3">
              <div className="rounded-md bg-muted/60 px-3 py-2">
                <p className="text-[13px]">{selected.name}</p>
              </div>
              {estimatedRisk && (
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-muted-foreground">Risco estimado:</span>
                  <RiskBadge level={estimatedRisk} />
                  {estimatedRisk === 'HIGH' && (
                    <span className="text-[11px] text-muted-foreground">
                      (exigira aprovacao manual)
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelected(null)}
              disabled={dispatch.isPending}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={dispatch.isPending}
            >
              {dispatch.isPending && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
              Confirmar execucao
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
