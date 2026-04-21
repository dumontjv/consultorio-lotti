/**
 * Remove todos os caracteres não numéricos do telefone.
 */
function limparTelefone(telefone: string): string {
  return telefone.replace(/\D/g, '')
}

/**
 * Valida telefone brasileiro (fixo ou celular), com ou sem DDD.
 * Formatos aceitos:
 *   - (11) 91234-5678  → celular com DDD
 *   - (11) 1234-5678   → fixo com DDD
 *   - 11912345678      → celular sem formatação
 *   - 1112345678       → fixo sem formatação
 */
export function validarTelefone(telefone: string): boolean {
  const digits = limparTelefone(telefone)

  // Com DDD: 10 dígitos (fixo) ou 11 dígitos (celular)
  if (digits.length === 10 || digits.length === 11) {
    const ddd = parseInt(digits.substring(0, 2))
    // DDDs válidos no Brasil: 11–99 (exceto 23, 25, 26, 29, 30, 36, 39, 52, 56, 57, 58, 59...)
    // Validação simplificada: DDD entre 11 e 99
    if (ddd < 11 || ddd > 99) return false

    if (digits.length === 11) {
      // Celular: 9º dígito deve ser 9
      return digits[2] === '9'
    }

    return true
  }

  return false
}

/**
 * Formata telefone brasileiro com máscara.
 * 11 dígitos → (XX) XXXXX-XXXX
 * 10 dígitos → (XX) XXXX-XXXX
 */
export function formatarTelefone(telefone: string): string {
  const digits = limparTelefone(telefone)

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }

  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }

  return telefone
}
