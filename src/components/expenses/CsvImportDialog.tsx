import { useState, useRef } from 'react'
import { Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { CsvPreviewTable } from '@/components/expenses/CsvPreviewTable'
import { parseCsvFile, validateCsvRows } from '@/lib/csv'
import { useCategories } from '@/hooks/useCategories'
import { useAuth } from '@/hooks/useAuth'
import { usePartnership } from '@/hooks/usePartnership'
import { supabase } from '@/lib/supabase'
import type { ValidatedCsvRow } from '@/lib/csv'

type DialogState = 'upload' | 'preview' | 'importing'

interface CsvImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportComplete: () => void
}

export function CsvImportDialog({ open, onOpenChange, onImportComplete }: CsvImportDialogProps) {
  const [state, setState] = useState<DialogState>('upload')
  const [validatedRows, setValidatedRows] = useState<ValidatedCsvRow[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { categories } = useCategories()
  const { user } = useAuth()
  const { partnership } = usePartnership()

  const validRows = validatedRows.filter((r) => r.status === 'valid')
  const errorRows = validatedRows.filter((r) => r.status === 'error')
  const hasErrors = errorRows.length > 0
  const allInvalid = validatedRows.length > 0 && validRows.length === 0

  const handleFileSelect = async (file: File) => {
    setParseError(null)
    try {
      const rawRows = await parseCsvFile(file)
      const validated = validateCsvRows(rawRows, categories)
      setValidatedRows(validated)
      setState('preview')
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Erro ao processar arquivo CSV.')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  const handleImport = async () => {
    if (!user?.id) return
    setState('importing')

    const insertRows = validRows
      .filter((r) => r.data !== null)
      .map((r) => ({
        user_id: user.id,
        category_id: r.data!.category_id,
        description: r.data!.description,
        amount: r.data!.amount,
        expense_date: r.data!.expense_date,
        is_shared: r.data!.is_shared,
        partnership_id: r.data!.is_shared ? (partnership?.id ?? null) : null,
      }))

    const { error } = await supabase.from('expenses').insert(insertRows)

    if (error) {
      toast.error('Erro ao importar despesas. Tente novamente.')
      setState('preview')
    } else {
      toast.success(`${insertRows.length} despesa(s) importada(s) com sucesso!`)
      onImportComplete()
      handleClose()
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    // Reset state after close animation
    setTimeout(() => {
      setState('upload')
      setValidatedRows([])
      setParseError(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }, 200)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle>Importar Despesas via CSV</DialogTitle>
          {state === 'upload' && (
            <DialogDescription>
              Selecione um arquivo CSV com as colunas: Data, Descricao, Categoria, Valor, Compartilhado.
            </DialogDescription>
          )}
          {state === 'preview' && (
            <DialogDescription>
              Revise os dados antes de importar.{' '}
              <span className="font-medium text-foreground">
                {validRows.length} de {validatedRows.length} linhas validas.
              </span>
              {hasErrors && (
                <span className="text-destructive ml-1">
                  {errorRows.length} linha(s) com erro nao serao importadas.
                </span>
              )}
            </DialogDescription>
          )}
          {state === 'importing' && (
            <DialogDescription>Importando despesas, aguarde...</DialogDescription>
          )}
        </DialogHeader>

        {/* Upload state */}
        {state === 'upload' && (
          <div className="space-y-4">
            <div
              className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-muted-foreground/30 p-10 cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-10 w-10 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium">Clique para selecionar um arquivo CSV</p>
                <p className="text-xs text-muted-foreground mt-1">ou arraste e solte aqui</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleInputChange}
              />
            </div>
            {parseError && (
              <p className="text-sm text-destructive text-center">{parseError}</p>
            )}
          </div>
        )}

        {/* Preview state */}
        {state === 'preview' && validatedRows.length > 0 && (
          <div className="space-y-3">
            {allInvalid && (
              <p className="text-sm text-destructive text-center font-medium">
                Todas as linhas possuem erros. Corrija o arquivo e tente novamente.
              </p>
            )}
            <CsvPreviewTable rows={validatedRows} />
          </div>
        )}

        {/* Importing state */}
        {state === 'importing' && (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}

        <DialogFooter>
          {state === 'upload' && (
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
          )}
          {state === 'preview' && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setState('upload')
                  setValidatedRows([])
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
              >
                Voltar
              </Button>
              <Button onClick={handleImport} disabled={validRows.length === 0}>
                {`Importar ${validRows.length} despesa(s)`}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
