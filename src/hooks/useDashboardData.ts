import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { MONTH_ABBRS_PT } from '@/lib/constants'

export interface CategorySummary {
  categoryId: string
  categoryName: string
  categoryColor: string
  total: number
}

export interface MonthSummary {
  totalExpenses: number
  myExpenses: number
  sharedExpenses: number
  partnerExpenses: number
  byCategory: CategorySummary[]
}

export interface MonthlyTrend {
  month: string
  individual: number
  shared: number
  total: number
}

function subMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() - months)
  return d
}

function getMonthAbbr(month: number): string {
  return MONTH_ABBRS_PT[month] ?? ''
}

function lastDayOfMonth(year: number, month: number): string {
  const d = new Date(year, month, 0)
  return d.toISOString().split('T')[0]
}

export function useDashboardData(month: number, year: number) {
  const { user } = useAuth()

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = lastDayOfMonth(year, month)

  // Current month expenses for pie chart and cards
  const monthQuery = useQuery({
    queryKey: ['dashboard', 'month', user?.id, month, year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*, category:categories(*)')
        .gte('expense_date', startDate)
        .lte('expense_date', endDate)
      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  // 6-month trend
  const trendQuery = useQuery({
    queryKey: ['dashboard', 'trend', user?.id],
    queryFn: async () => {
      const sixMonthsAgo = subMonths(new Date(), 5)
      const trendStart = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')}-01`

      const { data, error } = await supabase
        .from('expenses')
        .select('amount, expense_date, is_shared, user_id')
        .gte('expense_date', trendStart)
      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  const monthSummary = useMemo((): MonthSummary => {
    const expenses = monthQuery.data ?? []
    const myExpenses = expenses.filter((e) => e.user_id === user?.id)
    const sharedExpenses = expenses.filter((e) => e.is_shared)
    const partnerExpenses = expenses.filter((e) => e.user_id !== user?.id && e.is_shared)

    // Group by category
    const categoryMap = new Map<string, CategorySummary>()
    for (const expense of expenses) {
      const cat = expense.category as { id: string; name: string; color: string } | null
      if (!cat) continue

      const existing = categoryMap.get(cat.id)
      if (existing) {
        existing.total += Number(expense.amount)
      } else {
        categoryMap.set(cat.id, {
          categoryId: cat.id,
          categoryName: cat.name,
          categoryColor: cat.color,
          total: Number(expense.amount),
        })
      }
    }

    return {
      totalExpenses: expenses.reduce((sum, e) => sum + Number(e.amount), 0),
      myExpenses: myExpenses.reduce((sum, e) => sum + Number(e.amount), 0),
      sharedExpenses: sharedExpenses.reduce((sum, e) => sum + Number(e.amount), 0),
      partnerExpenses: partnerExpenses.reduce((sum, e) => sum + Number(e.amount), 0),
      byCategory: Array.from(categoryMap.values()).sort((a, b) => b.total - a.total),
    }
  }, [monthQuery.data, user?.id])

  const trendData = useMemo((): MonthlyTrend[] => {
    const expenses = trendQuery.data ?? []
    const now = new Date()
    const result: MonthlyTrend[] = []

    for (let i = 5; i >= 0; i--) {
      const d = subMonths(now, i)
      const m = d.getMonth() // 0-11
      const y = d.getFullYear()

      const monthExpenses = expenses.filter((e) => {
        const date = new Date(e.expense_date)
        return date.getMonth() === m && date.getFullYear() === y
      })

      const individual = monthExpenses
        .filter((e) => !e.is_shared)
        .reduce((sum, e) => sum + Number(e.amount), 0)

      const shared = monthExpenses
        .filter((e) => e.is_shared)
        .reduce((sum, e) => sum + Number(e.amount), 0)

      result.push({
        month: getMonthAbbr(m),
        individual,
        shared,
        total: individual + shared,
      })
    }

    return result
  }, [trendQuery.data])

  return {
    monthSummary,
    trendData,
    isLoading: monthQuery.isLoading || trendQuery.isLoading,
  }
}
