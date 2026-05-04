'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { registrarAuditoria } from '@/lib/audit/log'

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
