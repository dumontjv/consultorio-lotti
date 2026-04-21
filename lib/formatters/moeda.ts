const FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/**
 * Formata um número como moeda brasileira.
 * Ex: 1234.5 → "R$ 1.234,50"
 */
export function formatarMoeda(valor: number): string {
  return FORMATTER.format(valor)
}

/**
 * Formata moeda de forma compacta para dashboards e resumos.
 * Ex: 1200 → "R$ 1,2k" | 1500000 → "R$ 1,5M"
 */
export function formatarMoedaCompacta(valor: number): string {
  if (Math.abs(valor) >= 1_000_000) {
    return `R$ ${(valor / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}M`
  }
  if (Math.abs(valor) >= 1_000) {
    return `R$ ${(valor / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k`
  }
  return formatarMoeda(valor)
}

/**
 * Converte uma string de moeda brasileira de volta para número.
 * Ex: "R$ 1.234,50" → 1234.5
 * Ex: "1.234,50" → 1234.5
 */
export function parseMoeda(texto: string): number {
  // Remove símbolo da moeda e espaços
  const limpo = texto
    .replace(/R\$\s?/g, '')
    .trim()
    // Remove separador de milhar (ponto)
    .replace(/\./g, '')
    // Troca separador decimal (vírgula) por ponto
    .replace(',', '.')

  const valor = parseFloat(limpo)
  return isNaN(valor) ? 0 : valor
}
