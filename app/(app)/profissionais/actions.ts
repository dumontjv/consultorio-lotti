'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const opt = () =>
  z
    .string()
    .optional()
    .transform((v) => v?.trim() || undefined)

const baseSchema = z.object({
  nome_completo: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  role: z.enum(['medica', 'psicologa', 'secretaria'], { message: 'Função inválida' }),
  crm: opt(),
  crp: opt(),
  telefone: opt(),
  ativo: z.boolean().default(true),
})

const criarSchema = baseSchema.extend({
  email: z.string().email('E-mail inválido'),
})

export type ProfissionalFormValues = z.input<typeof criarSchema>
export type ActionResult = { success: true; id: string } | { success: false; error: string }

async function verificarAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') return null
  return { user, supabase }
}

export async function criarProfissional(values: unknown): Promise<ActionResult> {
  const admin = await verificarAdmin()
  if (!admin) return { success: false, error: 'Acesso negado' }

  const parsed = criarSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }

  const { email, nome_completo, role, crm, crp, telefone, ativo } = parsed.data

  const adminClient = createAdminClient()
  const tempPassword = crypto.randomUUID().replace(/-/g, '').slice(0, 10) + 'Aa1!'

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { nome_completo, role },
  })

  if (authError) {
    if (authError.message?.includes('already been registered')) {
      return { success: false, error: 'E-mail já cadastrado no sistema' }
    }
    return { success: false, error: 'Erro ao criar usuário. Tente novamente.' }
  }

  await adminClient
    .from('profiles')
    .update({ nome_completo, role, crm, crp, telefone, ativo })
    .eq('id', authData.user.id)

  revalidatePath('/profissionais')
  return { success: true, id: authData.user.id }
}

export async function atualizarProfissional(id: string, values: unknown): Promise<ActionResult> {
  const ctx = await verificarAdmin()
  if (!ctx) return { success: false, error: 'Acesso negado' }

  const parsed = baseSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }

  const { error } = await ctx.supabase
    .from('profiles')
    .update(parsed.data)
    .eq('id', id)

  if (error) return { success: false, error: 'Erro ao atualizar profissional. Tente novamente.' }

  revalidatePath('/profissionais')
  revalidatePath(`/profissionais/${id}/editar`)
  return { success: true, id }
}
