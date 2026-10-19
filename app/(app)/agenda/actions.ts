'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { registrarAuditoria } from '@/lib/audit/log'
import { enviarEmailRecusaAgendamento } from '@/lib/email/recusa-agendamento'

const consultaSchema = z.object({
  paciente_id: z.string().uuid('Selecione um paciente válido'),
  profissional_id: z.string().uuid('Selecione um profissional válido'),
  tipo: z.enum(['presencial', 'teleconsulta']).default('presencial'),
  data: z.string().min(1, 'Data obrigatória'),
  hora_inicio: z.string().min(1, 'Horário de início obrigatório'),
  hora_fim: z.string().min(1, 'Horário de fim obrigatório'),
  valor_cobrado: z
    .union([z.number().positive('Valor deve ser positivo'), z.null()])
    .optional()
    .nullable(),
  observacoes: z
    .string()
    .optional()
    .transform((v) => v?.trim() || undefined),
  link_teleconsulta: z
    .string()
    .optional()
    .transform((v) => v?.trim() || undefined),
})

export type ConsultaFormValues = z.input<typeof consultaSchema>
export type ActionResult = { success: true; id: string } | { success: false; error: string }

export async function criarConsulta(values: unknown): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const parsed = consultaSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }

  const [{ data: paciente }, { data: profissional }] = await Promise.all([
    supabase
      .from('pacientes')
      .select('id')
      .eq('id', parsed.data.paciente_id)
      .is('deleted_at', null)
      .single(),
    supabase
      .from('profiles')
      .select('id')
      .eq('id', parsed.data.profissional_id)
      .eq('ativo', true)
      .single(),
  ])

  if (!paciente) return { success: false, error: 'Paciente não encontrado.' }
  if (!profissional) return { success: false, error: 'Profissional não encontrado ou inativo.' }

  const { data: consulta, error } = await supabase
    .from('consultas')
    .insert({ ...parsed.data, criado_por: user.id, status: 'agendada' })
    .select('id')
    .single()

  if (error) return { success: false, error: 'Erro ao agendar consulta. Tente novamente.' }

  await registrarAuditoria({ acao: 'create', entidade: 'consultas', entidadeId: consulta.id })
  revalidatePath('/agenda')
  return { success: true, id: consulta.id }
}

export async function atualizarConsulta(id: string, values: unknown): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const parsed = consultaSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }

  const { error } = await supabase.from('consultas').update(parsed.data).eq('id', id)
  if (error) return { success: false, error: 'Erro ao atualizar consulta. Tente novamente.' }

  await registrarAuditoria({ acao: 'update', entidade: 'consultas', entidadeId: id })
  revalidatePath('/agenda')
  return { success: true, id }
}

export async function atualizarStatusConsulta(
  id: string,
  status: 'agendada' | 'confirmada' | 'compareceu' | 'faltou' | 'cancelada'
): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { error } = await supabase.from('consultas').update({ status }).eq('id', id)
  if (error) return { success: false, error: 'Erro ao atualizar status' }

  await registrarAuditoria({ acao: 'update', entidade: 'consultas', entidadeId: id })
  revalidatePath('/agenda')
  return { success: true, id }
}

// ── Agendamentos online pendentes ────────────────────────────

async function carregarPendenteAutorizado(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { erro: 'Não autenticado' } as const

  const [{ data: perfil }, { data: consulta }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    supabase
      .from('consultas')
      .select('id, paciente_id, profissional_id, data, hora_inicio, status, protocolo, solicitante_nome, solicitante_email')
      .eq('id', id)
      .maybeSingle(),
  ])

  if (!consulta) return { erro: 'Agendamento não encontrado.' } as const
  if (consulta.status !== 'pendente_confirmacao') {
    return { erro: 'Este agendamento já foi analisado.' } as const
  }

  const podeAnalisar =
    perfil?.role === 'admin' || perfil?.role === 'secretaria' || consulta.profissional_id === user.id
  if (!podeAnalisar) return { erro: 'Você não tem permissão para analisar este agendamento.' } as const

  return { supabase, consulta } as const
}

export async function aprovarAgendamentoOnline(id: string): Promise<ActionResult> {
  const r = await carregarPendenteAutorizado(id)
  if ('erro' in r) return { success: false, error: r.erro ?? 'Erro' }

  const { data: atualizada, error } = await r.supabase
    .from('consultas')
    .update({ status: 'agendada' })
    .eq('id', id)
    .eq('status', 'pendente_confirmacao')
    .select('id')
    .maybeSingle()

  if (error || !atualizada) return { success: false, error: 'Erro ao aprovar agendamento.' }

  await registrarAuditoria({
    acao: 'update',
    entidade: 'consultas',
    entidadeId: id,
    dadosAnteriores: { status: 'pendente_confirmacao' },
    dadosNovos: { status: 'agendada' },
  })
  revalidatePath('/agenda')
  return { success: true, id }
}

export type RejeicaoResult =
  | { success: true; id: string; emailEnviado: boolean; aviso?: string }
  | { success: false; error: string }

export async function rejeitarAgendamentoOnline(id: string): Promise<RejeicaoResult> {
  const r = await carregarPendenteAutorizado(id)
  if ('erro' in r) return { success: false, error: r.erro ?? 'Erro' }
  const { supabase, consulta } = r

  const { data: atualizada, error } = await supabase
    .from('consultas')
    .update({ status: 'cancelada' })
    .eq('id', id)
    .eq('status', 'pendente_confirmacao')
    .select('id')
    .maybeSingle()

  if (error || !atualizada) return { success: false, error: 'Erro ao rejeitar agendamento.' }

  // Remove (soft delete) o paciente criado só por este pedido online:
  // sem criador interno e sem nenhuma outra consulta.
  const admin = createAdminClient()
  const [{ data: paciente }, { count: outrasConsultas }] = await Promise.all([
    admin.from('pacientes').select('id, criado_por').eq('id', consulta.paciente_id).maybeSingle(),
    admin
      .from('consultas')
      .select('id', { count: 'exact', head: true })
      .eq('paciente_id', consulta.paciente_id)
      .neq('id', id),
  ])
  if (paciente && !paciente.criado_por && (outrasConsultas ?? 0) === 0) {
    await admin
      .from('pacientes')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', paciente.id)
  }

  await registrarAuditoria({
    acao: 'update',
    entidade: 'consultas',
    entidadeId: id,
    dadosAnteriores: { status: 'pendente_confirmacao' },
    dadosNovos: { status: 'cancelada', motivo: 'agendamento online rejeitado' },
  })
  revalidatePath('/agenda')

  if (!consulta.solicitante_email) {
    return { success: true, id, emailEnviado: false, aviso: 'Pedido sem e-mail cadastrado.' }
  }

  const { data: config } = await admin
    .from('configuracoes')
    .select('consultorio_nome')
    .eq('id', 1)
    .maybeSingle()

  const email = await enviarEmailRecusaAgendamento({
    para: consulta.solicitante_email,
    nome: consulta.solicitante_nome ?? 'paciente',
    data: consulta.data,
    hora: consulta.hora_inicio,
    protocolo: consulta.protocolo,
    nomeClinica: config?.consultorio_nome || 'Pronto',
  })

  return email.enviado
    ? { success: true, id, emailEnviado: true }
    : { success: true, id, emailEnviado: false, aviso: email.motivo }
}
