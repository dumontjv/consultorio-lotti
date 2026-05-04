'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { registrarAuditoria } from '@/lib/audit/log'

const opt = (schema: z.ZodString) =>
  schema.optional().transform((v) => v?.trim() || undefined)

const evolucaoSchema = z.object({
  paciente_id: z.string().uuid(),
  profissional_id: z.string().uuid('Selecione um profissional'),
  consulta_id: z.string().uuid().optional().nullable(),
  conteudo: z.string().min(1, 'Descrição da evolução obrigatória'),
  conduta: opt(z.string()),
  hipotese_diagnostica: opt(z.string()),
  cids: z.array(z.string()).optional(),
  sinais_vitais: z
    .object({
      pa_sistolica: z.number().optional(),
      pa_diastolica: z.number().optional(),
      fc: z.number().optional(),
      fr: z.number().optional(),
      temperatura: z.number().optional(),
      spo2: z.number().optional(),
      peso: z.number().optional(),
      altura: z.number().optional(),
      glicemia: z.number().optional(),
      dor_escala: z.number().min(0).max(10).optional(),
    })
    .optional()
    .nullable(),
  exame_fisico: z
    .object({
      geral: z.string().optional(),
      cabeca_pescoco: z.string().optional(),
      torax: z.string().optional(),
      abdome: z.string().optional(),
      membros: z.string().optional(),
      neurologico: z.string().optional(),
      pele: z.string().optional(),
      outros: z.string().optional(),
    })
    .optional()
    .nullable(),
})

export type EvolucaoFormValues = z.input<typeof evolucaoSchema>
export type ActionResult = { success: true; id: string } | { success: false; error: string }

async function verificarAcessoClinico(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role === 'secretaria') return null
  return user
}

export async function criarEvolucao(values: unknown): Promise<ActionResult> {
  const supabase = await createClient()
  const user = await verificarAcessoClinico(supabase)
  if (!user) return { success: false, error: 'Não autenticado ou sem permissão' }

  const parsed = evolucaoSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }

  const { data, error } = await supabase
    .from('evolucoes')
    .insert({ ...parsed.data, data: new Date().toISOString() })
    .select('id')
    .single()

  if (error) return { success: false, error: 'Erro ao salvar evolução. Tente novamente.' }

  await registrarAuditoria({ acao: 'create', entidade: 'evolucoes', entidadeId: data.id })
  revalidatePath(`/pacientes/${parsed.data.paciente_id}/evolucoes`)
  return { success: true, id: data.id }
}

export async function atualizarEvolucao(id: string, values: unknown): Promise<ActionResult> {
  const supabase = await createClient()
  const user = await verificarAcessoClinico(supabase)
  if (!user) return { success: false, error: 'Não autenticado ou sem permissão' }

  const parsed = evolucaoSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }

  const { error } = await supabase.from('evolucoes').update(parsed.data).eq('id', id)
  if (error) return { success: false, error: 'Erro ao atualizar evolução. Tente novamente.' }

  await registrarAuditoria({ acao: 'update', entidade: 'evolucoes', entidadeId: id })
  revalidatePath(`/pacientes/${parsed.data.paciente_id}/evolucoes`)
  return { success: true, id }
}

export async function deletarEvolucao(id: string, pacienteId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const user = await verificarAcessoClinico(supabase)
  if (!user) return { success: false, error: 'Não autenticado ou sem permissão' }

  const { error } = await supabase
    .from('evolucoes')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { success: false, error: 'Erro ao excluir evolução.' }

  await registrarAuditoria({ acao: 'delete', entidade: 'evolucoes', entidadeId: id })
  revalidatePath(`/pacientes/${pacienteId}/evolucoes`)
  return { success: true, id }
}
