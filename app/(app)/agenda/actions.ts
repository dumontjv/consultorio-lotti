'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

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

  const { data: consulta, error } = await supabase
    .from('consultas')
    .insert({ ...parsed.data, criado_por: user.id, status: 'agendada' })
    .select('id')
    .single()

  if (error) return { success: false, error: 'Erro ao agendar consulta. Tente novamente.' }

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

  revalidatePath('/agenda')
  return { success: true, id }
}
