export interface EnderecoViaCEP {
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}

/**
 * Busca endereço pelo CEP usando a API pública ViaCEP.
 * Retorna null em caso de CEP inválido ou erro de rede.
 */
export async function buscarCEP(cep: string): Promise<EnderecoViaCEP | null> {
  const cepLimpo = cep.replace(/\D/g, '')

  if (cepLimpo.length !== 8) return null

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`, {
      // Evita cache agressivo para sempre buscar dado atualizado
      next: { revalidate: 86400 }, // cache de 24h no Next.js
    })

    if (!response.ok) return null

    const data: EnderecoViaCEP = await response.json()

    // A API retorna { erro: true } para CEPs inexistentes
    if (data.erro) return null

    return data
  } catch {
    return null
  }
}

/**
 * Valida formato de CEP brasileiro (com ou sem máscara).
 */
export function validarCEP(cep: string): boolean {
  const cepLimpo = cep.replace(/\D/g, '')
  return cepLimpo.length === 8
}
