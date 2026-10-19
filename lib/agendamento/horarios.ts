export interface IntervaloHorario {
  inicio: string
  fim: string
}

export interface DisponibilidadeDia {
  ativo: boolean
  horarios: IntervaloHorario[]
}

export type Disponibilidade = Record<string, DisponibilidadeDia>

export type RoleClinica = 'medica' | 'psicologa'

export const DURACAO_POR_ROLE: Record<RoleClinica, number> = {
  medica: 30,
  psicologa: 50,
}

export const DIAS_ANTECEDENCIA_MAXIMA = 60
export const MINUTOS_ANTECEDENCIA_MINIMA = 120
export const FUSO_CLINICA = 'America/Sao_Paulo'

// Índice = Date.getUTCDay()
const DIAS_SEMANA = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']

export function paraMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number)
  return h * 60 + m
}

export function paraHora(minutos: number): string {
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function somarDias(dataISO: string, dias: number): string {
  const [a, m, d] = dataISO.split('-').map(Number)
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10)
}

export function diaDaSemana(dataISO: string): string {
  const [a, m, d] = dataISO.split('-').map(Number)
  return DIAS_SEMANA[new Date(Date.UTC(a, m - 1, d)).getUTCDay()]
}

/** Data (yyyy-MM-dd) e minutos desde meia-noite no fuso da clínica. */
export function agoraNaClinica(agora: Date = new Date()): { data: string; minutos: number } {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: FUSO_CLINICA,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(agora)
      .map((p) => [p.type, p.value])
  )
  return {
    data: `${partes.year}-${partes.month}-${partes.day}`,
    minutos: Number(partes.hour) * 60 + Number(partes.minute),
  }
}

/**
 * Horários de início livres em um dia: fatias de `duracao` minutos dentro
 * de cada faixa de disponibilidade, sem sobrepor consultas existentes.
 */
export function gerarHorariosDoDia(
  dia: DisponibilidadeDia | undefined,
  duracao: number,
  ocupados: IntervaloHorario[],
  inicioMinimoMinutos = 0
): string[] {
  if (!dia?.ativo) return []

  const ocupadosMin = ocupados.map((o) => ({ inicio: paraMinutos(o.inicio), fim: paraMinutos(o.fim) }))
  const livres = new Set<number>()

  for (const faixa of dia.horarios) {
    const fimFaixa = paraMinutos(faixa.fim)
    for (let t = paraMinutos(faixa.inicio); t + duracao <= fimFaixa; t += duracao) {
      if (t < inicioMinimoMinutos) continue
      const conflita = ocupadosMin.some((o) => o.inicio < t + duracao && o.fim > t)
      if (!conflita) livres.add(t)
    }
  }

  return [...livres].sort((a, b) => a - b).map(paraHora)
}

/** Mapa data → horários livres, de hoje até `dias` à frente (só dias com vagas). */
export function calcularHorariosDisponiveis(params: {
  disponibilidade: Disponibilidade | null
  duracao: number
  ocupadosPorData: Record<string, IntervaloHorario[]>
  agora: { data: string; minutos: number }
  dias?: number
  antecedenciaMinutos?: number
}): Record<string, string[]> {
  const {
    disponibilidade,
    duracao,
    ocupadosPorData,
    agora,
    dias = DIAS_ANTECEDENCIA_MAXIMA,
    antecedenciaMinutos = MINUTOS_ANTECEDENCIA_MINIMA,
  } = params
  if (!disponibilidade) return {}

  const resultado: Record<string, string[]> = {}
  const limite = agora.minutos + antecedenciaMinutos

  for (let i = 0; i <= dias; i++) {
    const data = somarDias(agora.data, i)
    // A antecedência pode passar da meia-noite: limite em minutos relativo a cada dia
    const inicioMinimo = limite - i * 24 * 60
    if (inicioMinimo >= 24 * 60) continue

    const horarios = gerarHorariosDoDia(
      disponibilidade[diaDaSemana(data)],
      duracao,
      ocupadosPorData[data] ?? [],
      Math.max(0, inicioMinimo)
    )
    if (horarios.length > 0) resultado[data] = horarios
  }

  return resultado
}
