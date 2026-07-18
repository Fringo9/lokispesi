import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  isSameDay,
  parseISO,
} from 'date-fns'
import { it } from 'date-fns/locale'

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd/MM/yyyy')
}

export function formatMonth(date: Date): string {
  return format(date, 'MMMM yyyy', { locale: it })
}

export function formatDayHeader(date: Date): string {
  const today = new Date()
  if (isSameDay(date, today)) return 'Oggi'
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (isSameDay(date, yesterday)) return 'Ieri'
  return format(date, 'EEEE d MMMM', { locale: it })
}

export function getCurrentMonth(): { start: string; end: string } {
  const now = new Date()
  return {
    start: format(startOfMonth(now), 'yyyy-MM-dd'),
    end: format(endOfMonth(now), 'yyyy-MM-dd'),
  }
}

export function getLastSixMonths(): { month: string; label: string }[] {
  const months: { month: string; label: string }[] = []
  for (let i = 5; i >= 0; i--) {
    const date = subMonths(new Date(), i)
    months.push({
      month: format(date, 'yyyy-MM'),
      label: format(date, 'MMM', { locale: it }),
    })
  }
  return months
}

export function getMonthKey(date: Date): string {
  return format(date, 'yyyy-MM')
}
