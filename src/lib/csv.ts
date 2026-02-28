import type { Expense, Category } from '@/types/database'

// ---- Types ----

export interface RawCsvRow {
  [key: string]: string
}

export interface ValidatedCsvRow {
  rowNumber: number
  status: 'valid' | 'error'
  errors: string[]
  data: {
    description: string
    amount: number
    category_id: string
    category_name: string
    expense_date: string
    is_shared: boolean
  } | null
}

// ---- Export ----

function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportExpensesToCsv(
  expenses: (Expense & { category: Category })[],
  filename: string,
) {
  const headers = ['Data', 'Descricao', 'Categoria', 'Valor', 'Compartilhado']
  const rows = expenses.map((expense) => [
    expense.expense_date.split('T')[0], // ISO date YYYY-MM-DD
    expense.description ?? '',
    expense.category?.name ?? '',
    String(Number(expense.amount).toFixed(2)),
    expense.is_shared ? 'Sim' : 'Nao',
  ])

  const csvContent = [
    headers.map(escapeCsvField).join(','),
    ...rows.map((row) => row.map(escapeCsvField).join(',')),
  ].join('\r\n')

  // UTF-8 BOM for Excel compatibility with pt-BR characters
  downloadCsv('\uFEFF' + csvContent, filename)
}

// ---- CSV Parsing ----

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"'
        i++
      } else if (char === '"') {
        inQuotes = false
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ',') {
        result.push(current)
        current = ''
      } else {
        current += char
      }
    }
  }
  result.push(current)
  return result
}

export function parseCsvString(text: string): RawCsvRow[] {
  // Strip UTF-8 BOM if present
  const cleaned = text.startsWith('\uFEFF') ? text.slice(1) : text
  const lines = cleaned.split(/\r?\n/).filter((line) => line.trim() !== '')
  if (lines.length < 2) throw new Error('Arquivo CSV vazio ou sem dados.')

  const headers = parseCsvLine(lines[0])
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line)
    const row: RawCsvRow = {}
    headers.forEach((h, i) => {
      row[h.trim()] = values[i]?.trim() ?? ''
    })
    return row
  })
}

export async function parseCsvFile(file: File): Promise<RawCsvRow[]> {
  const text = await file.text()
  return parseCsvString(text)
}

// ---- Validation ----

export function validateCsvRows(rows: RawCsvRow[], categories: Category[]): ValidatedCsvRow[] {
  return rows.map((row, index) => {
    const errors: string[] = []
    const rowNumber = index + 2 // 1-based, +1 for header row

    // Validate Data (date)
    const rawDate = row['Data'] ?? ''
    let expenseDate = ''
    if (!rawDate) {
      errors.push('Data e obrigatoria.')
    } else {
      const parsed = new Date(rawDate)
      if (isNaN(parsed.getTime())) {
        errors.push(`Data invalida: "${rawDate}".`)
      } else {
        expenseDate = rawDate.split('T')[0] // normalize to YYYY-MM-DD
      }
    }

    // Validate Valor (amount)
    const rawAmount = (row['Valor'] ?? '').replace(',', '.')
    const amount = parseFloat(rawAmount)
    if (!rawAmount || isNaN(amount) || amount <= 0) {
      errors.push(`Valor invalido: "${row['Valor'] ?? ''}". Use um numero positivo.`)
    }

    // Validate Categoria
    const rawCategory = (row['Categoria'] ?? '').trim()
    let matchedCategory: Category | undefined
    if (!rawCategory) {
      errors.push('Categoria e obrigatoria.')
    } else {
      matchedCategory = categories.find(
        (c) => c.name.toLowerCase() === rawCategory.toLowerCase(),
      )
      if (!matchedCategory) {
        errors.push(`Categoria nao encontrada: "${rawCategory}".`)
      }
    }

    // Validate Compartilhado
    const rawShared = (row['Compartilhado'] ?? 'Nao').trim().toLowerCase()
    let isShared = false
    if (rawShared === 'sim') {
      isShared = true
    } else if (rawShared === 'nao' || rawShared === '') {
      isShared = false
    } else {
      errors.push(`Compartilhado invalido: "${row['Compartilhado']}". Use "Sim" ou "Nao".`)
    }

    // Description is optional
    const description = (row['Descricao'] ?? '').trim()

    if (errors.length > 0) {
      return { rowNumber, status: 'error', errors, data: null }
    }

    return {
      rowNumber,
      status: 'valid',
      errors: [],
      data: {
        description,
        amount,
        category_id: matchedCategory!.id,
        category_name: matchedCategory!.name,
        expense_date: expenseDate,
        is_shared: isShared,
      },
    }
  })
}
