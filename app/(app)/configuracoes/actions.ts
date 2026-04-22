'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const opt = (schema: z.ZodString) =>
  schema.optional().transform((v) => v?.trim() || undefined)

const configSchema = z.object({
  consultorio_nome: z.string().min(1, 'Nome do consultório obrigatório'),
  consultorio_endereco: opt(z.string()),
  consultorio_celular: opt(z.string()),
  consultorio_email: opt(z.string()),
  consultorio_cnpj: opt(z.string()),
})

export type ConfigFormValues = z.input<typeof configSchema>
export type ActionResult = { success: true } | { success: false; error: string }

export async function salvarConfiguracoes(values: unknown): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const parsed = configSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }

  const { error } = await supabase
    .from('configuracoes')
    .upsert({ id: 1, ...parsed.data }, { onConflict: 'id' })

  if (error) return { success: false, error: 'Erro ao salvar configurações.' }

  revalidatePath('/configuracoes')
  return { success: true }
}

export async function salvarPerfilUsuario(values: {
  nome_completo: string
  telefone?: string | null
}): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { error } = await supabase
    .from('profiles')
    .update({
      nome_completo: values.nome_completo.trim(),
      telefone: values.telefone?.trim() || null,
    })
    .eq('id', user.id)

  if (error) return { success: false, error: 'Erro ao salvar perfil.' }

  revalidatePath('/configuracoes/perfil')
  return { success: true }
}
