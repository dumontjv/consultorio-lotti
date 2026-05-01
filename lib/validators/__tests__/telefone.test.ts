import { describe, it, expect } from 'vitest'
import { validarTelefone, formatarTelefone } from '../telefone'

describe('validarTelefone', () => {
  it('aceita celular com DDD e máscara', () => {
    expect(validarTelefone('(21) 91234-5678')).toBe(true)
  })

  it('aceita celular com DDD sem formatação', () => {
    expect(validarTelefone('21912345678')).toBe(true)
  })

  it('aceita fixo com DDD e máscara', () => {
    expect(validarTelefone('(21) 3392-2142')).toBe(true)
  })

  it('aceita fixo com DDD sem formatação', () => {
    expect(validarTelefone('2133922142')).toBe(true)
  })

  it('rejeita número curto demais', () => {
    expect(validarTelefone('123456789')).toBe(false)
  })

  it('rejeita número longo demais', () => {
    expect(validarTelefone('219123456789')).toBe(false)
  })

  it('rejeita celular sem o 9 inicial', () => {
    expect(validarTelefone('21812345678')).toBe(false)
  })

  it('rejeita string vazia', () => {
    expect(validarTelefone('')).toBe(false)
  })
})

describe('formatarTelefone', () => {
  it('formata celular com 11 dígitos', () => {
    expect(formatarTelefone('21912345678')).toBe('(21) 91234-5678')
  })

  it('formata fixo com 10 dígitos', () => {
    expect(formatarTelefone('2133922142')).toBe('(21) 3392-2142')
  })

  it('formata a partir de número já mascarado', () => {
    expect(formatarTelefone('(21) 91234-5678')).toBe('(21) 91234-5678')
  })

  it('retorna a entrada original se não reconhecer o formato', () => {
    const entrada = '123'
    expect(formatarTelefone(entrada)).toBe(entrada)
  })
})
