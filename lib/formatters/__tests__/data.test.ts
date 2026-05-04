import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import {
  formatarData,
  formatarDataHora,
  formatarDataExtenso,
  formatarHora,
  formatarDataCurta,
  isDataValida,
  calcularIdade,
} from '../data'

describe('formatarData', () => {
  it('formata objeto Date', () => {
    expect(formatarData(new Date(2026, 3, 20))).toBe('20/04/2026')
  })

  it('formata string ISO', () => {
    expect(formatarData('2026-04-20T14:30:00')).toBe('20/04/2026')
  })

  it('formata string DD/MM/AAAA', () => {
    expect(formatarData('20/04/2026')).toBe('20/04/2026')
  })

  it('lança erro para data inválida', () => {
    expect(() => formatarData('não é uma data')).toThrow()
  })
})

describe('formatarDataHora', () => {
  it('formata data e hora de string ISO', () => {
    expect(formatarDataHora('2026-04-20T14:30:00')).toBe('20/04/2026 14:30')
  })

  it('formata data e hora de objeto Date', () => {
    expect(formatarDataHora(new Date(2026, 3, 20, 9, 5))).toBe('20/04/2026 09:05')
  })
})

describe('formatarDataExtenso', () => {
  it('formata por extenso em português', () => {
    expect(formatarDataExtenso('2026-04-20')).toBe('20 de abril de 2026')
  })

  it('formata janeiro corretamente', () => {
    expect(formatarDataExtenso('2026-01-01')).toBe('1 de janeiro de 2026')
  })
})

describe('formatarHora', () => {
  it('extrai hora de string ISO', () => {
    expect(formatarHora('2026-04-20T14:30:00')).toBe('14:30')
  })

  it('formata hora com zero à esquerda', () => {
    expect(formatarHora(new Date(2026, 3, 20, 8, 5))).toBe('08:05')
  })
})

describe('formatarDataCurta', () => {
  it('formata data curta com dia da semana em pt-BR', () => {
    // Passa hora explícita para evitar problema de timezone com date-only string
    const result = formatarDataCurta('2026-04-20T12:00:00')
    expect(result).toMatch(/segunda\./)
    expect(result).toMatch(/20/)
    expect(result).toMatch(/abr\./)
  })
})

describe('isDataValida', () => {
  it('retorna true para data ISO válida', () => {
    expect(isDataValida('2026-04-20')).toBe(true)
  })

  it('retorna true para string DD/MM/AAAA', () => {
    expect(isDataValida('20/04/2026')).toBe(true)
  })

  it('retorna true para objeto Date', () => {
    expect(isDataValida(new Date())).toBe(true)
  })

  it('retorna false para string inválida', () => {
    expect(isDataValida('abc')).toBe(false)
  })
})

describe('calcularIdade', () => {
  beforeAll(() => {
    vi.useFakeTimers()
    // Usa meio-dia para evitar ambiguidade de timezone com datas no limiar da meia-noite
    vi.setSystemTime(new Date('2026-05-04T12:00:00'))
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  it('calcula idade corretamente para aniversariante do dia', () => {
    expect(calcularIdade('1990-05-04T12:00:00')).toBe(36)
  })

  it('ainda não fez aniversário no ano', () => {
    expect(calcularIdade('1990-12-31T12:00:00')).toBe(35)
  })

  it('já fez aniversário no ano', () => {
    expect(calcularIdade('1990-01-01T12:00:00')).toBe(36)
  })
})
