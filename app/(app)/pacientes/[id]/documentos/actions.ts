'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const opt = (schema: z.ZodString) =>
  schema.optional().transform((v) => v?.trim() || undefined)

const documentoSchema = z.object({
  paciente_id: z.string().uuid(),
  profissional_id: z.string().uuid('Selecione um profissional'),
  tipo: z.enum(['receita', 'laudo', 'atestado', 'caso_clinico', 'solicitacao_exame', 'relatorio']),
  titulo: z.string().min(1, 'Título obrigatório'),
  conteudo: z.string().min(1, 'Conteúdo obrigatório'),
  data_emissao: z.string().min(1, 'Data de emissão obrigatória'),
  status: z.enum(['rascunho', 'assinado', 'entregue', 'cancelado']),
})

export type DocumentoFormValues = z.input<typeof documentoSchema>
export type ActionResult = { success: true; id: string } | { success: false; error: string }

export async function criarDocumento(values: unknown): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const parsed = documentoSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }

  const { data, error } = await supabase
    .from('documentos')
    .insert(parsed.data)
    .select('id')
    .single()

  if (error) return { success: false, error: 'Erro ao criar documento. Tente novamente.' }

  revalidatePath(`/pacientes/${parsed.data.paciente_id}/documentos`)
  revalidatePath('/documentos')
  return { success: true, id: data.id }
}

export async function atualizarDocumento(id: string, values: unknown): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const parsed = documentoSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }

  const { error } = await supabase.from('documentos').update(parsed.data).eq('id', id)
  if (error) return { success: false, error: 'Erro ao atualizar documento. Tente novamente.' }

  revalidatePath(`/pacientes/${parsed.data.paciente_id}/documentos`)
  revalidatePath('/documentos')
  return { success: true, id }
}

export async function deletarDocumento(id: string, pacienteId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { error } = await supabase.from('documentos').delete().eq('id', id)
  if (error) return { success: false, error: 'Erro ao excluir documento.' }

  revalidatePath(`/pacientes/${pacienteId}/documentos`)
  revalidatePath('/documentos')
  return { success: true, id }
}
