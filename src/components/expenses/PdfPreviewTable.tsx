import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import type { ParsedNubankTransaction } from '@/lib/nubank-pdf'

interface PdfPreviewTableProps {
  transactions: ParsedNubankTransaction[]
  duplicateMap: Map<number, string> // index -> matching expense description
}

function formatDateBr(isoDate: string): string {
  const parts = isoDate.split('-')
  if (parts.length !== 3) return isoDate
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

function formatAmountBr(amount: number): string {
  return `R$ ${amount.toFixed(2).replace('.', ',')}`
}

export function PdfPreviewTable({ transactions, duplicateMap }: PdfPreviewTableProps) {
  return (
    <div className="max-h-72 overflow-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">#</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Descricao</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx, index) => {
            const isDuplicate = duplicateMap.has(index)
            const matchingDesc = duplicateMap.get(index)

            return (
              <TableRow
                key={index}
                className={isDuplicate ? 'bg-yellow-50 dark:bg-yellow-950/20' : undefined}
              >
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {index + 1}
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap">
                  {formatDateBr(tx.expense_date)}
                </TableCell>
                <TableCell className="text-sm max-w-[200px] truncate">
                  {tx.description || (
                    <span className="text-muted-foreground text-xs italic">sem descricao</span>
                  )}
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap">
                  {formatAmountBr(tx.amount)}
                </TableCell>
                <TableCell>
                  {isDuplicate ? (
                    <div className="space-y-0.5">
                      <Badge
                        variant="secondary"
                        className="text-xs text-yellow-700 bg-yellow-100 dark:bg-yellow-900/40 dark:text-yellow-400"
                      >
                        Duplicata?
                      </Badge>
                      {matchingDesc && (
                        <p className="text-xs text-muted-foreground leading-tight max-w-[120px] truncate">
                          {matchingDesc}
                        </p>
                      )}
                    </div>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="text-xs text-green-700 bg-green-100 dark:bg-green-900/40 dark:text-green-400"
                    >
                      Valido
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
