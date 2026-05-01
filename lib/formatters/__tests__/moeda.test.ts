import { describe, it, expect } from 'vitest'
import { formatarMoeda, formatarMoedaCompacta, parseMoeda } from '../moeda'

describe('formatarMoeda', () => {
  it('formata valor inteiro', () => {
    expect(formatarMoeda(1000)).toBe('R$ 1.000,00')
  })

  it('formata valor com centavos', () => {
    expect(formatarMoeda(1234.5)).toBe('R$ 1.234,50')
  })

  it('formata zero', () => {
    expect(formatarMoeda(0)).toBe('R$ 0,00')
  })

  it('formata valor negativo', () => {
    // O Intl.NumberFormat usa sinal negativo padrão
    expect(formatarMoeda(-100)).toContain('100,00')
  })

  it('formata valor grande', () => {
    expect(formatarMoeda(1_000_000)).toBe('R$ 1.000.000,00')
  })
})

describe('formatarMoedaCompacta', () => {
  it('formata valor abaixo de 1k normalmente', () => {
    expect(formatarMoedaCompacta(500)).toBe('R$ 500,00')
  })

  it('formata milhar com sufixo k', () => {
    expect(formatarMoedaCompacta(1200)).toBe('R$ 1,2k')
  })

  it('formata milhar exato', () => {
    expect(formatarMoedaCompacta(1000)).toBe('R$ 1k')
  })

  it('formata milhão com sufixo M', () => {
    expect(formatarMoedaCompacta(1_500_000)).toBe('R$ 1,5M')
  })
})

describe('parseMoeda', () => {
  it('converte string formatada para número', () => {
    expect(parseMoeda('R$ 1.234,50')).toBe(1234.5)
  })

  it('converte sem símbolo de moeda', () => {
    expect(parseMoeda('1.234,50')).toBe(1234.5)
  })

  it('converte valor inteiro', () => {
    expect(parseMoeda('R$ 300,00')).toBe(300)
  })

  it('retorna 0 para entrada inválida', () => {
    expect(parseMoeda('abc')).toBe(0)
  })

  it('retorna 0 para string vazia', () => {
    expect(parseMoeda('')).toBe(0)
  })
})
