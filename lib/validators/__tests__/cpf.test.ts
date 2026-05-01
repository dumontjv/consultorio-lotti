import { describe, it, expect } from 'vitest'
import { validarCPF, limparCPF } from '../cpf'

describe('limparCPF', () => {
  it('remove pontos e traço', () => {
    expect(limparCPF('123.456.789-09')).toBe('12345678909')
  })

  it('mantém CPF já limpo', () => {
    expect(limparCPF('12345678909')).toBe('12345678909')
  })

  it('retorna string vazia para entrada vazia', () => {
    expect(limparCPF('')).toBe('')
  })
})

describe('validarCPF', () => {
  it('aceita CPF válido sem máscara', () => {
    expect(validarCPF('52998224725')).toBe(true)
  })

  it('aceita CPF válido com máscara', () => {
    expect(validarCPF('529.982.247-25')).toBe(true)
  })

  it('rejeita CPF com menos de 11 dígitos', () => {
    expect(validarCPF('1234567890')).toBe(false)
  })

  it('rejeita CPF com mais de 11 dígitos', () => {
    expect(validarCPF('123456789012')).toBe(false)
  })

  it('rejeita sequências uniformes (111...)', () => {
    expect(validarCPF('11111111111')).toBe(false)
    expect(validarCPF('00000000000')).toBe(false)
    expect(validarCPF('99999999999')).toBe(false)
  })

  it('rejeita CPF com dígito verificador errado', () => {
    // CPF real alterado no último dígito
    expect(validarCPF('52998224724')).toBe(false)
    expect(validarCPF('52998224726')).toBe(false)
  })

  it('rejeita string vazia', () => {
    expect(validarCPF('')).toBe(false)
  })

  it('rejeita entrada não numérica', () => {
    expect(validarCPF('abc.def.ghi-jk')).toBe(false)
  })
})
