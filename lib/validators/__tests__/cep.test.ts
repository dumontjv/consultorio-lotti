import { describe, it, expect } from 'vitest'
import { validarCEP } from '../cep'

describe('validarCEP', () => {
  it('aceita CEP com 8 dígitos sem máscara', () => {
    expect(validarCEP('20040020')).toBe(true)
  })

  it('aceita CEP com máscara (XXXXX-XXX)', () => {
    expect(validarCEP('20040-020')).toBe(true)
  })

  it('rejeita CEP com menos de 8 dígitos', () => {
    expect(validarCEP('2004002')).toBe(false)
  })

  it('rejeita CEP com mais de 8 dígitos', () => {
    expect(validarCEP('200400200')).toBe(false)
  })

  it('rejeita string vazia', () => {
    expect(validarCEP('')).toBe(false)
  })

  it('rejeita texto sem dígitos', () => {
    expect(validarCEP('abcde-fgh')).toBe(false)
  })
})
