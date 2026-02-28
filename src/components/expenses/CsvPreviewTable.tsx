import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import type { ValidatedCsvRow } from '@/lib/csv'

interface CsvPreviewTableProps {
  rows: ValidatedCsvRow[]
}

export function CsvPreviewTable({ rows }: CsvPreviewTableProps) {
  return (
    <div className="max-h-72 overflow-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Descricao</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Compartilhado</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.rowNumber}
              className={row.status === 'error' ? 'bg-destructive/10' : undefined}
            >
              <TableCell className="font-mono text-xs text-muted-foreground">
                {row.rowNumber}
              </TableCell>
              <TableCell className="text-sm">
                {row.data?.expense_date ?? <span className="text-destructive text-xs">—</span>}
              </TableCell>
              <TableCell className="text-sm max-w-[120px] truncate">
                {row.data?.description || <span className="text-muted-foreground text-xs italic">sem descricao</span>}
              </TableCell>
              <TableCell className="text-sm">
                {row.data?.category_name ?? <span className="text-destructive text-xs">—</span>}
              </TableCell>
              <TableCell className="text-sm">
                {row.data ? (
                  `R$ ${row.data.amount.toFixed(2).replace('.', ',')}`
                ) : (
                  <span className="text-destructive text-xs">—</span>
                )}
              </TableCell>
              <TableCell className="text-sm">
                {row.data
                  ? row.data.is_shared
                    ? 'Sim'
                    : 'Nao'
                  : <span className="text-destructive text-xs">—</span>}
              </TableCell>
              <TableCell>
                {row.status === 'valid' ? (
                  <Badge variant="secondary" className="text-xs text-green-700 bg-green-100">
                    Valido
                  </Badge>
                ) : (
                  <div className="space-y-0.5">
                    {row.errors.map((err, i) => (
                      <p key={i} className="text-xs text-destructive leading-tight">
                        {err}
                      </p>
                    ))}
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
