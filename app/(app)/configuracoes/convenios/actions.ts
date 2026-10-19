'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { registrarAuditoria } from '@/lib/audit/log'

export type ActionResult = { success: true; id: string } | { success: false; error: string }

const valor = z.number().nonnegative('Valor não pode ser negativo').max(100000).nullable()

const convenioSchema = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().trim().min(2, 'Informe o nome do convênio').max(80, 'Nome muito longo'),
  ativo: z.boolean(),
  profissionais: z
    .array(
      z.object({
        profissional_id: z.string().uuid(),
        valor_particular_padrao: valor,
        valor_primeira_consulta: valor,
        valor_repasse: valor,
      })
    )
    .max(50),
})

export type ConvenioInput = z.input<typeof convenioSchema>

async function exigirAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { erro: 'Não autenticado' } as const

  const { data: perfil } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (perfil?.role !== 'admin') return { erro: 'Apenas administradores podem gerenciar convênios.' } as const

  return { supabase } as const
}

export async function salvarConvenio(values: unknown): Promise<ActionResult> {
  const auth = await exigirAdmin()
  if ('erro' in auth) return { success: false, error: auth.erro ?? 'Erro' }
  const { supabase } = auth

  const parsed = convenioSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }
  const { id, nome, ativo, profissionais } = parsed.data

  let particular = false
  if (id) {
    const { data: atual } = await supabase.from('convenios').select('particular').eq('id', id).maybeSingle()
    if (!atual) return { success: false, error: 'Convênio não encontrado.' }
    particular = atual.particular
    if (particular && !ativo) return { success: false, error: 'O Particular não pode ser desativado.' }
  }

  const { data: salvo, error } = id
    ? await supabase.from('convenios').update({ nome, ativo }).eq('id', id).select('id').single()
    : await supabase.from('convenios').insert({ nome, ativo }).select('id').single()

  if (error) {
    if (error.code === '23505') return { success: false, error: 'Já existe um convênio com esse nome.' }
    return { success: false, error: 'Erro ao salvar o convênio.' }
  }

  // Valores de Particular e de repasse são exclusivos de cada tipo
  const linhas = profissionais.map((p) => ({
    convenio_id: salvo.id,
    profissional_id: p.profissional_id,
    valor_particular_padrao: particular ? p.valor_particular_padrao : null,
    valor_primeira_consulta: particular ? p.valor_primeira_consulta : null,
    valor_repasse: particular ? null : p.valor_repasse,
  }))

  const idsMantidos = linhas.map((l) => l.profissional_id)
  let remover = supabase.from('convenio_profissional').delete().eq('convenio_id', salvo.id)
  if (idsMantidos.length > 0) remover = remover.not('profissional_id', 'in', `(${idsMantidos.join(',')})`)
  const { error: erroRemover } = await remover
  if (erroRemover) return { success: false, error: 'Erro ao atualizar as profissionais do convênio.' }

  if (linhas.length > 0) {
    const { error: erroUpsert } = await supabase
      .from('convenio_profissional')
      .upsert(linhas, { onConflict: 'convenio_id,profissional_id' })
    if (erroUpsert) return { success: false, error: 'Erro ao salvar os valores por profissional.' }
  }

  await registrarAuditoria({
    acao: id ? 'update' : 'create',
    entidade: 'convenios',
    entidadeId: salvo.id,
    dadosNovos: { nome, ativo, profissionais: linhas },
  })
  revalidatePath('/configuracoes/convenios')
  revalidatePath('/agenda')
  return { success: true, id: salvo.id }
}

export async function alterarAtivoConvenio(id: string, ativo: boolean): Promise<ActionResult> {
  const auth = await exigirAdmin()
  if ('erro' in auth) return { success: false, error: auth.erro ?? 'Erro' }
  const { supabase } = auth

  if (!z.string().uuid().safeParse(id).success) return { success: false, error: 'Convênio inválido.' }

  const { data: atual } = await supabase.from('convenios').select('particular').eq('id', id).maybeSingle()
  if (!atual) return { success: false, error: 'Convênio não encontrado.' }
  if (atual.particular && !ativo) return { success: false, error: 'O Particular não pode ser desativado.' }

  const { error } = await supabase.from('convenios').update({ ativo }).eq('id', id)
  if (error) return { success: false, error: 'Erro ao atualizar o convênio.' }

  await registrarAuditoria({ acao: 'update', entidade: 'convenios', entidadeId: id, dadosNovos: { ativo } })
  revalidatePath('/configuracoes/convenios')
  revalidatePath('/agenda')
  return { success: true, id }
}
