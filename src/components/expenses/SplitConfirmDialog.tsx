import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/utils'

interface SplitConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
  isSplitting: boolean
  expenseAmount: number
  partnerName: string
}

export function SplitConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isSplitting,
  expenseAmount,
  partnerName,
}: SplitConfirmDialogProps) {
  const creatorAmount = Math.ceil(expenseAmount * 100 / 2) / 100
  const partnerAmount = Math.floor(expenseAmount * 100 / 2) / 100

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dividir Despesa</DialogTitle>
          <DialogDescription>
            Dividir {formatCurrency(expenseAmount)} com {partnerName}?
            O valor sera alterado para {formatCurrency(creatorAmount)} para voce
            e {formatCurrency(partnerAmount)} para {partnerName}.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSplitting}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={isSplitting}>
            {isSplitting ? 'Dividindo...' : 'Dividir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
