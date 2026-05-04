'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { registrarAuditoria } from '@/lib/audit/log'

const pacoteSchema = z.object({
  paciente_id: z.string().uuid(),
  sessoes_total: z.number().int().min(1),
  valor_total: z.number().positive('Valor obrigatório'),
  desconto_percentual: z.number().min(0).max(100),
  data_inicio: z.string().min(1, 'Data de início obrigatória'),
  data_fim: z.string().optional().nullable(),
})

export type PacoteFormValues = z.input<typeof pacoteSchema>
export type ActionResult = { success: true; id: string } | { success: false; error: string }

export async function criarPacote(values: unknown): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const parsed = pacoteSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }

  const { data, error } = await supabase
    .from('pacotes_psicologia')
    .insert({ ...parsed.data, sessoes_usadas: 0, status: 'ativo' })
    .select('id')
    .single()

  if (error) return { success: false, error: 'Erro ao criar pacote.' }

  await registrarAuditoria({ acao: 'create', entidade: 'pacotes_psicologia', entidadeId: data.id })
  revalidatePath(`/pacientes/${parsed.data.paciente_id}/pacotes`)
  return { success: true, id: data.id }
}

export async function registrarSessao(
  pacoteId: string,
  pacienteId: string
): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { data: pacote } = await supabase
    .from('pacotes_psicologia')
    .select('sessoes_total, sessoes_usadas')
    .eq('id', pacoteId)
    .single()

  if (!pacote) return { success: false, error: 'Pacote não encontrado.' }

  const novasSessoes = (pacote.sessoes_usadas ?? 0) + 1
  const concluido = novasSessoes >= pacote.sessoes_total

  const { error } = await supabase
    .from('pacotes_psicologia')
    .update({
      sessoes_usadas: novasSessoes,
      status: concluido ? 'concluido' : 'ativo',
    })
    .eq('id', pacoteId)

  if (error) return { success: false, error: 'Erro ao registrar sessão.' }

  await registrarAuditoria({ acao: 'update', entidade: 'pacotes_psicologia', entidadeId: pacoteId })
  revalidatePath(`/pacientes/${pacienteId}/pacotes`)
  return { success: true, id: pacoteId }
}

export async function cancelarPacote(
  pacoteId: string,
  pacienteId: string
): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { error } = await supabase
    .from('pacotes_psicologia')
    .update({ status: 'cancelado' })
    .eq('id', pacoteId)

  if (error) return { success: false, error: 'Erro ao cancelar pacote.' }

  await registrarAuditoria({ acao: 'update', entidade: 'pacotes_psicologia', entidadeId: pacoteId })
  revalidatePath(`/pacientes/${pacienteId}/pacotes`)
  return { success: true, id: pacoteId }
}
