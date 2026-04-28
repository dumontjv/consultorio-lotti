'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const opt = (schema: z.ZodString) =>
  schema.optional().transform((v) => v?.trim() || undefined)

const lancamentoSchema = z.object({
  paciente_id: z.string().uuid('Selecione um paciente'),
  profissional_id: z.string().uuid('Selecione um profissional'),
  consulta_id: z.string().uuid().optional().nullable(),
  tipo: z.enum(['consulta', 'pacote', 'outro']),
  descricao: z.string().min(1, 'Descrição obrigatória'),
  valor: z.number().positive('Valor deve ser positivo'),
  forma_pagamento: z.enum([
    'dinheiro',
    'credito',
    'debito',
    'pix',
    'transferencia',
    'convenio',
    'boleto',
  ]),
  status: z.enum(['pendente', 'pago', 'cancelado', 'estornado']),
  data_vencimento: z.string().min(1, 'Data de vencimento obrigatória'),
  data_pagamento: z.string().optional().nullable(),
  observacoes: opt(z.string()),
})

export type LancamentoFormValues = z.input<typeof lancamentoSchema>
export type ActionResult = { success: true; id: string } | { success: false; error: string }

export async function criarLancamento(values: unknown): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const parsed = lancamentoSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }

  const { data, error } = await supabase
    .from('financeiro')
    .insert(parsed.data)
    .select('id')
    .single()

  if (error) return { success: false, error: 'Erro ao registrar lançamento. Tente novamente.' }

  revalidatePath('/financeiro')
  return { success: true, id: data.id }
}

export async function atualizarLancamento(id: string, values: unknown): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const parsed = lancamentoSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }

  const { error } = await supabase.from('financeiro').update(parsed.data).eq('id', id)
  if (error) return { success: false, error: 'Erro ao atualizar lançamento. Tente novamente.' }

  revalidatePath('/financeiro')
  return { success: true, id }
}

export async function marcarComoPago(
  id: string,
  data_pagamento: string,
  forma_pagamento?: string
): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const update = {
    status: 'pago' as const,
    data_pagamento,
    ...(forma_pagamento ? { forma_pagamento: forma_pagamento as Parameters<typeof supabase.from>[0] extends never ? never : 'pix' | 'dinheiro' | 'credito' | 'debito' | 'convenio' | 'transferencia' | 'boleto' } : {}),
  }

  const { error } = await supabase.from('financeiro').update(update).eq('id', id)

  if (error) return { success: false, error: 'Erro ao registrar pagamento.' }

  revalidatePath('/financeiro')
  return { success: true, id }
}

export async function cancelarLancamento(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { error } = await supabase.from('financeiro').update({ status: 'cancelado' }).eq('id', id)
  if (error) return { success: false, error: 'Erro ao cancelar lançamento.' }

  revalidatePath('/financeiro')
  return { success: true, id }
}
