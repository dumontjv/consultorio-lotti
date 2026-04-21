/**
 * Remove a máscara do CPF, mantendo apenas dígitos.
 * Ex: "123.456.789-09" → "12345678909"
 */
export function limparCPF(cpf: string): string {
  return cpf.replace(/\D/g, '')
}

/**
 * Aplica a máscara de CPF: 000.000.000-00
 * Funciona com CPFs parcialmente digitados.
 */
export function formatarCPF(cpf: string): string {
  const digits = limparCPF(cpf).slice(0, 11)

  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9)
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}
