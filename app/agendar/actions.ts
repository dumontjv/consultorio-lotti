'use server'

import { createHash } from 'node:crypto'
import { headers } from 'next/headers'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { validarCPF, limparCPF } from '@/lib/validators/cpf'
import { validarTelefone } from '@/lib/validators/telefone'
import { verificarConvenioAceito } from '@/lib/convenios/servidor'
import {
  DIAS_ANTECEDENCIA_MAXIMA,
  DURACAO_POR_ROLE,
  agoraNaClinica,
  calcularHorariosDisponiveis,
  paraHora,
  paraMinutos,
  somarDias,
  type Disponibilidade,
  type IntervaloHorario,
  type RoleClinica,
} from '@/lib/agendamento/horarios'

// Estas actions são públicas (página /agendar sem login): usam o service role,
// então nunca devolvem dados de outros pacientes — apenas horários livres.

const LIMITE_POR_HORA = 5

async function carregarAgenda(profissionalId: string) {
  const admin = createAdminClient()

  const { data: prof } = await admin
    .from('profiles')
    .select('id, nome_completo, role, disponibilidade')
    .eq('id', profissionalId)
    .eq('ativo', true)
    .in('role', ['medica', 'psicologa'])
    .maybeSingle()

  if (!prof) return null

  const agora = agoraNaClinica()
  const { data: consultas } = await admin
    .from('consultas')
    .select('data, hora_inicio, hora_fim')
    .eq('profissional_id', profissionalId)
    .neq('status', 'cancelada')
    .gte('data', agora.data)
    .lte('data', somarDias(agora.data, DIAS_ANTECEDENCIA_MAXIMA))

  const ocupadosPorData: Record<string, IntervaloHorario[]> = {}
  for (const c of consultas ?? []) {
    ;(ocupadosPorData[c.data] ??= []).push({ inicio: c.hora_inicio, fim: c.hora_fim })
  }

  const role = prof.role as RoleClinica
  const duracao = DURACAO_POR_ROLE[role]
  const dias = calcularHorariosDisponiveis({
    disponibilidade: prof.disponibilidade as Disponibilidade | null,
    duracao,
    ocupadosPorData,
    agora,
  })

  return { prof, duracao, dias }
}

export type HorariosResult =
  | { success: true; duracao: number; dias: Record<string, string[]> }
  | { success: false; error: string }

export async function buscarHorariosDisponiveis(profissionalId: unknown): Promise<HorariosResult> {
  const id = z.string().uuid().safeParse(profissionalId)
  if (!id.success) return { success: false, error: 'Profissional inválido.' }

  const agenda = await carregarAgenda(id.data)
  if (!agenda) return { success: false, error: 'Profissional não encontrada.' }

  return { success: true, duracao: agenda.duracao, dias: agenda.dias }
}

const agendamentoSchema = z.object({
  profissional_id: z.string().uuid('Profissional inválido'),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  hora: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido'),
  nome: z.string().trim().min(3, 'Informe seu nome completo').max(120, 'Nome muito longo'),
  telefone: z
    .string()
    .trim()
    .refine(validarTelefone, 'Telefone inválido — use DDD + número'),
  email: z.string().trim().toLowerCase().email('E-mail inválido').max(160),
  cpf: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? limparCPF(v) : undefined))
    .refine((v) => !v || validarCPF(v), 'CPF inválido'),
  motivo: z.string().trim().min(3, 'Descreva brevemente o motivo').max(500, 'Máximo de 500 caracteres'),
  convenio_id: z.string().uuid('Escolha Particular ou um convênio'),
  numero_carteirinha: z
    .string()
    .trim()
    .max(60, 'Número da carteirinha muito longo')
    .optional()
    .transform((v) => v || undefined),
  lgpd: z.literal(true, { error: 'É necessário aceitar o uso dos dados' }),
  // Honeypot: campo invisível que só robôs preenchem
  website: z.string().max(0).optional(),
})

export type AgendamentoInput = z.input<typeof agendamentoSchema>

export type AgendamentoResult =
  | {
      success: true
      protocolo: string
      data: string
      hora: string
      profissional: string
    }
  | { success: false; error: string; horarioIndisponivel?: boolean }

async function hashDoIp(): Promise<string> {
  const h = await headers()
  const ip =
    h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip')?.trim() || 'desconhecido'
  const sal = process.env.AGENDAMENTO_IP_SALT ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  return createHash('sha256').update(`${sal}:${ip}`).digest('hex')
}

export async function criarAgendamentoOnline(values: unknown): Promise<AgendamentoResult> {
  const parsed = agendamentoSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }
  const v = parsed.data

  // Revalida no servidor que o horário está dentro da disponibilidade e livre
  const agenda = await carregarAgenda(v.profissional_id)
  if (!agenda) return { success: false, error: 'Profissional não encontrada.' }
  if (!agenda.dias[v.data]?.includes(v.hora)) {
    return {
      success: false,
      error: 'Este horário não está mais disponível. Escolha outro.',
      horarioIndisponivel: true,
    }
  }

  const horaFim = paraHora(paraMinutos(v.hora) + agenda.duracao)

  const admin = createAdminClient()
  const convenio = await verificarConvenioAceito(admin, v.profissional_id, v.convenio_id)
  if (!convenio.ok) return { success: false, error: convenio.erro }
  if (!convenio.particular && !v.numero_carteirinha) {
    return { success: false, error: 'Informe o número da carteirinha do convênio.' }
  }

  const { data, error } = await admin.rpc('criar_agendamento_online', {
    p_profissional_id: v.profissional_id,
    p_data: v.data,
    p_hora_inicio: v.hora,
    p_hora_fim: horaFim,
    p_nome: v.nome,
    p_telefone: v.telefone.replace(/\D/g, ''),
    p_email: v.email,
    p_cpf: v.cpf ?? null,
    p_motivo: v.motivo,
    p_ip_hash: await hashDoIp(),
    p_convenio_id: convenio.id,
    p_numero_carteirinha: convenio.particular ? null : (v.numero_carteirinha ?? null),
    p_limite_por_hora: LIMITE_POR_HORA,
  })

  if (error) {
    if (error.message.includes('CONVENIO_NAO_ACEITO')) {
      return { success: false, error: 'A profissional não atende por este convênio.' }
    }
    if (error.message.includes('CARTEIRINHA_OBRIGATORIA')) {
      return { success: false, error: 'Informe o número da carteirinha do convênio.' }
    }
    if (error.message.includes('LIMITE_EXCEDIDO')) {
      return {
        success: false,
        error: 'Limite de agendamentos atingido. Tente novamente em 1 hora ou ligue para a clínica.',
      }
    }
    if (error.message.includes('HORARIO_OCUPADO')) {
      return {
        success: false,
        error: 'Este horário acabou de ser reservado. Escolha outro.',
        horarioIndisponivel: true,
      }
    }
    console.error('[agendar] erro ao criar agendamento:', error)
    return { success: false, error: 'Não foi possível concluir o agendamento. Tente novamente.' }
  }

  const resultado = data?.[0]
  if (!resultado) return { success: false, error: 'Não foi possível concluir o agendamento.' }

  return {
    success: true,
    protocolo: resultado.numero_protocolo,
    data: v.data,
    hora: v.hora,
    profissional: agenda.prof.nome_completo,
  }
}
