'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { registrarAuditoria } from '@/lib/audit/log'

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

  await registrarAuditoria({ acao: 'update', entidade: 'configuracoes' })
  revalidatePath('/configuracoes')
  return { success: true }
}

export async function salvarPerfilUsuario(values: {
  nome_completo: string
  telefone?: string | null
  foto_url?: string | null
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
      ...(values.foto_url !== undefined ? { foto_url: values.foto_url } : {}),
    })
    .eq('id', user.id)

  if (error) return { success: false, error: 'Erro ao salvar perfil.' }

  await registrarAuditoria({ acao: 'update', entidade: 'profiles', entidadeId: user.id })
  revalidatePath('/configuracoes/perfil')
  return { success: true }
}

export async function salvarLogoConsultorio(logoUrl: string): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { error } = await supabase
    .from('configuracoes')
    .upsert({ id: 1, consultorio_logo_url: logoUrl }, { onConflict: 'id' })

  if (error) return { success: false, error: 'Erro ao salvar logo.' }

  await registrarAuditoria({ acao: 'update', entidade: 'configuracoes' })
  revalidatePath('/configuracoes')
  return { success: true }
}
