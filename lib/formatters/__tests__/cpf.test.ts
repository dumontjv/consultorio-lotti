import { describe, it, expect } from 'vitest'
import { formatarCPF, limparCPF } from '../cpf'

describe('limparCPF (formatter)', () => {
  it('remove máscara', () => {
    expect(limparCPF('123.456.789-09')).toBe('12345678909')
  })
})

describe('formatarCPF', () => {
  it('formata 11 dígitos corretamente', () => {
    expect(formatarCPF('12345678909')).toBe('123.456.789-09')
  })

  it('formata CPF já mascarado (idempotente)', () => {
    expect(formatarCPF('123.456.789-09')).toBe('123.456.789-09')
  })

  it('formata entrada parcial — 3 dígitos', () => {
    expect(formatarCPF('123')).toBe('123')
  })

  it('formata entrada parcial — 5 dígitos', () => {
    expect(formatarCPF('12345')).toBe('123.45')
  })

  it('formata entrada parcial — 9 dígitos', () => {
    expect(formatarCPF('123456789')).toBe('123.456.789')
  })

  it('ignora dígitos além do 11º', () => {
    expect(formatarCPF('123456789099999')).toBe('123.456.789-09')
  })

  it('retorna string vazia para entrada vazia', () => {
    expect(formatarCPF('')).toBe('')
  })
})
