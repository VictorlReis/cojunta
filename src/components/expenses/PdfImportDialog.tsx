import { useState, useRef } from 'react'
import { FileText } from 'lucide-react'
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
import { PdfPreviewTable } from '@/components/expenses/PdfPreviewTable'
import { parseNubankPdf, recalculateDatesWithYear } from '@/lib/nubank-pdf'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { MONTHS_PT } from '@/lib/constants'
import type { NubankParseResult, ParsedNubankTransaction } from '@/lib/nubank-pdf'

type DialogState = 'upload' | 'preview' | 'importing'

interface PdfImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportComplete: () => void
}

export function PdfImportDialog({ open, onOpenChange, onImportComplete }: PdfImportDialogProps) {
  const [state, setState] = useState<DialogState>('upload')
  const [parseResult, setParseResult] = useState<NubankParseResult | null>(null)
  const [yearOverride, setYearOverride] = useState<number | null>(null)
  const [duplicateMap, setDuplicateMap] = useState<Map<number, string>>(new Map())
  const [parseError, setParseError] = useState<string | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { user } = useAuth()

  // ---- Duplicate detection ----

  const checkDuplicates = async (transactions: ParsedNubankTransaction[]) => {
    if (transactions.length === 0 || !user?.id) {
      setDuplicateMap(new Map())
      return
    }

    const dates = transactions.map((t) => t.expense_date)
    const minDate = dates.reduce((a, b) => (a < b ? a : b))
    const maxDate = dates.reduce((a, b) => (a > b ? a : b))

    const { data: existing } = await supabase
      .from('expenses')
      .select('expense_date, amount, description')
      .gte('expense_date', minDate)
      .lte('expense_date', maxDate)
      .eq('user_id', user.id)

    if (!existing || existing.length === 0) {
      setDuplicateMap(new Map())
      return
    }

    const dupes = new Map<number, string>()
    transactions.forEach((tx, index) => {
      const match = existing.find(
        (e) =>
          e.expense_date.startsWith(tx.expense_date) &&
          Math.abs(Number(e.amount) - tx.amount) < 0.01 &&
          (e.description ?? '')
            .toLowerCase()
            .includes(tx.description.toLowerCase().substring(0, 10)),
      )
      if (match) {
        dupes.set(index, match.description ?? '')
      }
    })
    setDuplicateMap(dupes)
  }

  // ---- File selection ----

  const handleFileSelect = async (file: File) => {
    setParseError(null)
    setIsParsing(true)
    try {
      const result = await parseNubankPdf(file)
      setParseResult(result)
      setYearOverride(null)
      await checkDuplicates(result.transactions)
      setState('preview')
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Erro ao processar arquivo PDF.')
    } finally {
      setIsParsing(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  // ---- Year override ----

  const handleYearChange = async (newYear: number) => {
    if (!parseResult) return
    setYearOverride(newYear)
    const recalculated = recalculateDatesWithYear(
      parseResult.transactions,
      parseResult.detected_closing_month,
      parseResult.detected_year,
      newYear,
    )
    const updated = { ...parseResult, transactions: recalculated }
    setParseResult(updated)
    await checkDuplicates(recalculated)
  }

  // ---- Import ----

  const handleImport = async () => {
    if (!user?.id || !parseResult) return
    setState('importing')

    // Look up "Sem Categoria" ID
    const { data: fallback } = await supabase
      .from('categories')
      .select('id')
      .is('partnership_id', null)
      .eq('name', 'Sem Categoria')
      .single()

    if (!fallback) {
      toast.error('Categoria "Sem Categoria" nao encontrada.')
      setState('preview')
      return
    }

    const insertRows = parseResult.transactions.map((tx) => ({
      user_id: user.id,
      category_id: fallback.id,
      description: tx.description,
      amount: tx.amount,
      expense_date: tx.expense_date,
      is_shared: false,
      partnership_id: null,
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

  // ---- Close / reset ----

  const handleClose = () => {
    onOpenChange(false)
    setTimeout(() => {
      setState('upload')
      setParseResult(null)
      setYearOverride(null)
      setDuplicateMap(new Map())
      setParseError(null)
      setIsParsing(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }, 200)
  }

  // ---- Derived values ----

  const transactions = parseResult?.transactions ?? []
  const dupCount = duplicateMap.size
  const effectiveYear = yearOverride ?? parseResult?.detected_year ?? new Date().getFullYear()
  const closingMonthLabel =
    MONTHS_PT.find((m) => m.value === parseResult?.detected_closing_month)?.label ?? ''

  // Year options: detected year +/- 2
  const baseYear = parseResult?.detected_year ?? new Date().getFullYear()
  const yearOptions = [baseYear - 2, baseYear - 1, baseYear, baseYear + 1, baseYear + 2]

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Importar Fatura Nubank</DialogTitle>
          {state === 'upload' && !isParsing && (
            <DialogDescription>
              Selecione um arquivo PDF de fatura do Nubank.
            </DialogDescription>
          )}
          {(state === 'upload' && isParsing) && (
            <DialogDescription>Processando arquivo PDF, aguarde...</DialogDescription>
          )}
          {state === 'preview' && parseResult && (
            <DialogDescription>
              Fatura de {closingMonthLabel} {parseResult.detected_year} &mdash;{' '}
              <span className="font-medium text-foreground">
                {transactions.length} transacao(oes) encontrada(s).
              </span>
            </DialogDescription>
          )}
          {state === 'importing' && (
            <DialogDescription>Importando despesas, aguarde...</DialogDescription>
          )}
        </DialogHeader>

        {/* Upload state */}
        {state === 'upload' && (
          <div className="space-y-4">
            {isParsing ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-muted-foreground/30 p-10 cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileText className="h-10 w-10 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium">Clique para selecionar um arquivo PDF</p>
                  <p className="text-xs text-muted-foreground mt-1">Fatura do Nubank em formato PDF</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleInputChange}
                />
              </div>
            )}
            {parseError && (
              <p className="text-sm text-destructive text-center">{parseError}</p>
            )}
          </div>
        )}

        {/* Preview state */}
        {state === 'preview' && parseResult && (
          <div className="space-y-3">
            {/* Year override */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium whitespace-nowrap">Ano de referencia:</label>
              <select
                className="rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={effectiveYear}
                onChange={(e) => handleYearChange(Number(e.target.value))}
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Parse warnings */}
            {parseResult.errors.length > 0 && (
              <div className="rounded-md bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 px-3 py-2 space-y-0.5">
                {parseResult.errors.map((err, i) => (
                  <p key={i} className="text-xs text-yellow-800 dark:text-yellow-400">
                    {err}
                  </p>
                ))}
              </div>
            )}

            {/* Duplicate warning */}
            {dupCount > 0 && (
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                {dupCount} possivel(is) duplicata(s) detectada(s).
              </p>
            )}

            {/* Preview table */}
            {transactions.length > 0 ? (
              <PdfPreviewTable transactions={transactions} duplicateMap={duplicateMap} />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma transacao encontrada no PDF.
              </p>
            )}
          </div>
        )}

        {/* Importing state */}
        {state === 'importing' && (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}

        <DialogFooter>
          {state === 'upload' && !isParsing && (
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
                  setParseResult(null)
                  setDuplicateMap(new Map())
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
              >
                Voltar
              </Button>
              <Button onClick={handleImport} disabled={transactions.length === 0}>
                {`Importar ${transactions.length} despesa(s)`}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
