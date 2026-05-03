import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subYears } from 'date-fns'

export function resolverPeriodo(periodo: string): { inicio: string; fim: string } {
  const hoje = new Date()

  const fmt = (d: Date) => format(d, 'yyyy-MM-dd')

  switch (periodo) {
    case '1m':
      return { inicio: fmt(startOfMonth(hoje)), fim: fmt(endOfMonth(hoje)) }
    case 'mes_passado': {
      const mesPassado = subMonths(hoje, 1)
      return { inicio: fmt(startOfMonth(mesPassado)), fim: fmt(endOfMonth(mesPassado)) }
    }
    case '3m':
      return { inicio: fmt(startOfMonth(subMonths(hoje, 2))), fim: fmt(endOfMonth(hoje)) }
    case '6m':
      return { inicio: fmt(startOfMonth(subMonths(hoje, 5))), fim: fmt(endOfMonth(hoje)) }
    case 'ano_passado': {
      const anoPassado = subYears(hoje, 1)
      return { inicio: fmt(startOfYear(anoPassado)), fim: fmt(endOfYear(anoPassado)) }
    }
    case 'ano':
    default:
      return { inicio: fmt(startOfYear(hoje)), fim: fmt(endOfYear(hoje)) }
  }
}
