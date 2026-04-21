import { format, parseISO, differenceInYears, isValid, parse } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * Garante que o valor seja um objeto Date válido.
 * Aceita Date, string ISO (2026-04-20T...) e string DD/MM/AAAA.
 */
function toDate(data: Date | string): Date {
  if (data instanceof Date) return data

  // Tenta como ISO string primeiro (formato do banco de dados)
  const isoDate = parseISO(data)
  if (isValid(isoDate)) return isoDate

  // Tenta como DD/MM/AAAA (formato de formulários brasileiros)
  const brDate = parse(data, 'dd/MM/yyyy', new Date())
  if (isValid(brDate)) return brDate

  throw new Error(`Data inválida: "${data}"`)
}

/**
 * Formata a data no padrão brasileiro: 20/04/2026
 */
export function formatarData(data: Date | string): string {
  return format(toDate(data), 'dd/MM/yyyy')
}

/**
 * Formata data e hora no padrão brasileiro: 20/04/2026 14:30
 */
export function formatarDataHora(data: Date | string): string {
  return format(toDate(data), 'dd/MM/yyyy HH:mm')
}

/**
 * Formata a data por extenso em português: "20 de abril de 2026"
 */
export function formatarDataExtenso(data: Date | string): string {
  return format(toDate(data), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
}

/**
 * Calcula a idade em anos completos a partir da data de nascimento.
 */
export function calcularIdade(dataNascimento: Date | string): number {
  return differenceInYears(new Date(), toDate(dataNascimento))
}

/**
 * Retorna apenas a hora no formato HH:mm (ex: 14:30)
 */
export function formatarHora(data: Date | string): string {
  return format(toDate(data), 'HH:mm')
}

/**
 * Formata a data de forma relativa curta (ex: "seg., 20 de abr.")
 */
export function formatarDataCurta(data: Date | string): string {
  return format(toDate(data), "EEE., d 'de' MMM.", { locale: ptBR })
}

/**
 * Retorna true se a data for válida.
 */
export function isDataValida(data: Date | string): boolean {
  try {
    toDate(data)
    return true
  } catch {
    return false
  }
}
