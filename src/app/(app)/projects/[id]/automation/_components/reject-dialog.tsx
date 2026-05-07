'use client'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

interface RejectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (reason: string) => void
  isPending: boolean
}

export function RejectDialog({ open, onOpenChange, onConfirm, isPending }: RejectDialogProps) {
  const [reason, setReason] = useState('')

  function handleConfirm() {
    if (!reason.trim()) return
    onConfirm(reason.trim())
  }

  function handleOpenChange(o: boolean) {
    if (!isPending) {
      onOpenChange(o)
      if (!o) setReason('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[14px]">Rejeitar execucao</DialogTitle>
          <DialogDescription className="text-[12px]">
            Informe o motivo da rejeicao. Sera registrado no historico de auditoria.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5 py-2">
          <Label htmlFor="reason" className="text-[12px]">Motivo</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Ex: Prompt menciona arquivo de producao sem aprovacao previa..."
            className="text-[13px] min-h-[80px] resize-none"
            disabled={isPending}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button variant="destructive" size="sm" onClick={handleConfirm} disabled={!reason.trim() || isPending}>
            {isPending && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
            Rejeitar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
