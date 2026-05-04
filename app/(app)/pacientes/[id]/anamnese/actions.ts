'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { registrarAuditoria } from '@/lib/audit/log'

const opt = (schema: z.ZodString) =>
  schema.optional().transform((v) => v?.trim() || undefined)

const anamneseSchema = z.object({
  paciente_id: z.string().uuid(),
  hda: opt(z.string()),
  atividade_fisica: z.boolean().optional(),
  sedentario: z.boolean().optional(),
  menarca: z.string().optional().nullable(),
  menopausa: z.string().optional().nullable(),
  has: z
    .object({ tem: z.boolean(), descricao: opt(z.string()), medicacao: opt(z.string()) })
    .optional(),
  dm: z
    .object({
      tem: z.boolean(),
      tipo: z.string().optional(),
      medicacao: opt(z.string()),
      insulina: z.boolean().optional(),
    })
    .optional(),
  outras_patologias: z
    .object({ lista: z.array(z.string()).optional() })
    .optional(),
  alergia_medicamentosa: z
    .object({
      medicamentos: z
        .array(z.object({ nome: z.string(), reacao: z.string().optional() }))
        .optional(),
    })
    .optional(),
  medicacao_regular: z
    .object({
      lista: z
        .array(
          z.object({
            nome: z.string(),
            dose: z.string().optional(),
            frequencia: z.string().optional(),
          })
        )
        .optional(),
    })
    .optional(),
  tabagismo: z
    .object({
      ex_fumante: z.boolean().optional(),
      cigarros_dia: z.number().optional(),
      anos_fumando: z.number().optional(),
    })
    .optional(),
  etilismo: z
    .object({
      frequencia: z.string().optional(),
      doses_semana: z.number().optional(),
    })
    .optional(),
  historico_familiar: z
    .object({
      has: z.boolean().optional(),
      dm: z.boolean().optional(),
      cardiopatia: z.boolean().optional(),
      cancer: z.array(z.string()).optional(),
      doenca_mental: z.boolean().optional(),
      outras: z.string().optional(),
    })
    .optional(),
  gesta: z
    .object({
      gesta: z.number().optional(),
      para: z.number().optional(),
      aborto: z.number().optional(),
      cesarea: z.number().optional(),
    })
    .optional(),
  cirurgias: z
    .object({
      tem: z.boolean(),
      lista: z
        .array(z.object({ descricao: z.string(), ano: z.number().optional() }))
        .optional(),
    })
    .optional(),
})

export type AnamneseFormValues = z.input<typeof anamneseSchema>
export type ActionResult = { success: true } | { success: false; error: string }

export async function salvarAnamnese(pacienteId: string, values: unknown): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role === 'secretaria') return { success: false, error: 'Sem permissão' }

  const parsed = anamneseSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }

  const { data: existente } = await supabase
    .from('anamnese')
    .select('id')
    .eq('paciente_id', pacienteId)
    .single()

  const payload = { ...parsed.data, atualizado_por: user.id }

  if (existente) {
    const { error } = await supabase.from('anamnese').update(payload).eq('id', existente.id)
    if (error) return { success: false, error: 'Erro ao salvar anamnese.' }
    await registrarAuditoria({ acao: 'update', entidade: 'anamnese', entidadeId: existente.id })
  } else {
    const { error } = await supabase.from('anamnese').insert(payload)
    if (error) return { success: false, error: 'Erro ao criar anamnese.' }
    await registrarAuditoria({ acao: 'create', entidade: 'anamnese', entidadeId: pacienteId })
  }

  revalidatePath(`/pacientes/${pacienteId}/anamnese`)
  return { success: true }
}
