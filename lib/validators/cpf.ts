/**
 * Remove a máscara do CPF, mantendo apenas dígitos.
 */
export function limparCPF(cpf: string): string {
  return cpf.replace(/\D/g, '')
}

/**
 * Valida um CPF brasileiro usando os dígitos verificadores.
 * Aceita CPF com ou sem máscara (000.000.000-00).
 */
export function validarCPF(cpf: string): boolean {
  const digits = limparCPF(cpf)

  // Deve ter exatamente 11 dígitos
  if (digits.length !== 11) return false

  // Rejeita sequências uniformes (111.111.111-11, 000.000.000-00, etc.)
  if (/^(\d)\1{10}$/.test(digits)) return false

  // Calcula o primeiro dígito verificador
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i]) * (10 - i)
  }
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(digits[9])) return false

  // Calcula o segundo dígito verificador
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i]) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(digits[10])) return false

  return true
}
