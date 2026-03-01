// Nubank PDF invoice parser
// All imports of pdfjs-dist are dynamic (lazy) to keep it out of the main bundle.

// ---- Types ----

export interface ParsedNubankTransaction {
  description: string    // Merchant name, cleaned (card mask removed)
  amount: number         // Parsed numeric amount
  expense_date: string   // YYYY-MM-DD format
  raw_line: string       // Original PDF line for debugging/display
}

export interface NubankParseResult {
  transactions: ParsedNubankTransaction[]
  detected_year: number           // Year inferred from invoice header
  detected_closing_month: number  // 1-12, month of the invoice closing date
  errors: string[]                // Lines that looked like transactions but failed to parse
}

// ---- Constants ----

// Maps 3-letter Portuguese month abbreviations (case-insensitive) to 1-based month numbers
const MONTH_ABBR_TO_NUM: Record<string, number> = {
  jan: 1,  fev: 2,  mar: 3,  abr: 4,
  mai: 5,  jun: 6,  jul: 7,  ago: 8,
  set: 9,  out: 10, nov: 11, dez: 12,
}

// Maps full Portuguese month names to 1-based month numbers (for header detection)
const FULL_MONTHS_PT: Record<string, number> = {
  janeiro: 1,   fevereiro: 2, marco: 3,    abril: 4,
  maio: 5,      junho: 6,     julho: 7,    agosto: 8,
  setembro: 9,  outubro: 10,  novembro: 11, dezembro: 12,
}

// Regex for transaction lines:
// DD MON [optional card mask] description R$ amount
const TX_REGEX = /^(\d{2})\s+(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)\s+(.+?)\s+R\$\s*([\d.]+,\d{2})$/i

// Regex for card mask patterns to strip from descriptions
const CARD_MASK_REGEX = /^[•\*\.]{1,4}\s*\d{4}\s*/

// ---- Whitespace normalization ----

// Replaces Unicode non-breaking/special spaces with ASCII space, collapses runs,
// and trims. This prevents regex failures caused by PDF rendering artifacts.
function normalizeWhitespace(text: string): string {
  return text
    .replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// ---- PDF text extraction ----

async function extractTextFromPdf(file: File): Promise<string[]> {
  // Lazy-load pdfjs-dist -- must never be a top-level import
  let pdfjsLib: typeof import('pdfjs-dist')
  try {
    pdfjsLib = await import('pdfjs-dist')
  } catch {
    throw new Error('Erro ao carregar o leitor de PDF.')
  }

  // Configure worker via CDN to avoid Vite bundling complexity
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  if (pdf.numPages === 0) {
    throw new Error('Nao foi possivel extrair texto do PDF.')
  }

  const lines: string[] = []

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const textContent = await page.getTextContent()

    // Group items into lines by y-position.
    // Items with significantly different y values belong to different lines.
    // pdfjs items can be TextItem (has str + transform) or TextMarkedContent (no transform).
    // We must filter to only real text items before accessing .transform to avoid TypeError.
    interface TextItem { str: string; transform: number[] }
    function isTextItem(item: unknown): item is TextItem {
      return (
        typeof item === 'object' &&
        item !== null &&
        'str' in item &&
        'transform' in item &&
        Array.isArray((item as TextItem).transform) &&
        (item as TextItem).transform.length >= 6
      )
    }
    const items = textContent.items.filter(isTextItem)

    if (items.length === 0) continue

    // Sort items by descending y (top of page first), then ascending x
    const sorted = [...items].sort((a, b) => {
      const yDiff = b.transform[5] - a.transform[5]
      if (Math.abs(yDiff) > 2) return yDiff
      return a.transform[4] - b.transform[4]
    })

    let currentLine = ''
    let lastY = sorted[0].transform[5]

    for (const item of sorted) {
      // Skip empty strings -- pdfjs can emit empty TextItems for spacing artifacts
      if (item.str === '') continue
      const y = item.transform[5]
      if (Math.abs(y - lastY) > 2) {
        // New line -- normalize whitespace before pushing
        const normalized = normalizeWhitespace(currentLine)
        if (normalized) lines.push(normalized)
        currentLine = item.str
        lastY = y
      } else {
        currentLine += (currentLine && !currentLine.endsWith(' ') ? ' ' : '') + item.str
      }
    }

    const normalized = normalizeWhitespace(currentLine)
    if (normalized) lines.push(normalized)
  }

  if (lines.length === 0) {
    throw new Error('Nao foi possivel extrair texto do PDF.')
  }

  return lines
}

// ---- Invoice header detection ----

interface ClosingDate {
  month: number  // 1-12
  year: number
}

function detectClosingDate(lines: string[]): ClosingDate | null {
  // Search the first 30 lines for header patterns
  const searchLines = lines.slice(0, 30)

  for (const line of searchLines) {
    const lower = line.toLowerCase()

    // Pattern: "Fatura de <FullMonthName> <Year>" e.g. "Fatura de Marco 2026"
    const faturaMatch = lower.match(/fatura\s+de\s+(\w+)\s+(\d{4})/)
    if (faturaMatch) {
      const monthName = faturaMatch[1]
      const year = parseInt(faturaMatch[2], 10)
      const month = FULL_MONTHS_PT[monthName]
      if (month && year > 2000) {
        return { month, year }
      }
    }

    // Pattern: "Fechamento: DD/MM/YYYY"
    const fechamentoMatch = line.match(/fechamento[:\s]+(\d{2})\/(\d{2})\/(\d{4})/i)
    if (fechamentoMatch) {
      const month = parseInt(fechamentoMatch[2], 10)
      const year = parseInt(fechamentoMatch[3], 10)
      if (month >= 1 && month <= 12 && year > 2000) {
        return { month, year }
      }
    }

    // Pattern: "Vencimento: DD/MM/YYYY" (alternative header)
    const vencimentoMatch = line.match(/vencimento[:\s]+(\d{2})\/(\d{2})\/(\d{4})/i)
    if (vencimentoMatch) {
      const month = parseInt(vencimentoMatch[2], 10)
      const year = parseInt(vencimentoMatch[3], 10)
      if (month >= 1 && month <= 12 && year > 2000) {
        return { month, year }
      }
    }
  }

  return null
}

// ---- Year resolution ----

function resolveYear(txMonth: number, closingMonth: number, baseYear: number): number {
  // If the transaction month is after the closing month it must belong to the previous year.
  // Example: closing month = 1 (January), transaction month = 12 (December) -> previous year.
  if (txMonth > closingMonth) {
    return baseYear - 1
  }
  return baseYear
}

// ---- Description cleaning ----

function cleanDescription(raw: string): string {
  // Strip leading card mask patterns like "•••• 1412 " or "**** 1412 " or ".... 1412 "
  return raw.replace(CARD_MASK_REGEX, '').trim()
}

// ---- Amount parsing ----

function parseAmount(raw: string): number {
  // Brazilian format: "1.234,56" -> 1234.56
  const normalized = raw.replace(/\./g, '').replace(',', '.')
  return parseFloat(normalized)
}

// ---- Main function ----

export async function parseNubankPdf(file: File): Promise<NubankParseResult> {
  const lines = await extractTextFromPdf(file)

  const errors: string[] = []
  const now = new Date()

  // Detect closing date from header
  const closingDate = detectClosingDate(lines)
  let detectedYear: number
  let detectedClosingMonth: number

  if (!closingDate) {
    detectedYear = now.getFullYear()
    detectedClosingMonth = now.getMonth() + 1
    errors.push(`Ano da fatura nao detectado. Usando ano atual (${detectedYear}).`)
  } else {
    detectedYear = closingDate.year
    detectedClosingMonth = closingDate.month
  }

  // Parse transaction lines
  const transactions: ParsedNubankTransaction[] = []

  for (const rawLine of lines) {
    const line = normalizeWhitespace(rawLine)
    const match = line.match(TX_REGEX)
    if (!match) continue

    const day = parseInt(match[1], 10)
    const monthAbbr = match[2].toLowerCase()
    const rawDescription = match[3]
    const rawAmount = match[4]

    const txMonth = MONTH_ABBR_TO_NUM[monthAbbr]
    if (!txMonth) {
      errors.push(line)
      continue
    }

    const amount = parseAmount(rawAmount)
    if (isNaN(amount) || amount <= 0) {
      errors.push(line)
      continue
    }

    const description = cleanDescription(rawDescription)
    const year = resolveYear(txMonth, detectedClosingMonth, detectedYear)
    const expense_date = `${year}-${String(txMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`

    transactions.push({ description, amount, expense_date, raw_line: rawLine })
  }

  if (transactions.length === 0 && errors.filter(e => !e.startsWith('Ano da fatura')).length === 0) {
    errors.push('Nenhuma transacao encontrada no PDF.')
  }

  return {
    transactions,
    detected_year: detectedYear,
    detected_closing_month: detectedClosingMonth,
    errors,
  }
}

// ---- Year recalculation helper ----

export function recalculateDatesWithYear(
  transactions: ParsedNubankTransaction[],
  originalClosingMonth: number,
  _originalYear: number,
  newYear: number,
): ParsedNubankTransaction[] {
  return transactions.map((tx) => {
    const parts = tx.expense_date.split('-')
    const txMonth = parseInt(parts[1], 10)
    const day = parts[2]

    const year = resolveYear(txMonth, originalClosingMonth, newYear)
    const expense_date = `${year}-${String(txMonth).padStart(2, '0')}-${day}`

    return { ...tx, expense_date }
  })
}
