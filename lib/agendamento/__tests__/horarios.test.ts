import { describe, it, expect } from 'vitest'
import {
  agoraNaClinica,
  calcularHorariosDisponiveis,
  diaDaSemana,
  gerarHorariosDoDia,
  somarDias,
} from '../horarios'

const manha = { ativo: true, horarios: [{ inicio: '08:00', fim: '10:00' }] }

describe('gerarHorariosDoDia', () => {
  it('fatia a faixa pela duração sem ultrapassar o fim', () => {
    expect(gerarHorariosDoDia(manha, 50, [])).toEqual(['08:00', '08:50'])
    expect(gerarHorariosDoDia(manha, 30, [])).toEqual(['08:00', '08:30', '09:00', '09:30'])
  })

  it('remove horários que se sobrepõem a consultas existentes', () => {
    const ocupados = [{ inicio: '08:15:00', fim: '08:45:00' }]
    expect(gerarHorariosDoDia(manha, 30, ocupados)).toEqual(['09:00', '09:30'])
  })

  it('respeita o horário mínimo e dias inativos', () => {
    expect(gerarHorariosDoDia(manha, 30, [], 9 * 60)).toEqual(['09:00', '09:30'])
    expect(gerarHorariosDoDia({ ...manha, ativo: false }, 30, [])).toEqual([])
    expect(gerarHorariosDoDia(undefined, 30, [])).toEqual([])
  })
})

describe('datas', () => {
  it('soma dias atravessando meses', () => {
    expect(somarDias('2026-01-31', 1)).toBe('2026-02-01')
  })

  it('identifica o dia da semana', () => {
    expect(diaDaSemana('2026-10-19')).toBe('segunda')
    expect(diaDaSemana('2026-10-18')).toBe('domingo')
  })

  it('converte para o fuso de São Paulo', () => {
    expect(agoraNaClinica(new Date('2026-10-20T02:30:00Z'))).toEqual({ data: '2026-10-19', minutos: 23 * 60 + 30 })
  })
})

describe('calcularHorariosDisponiveis', () => {
  const disponibilidade = { segunda: manha }

  it('aplica a antecedência mínima no dia atual', () => {
    const r = calcularHorariosDisponiveis({
      disponibilidade,
      duracao: 30,
      ocupadosPorData: {},
      agora: { data: '2026-10-19', minutos: 7 * 60 },
      dias: 7,
    })
    expect(r['2026-10-19']).toEqual(['09:00', '09:30'])
    expect(r['2026-10-26']).toEqual(['08:00', '08:30', '09:00', '09:30'])
    expect(Object.keys(r)).toHaveLength(2)
  })

  it('aplica a antecedência que passa da meia-noite', () => {
    const r = calcularHorariosDisponiveis({
      disponibilidade,
      duracao: 30,
      ocupadosPorData: {},
      agora: { data: '2026-10-18', minutos: 23 * 60 },
      dias: 1,
    })
    expect(r['2026-10-19']).toEqual(['08:00', '08:30', '09:00', '09:30'])
  })

  it('retorna vazio sem disponibilidade', () => {
    expect(
      calcularHorariosDisponiveis({
        disponibilidade: null,
        duracao: 30,
        ocupadosPorData: {},
        agora: { data: '2026-10-19', minutos: 0 },
      })
    ).toEqual({})
  })
})
