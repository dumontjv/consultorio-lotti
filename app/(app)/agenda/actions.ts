'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { registrarAuditoria } from '@/lib/audit/log'
import { enviarEmailRecusaAgendamento } from '@/lib/email/recusa-agendamento'
import { verificarConvenioAceito } from '@/lib/convenios/servidor'

const textoOpcional = z
  .string()
  .max(60)
  .optional()
  .nullable()
  .transform((v) => v?.trim() || null)

const consultaSchema = z.object({
  paciente_id: z.string().uuid('Selecione um paciente válido'),
  profissional_id: z.string().uuid('Selecione um profissional válido'),
  convenio_id: z.string().uuid('Selecione o convênio'),
  tipo: z.enum(['presencial', 'teleconsulta']).default('presencial'),
  data: z.string().min(1, 'Data obrigatória'),
  hora_inicio: z.string().min(1, 'Horário de início obrigatório'),
  hora_fim: z.string().min(1, 'Horário de fim obrigatório'),
  valor_cobrado: z
    .union([z.number().nonnegative('Valor não pode ser negativo'), z.null()])
    .optional()
    .nullable(),
  numero_carteirinha: textoOpcional,
  numero_guia: textoOpcional,
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

type DadosConsulta = z.output<typeof consultaSchema>
type ClienteServidor = Awaited<ReturnType<typeof createClient>>

/** Regras do convênio validadas no servidor, mesmo que a requisição venha de fora da tela. */
async function aplicarRegrasConvenio(
  supabase: ClienteServidor,
  dados: DadosConsulta,
  convenioAtual?: string | null
): Promise<{ ok: true; dados: DadosConsulta } | { ok: false; error: string }> {
  const convenio = await verificarConvenioAceito(
    supabase,
    dados.profissional_id,
    dados.convenio_id,
    convenioAtual
  )
  if (!convenio.ok) return { ok: false, error: convenio.erro }

  return {
    ok: true,
    dados: convenio.particular
      ? { ...dados, numero_carteirinha: null, numero_guia: null }
      : { ...dados, valor_cobrado: null },
  }
}

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

  const regras = await aplicarRegrasConvenio(supabase, parsed.data)
  if (!regras.ok) return { success: false, error: regras.error }

  const { data: consulta, error } = await supabase
    .from('consultas')
    .insert({ ...regras.dados, criado_por: user.id, status: 'agendada' })
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

  const { data: atual } = await supabase
    .from('consultas')
    .select('convenio_id')
    .eq('id', id)
    .maybeSingle()
  if (!atual) return { success: false, error: 'Consulta não encontrada.' }

  const regras = await aplicarRegrasConvenio(supabase, parsed.data, atual.convenio_id)
  if (!regras.ok) return { success: false, error: regras.error }

  const { error } = await supabase.from('consultas').update(regras.dados).eq('id', id)
  if (error) return { success: false, error: 'Erro ao atualizar consulta. Tente novamente.' }

  await registrarAuditoria({ acao: 'update', entidade: 'consultas', entidadeId: id })
  revalidatePath('/agenda')
  return { success: true, id }
}

export type StatusResult =
  | { success: true; id: string; aviso?: string }
  | { success: false; error: string }

/**
 * Consulta por convênio marcada como realizada gera um lançamento pendente
 * (forma de pagamento "convênio"), a ser baixado quando o plano repassar.
 * Retorna um aviso para a tela quando algo precisa de atenção.
 */
async function gerarLancamentoConvenio(
  supabase: ClienteServidor,
  consultaId: string,
  usuarioId: string
): Promise<string | undefined> {
  const { data: c } = await supabase
    .from('consultas')
    .select('id, paciente_id, profissional_id, convenio_id, data, numero_guia')
    .eq('id', consultaId)
    .maybeSingle()
  if (!c) return

  const convenio = await verificarConvenioAceito(supabase, c.profissional_id, c.convenio_id, c.convenio_id)
  if (!convenio.ok || convenio.particular) return

  const { count } = await supabase
    .from('financeiro')
    .select('id', { count: 'exact', head: true })
    .eq('consulta_id', c.id)
    .neq('status', 'cancelado')
  if ((count ?? 0) > 0) return

  const { data: lancamento, error } = await supabase
    .from('financeiro')
    .insert({
      paciente_id: c.paciente_id,
      profissional_id: c.profissional_id,
      consulta_id: c.id,
      convenio_id: convenio.id,
      tipo: 'consulta',
      descricao: `Consulta — ${convenio.nome}${c.numero_guia ? ` (guia ${c.numero_guia})` : ''}`,
      valor: convenio.valorRepasse ?? 0,
      forma_pagamento: 'convenio',
      status: 'pendente',
      data_vencimento: c.data,
      registrado_por: usuarioId,
    })
    .select('id')
    .single()

  if (error) return 'Status atualizado, mas não foi possível gerar o lançamento do convênio.'

  await registrarAuditoria({ acao: 'create', entidade: 'financeiro', entidadeId: lancamento.id })
  revalidatePath('/financeiro')

  if (convenio.valorRepasse === null) {
    return `Lançamento do ${convenio.nome} criado com R$ 0,00. Cadastre o valor de repasse em Convênios e ajuste o lançamento.`
  }
}

export async function atualizarStatusConsulta(
  id: string,
  status: 'agendada' | 'confirmada' | 'compareceu' | 'faltou' | 'cancelada'
): Promise<StatusResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { error } = await supabase.from('consultas').update({ status }).eq('id', id)
  if (error) return { success: false, error: 'Erro ao atualizar status' }

  await registrarAuditoria({ acao: 'update', entidade: 'consultas', entidadeId: id })

  const aviso =
    status === 'compareceu' ? await gerarLancamentoConvenio(supabase, id, user.id) : undefined

  revalidatePath('/agenda')
  return { success: true, id, aviso }
}

// ── Agendamentos online pendentes ────────────────────────────

async function carregarPendenteAutorizado(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { erro: 'Não autenticado' } as const

  const [{ data: perfil }, { data: consulta }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    supabase
      .from('consultas')
      .select('id, paciente_id, profissional_id, data, hora_inicio, status, protocolo, solicitante_nome, solicitante_email')
      .eq('id', id)
      .maybeSingle(),
  ])

  if (!consulta) return { erro: 'Agendamento não encontrado.' } as const
  if (consulta.status !== 'pendente_confirmacao') {
    return { erro: 'Este agendamento já foi analisado.' } as const
  }

  const podeAnalisar =
    perfil?.role === 'admin' || perfil?.role === 'secretaria' || consulta.profissional_id === user.id
  if (!podeAnalisar) return { erro: 'Você não tem permissão para analisar este agendamento.' } as const

  return { supabase, consulta } as const
}

export async function aprovarAgendamentoOnline(id: string): Promise<ActionResult> {
  const r = await carregarPendenteAutorizado(id)
  if ('erro' in r) return { success: false, error: r.erro ?? 'Erro' }

  const { data: atualizada, error } = await r.supabase
    .from('consultas')
    .update({ status: 'agendada' })
    .eq('id', id)
    .eq('status', 'pendente_confirmacao')
    .select('id')
    .maybeSingle()

  if (error || !atualizada) return { success: false, error: 'Erro ao aprovar agendamento.' }

  await registrarAuditoria({
    acao: 'update',
    entidade: 'consultas',
    entidadeId: id,
    dadosAnteriores: { status: 'pendente_confirmacao' },
    dadosNovos: { status: 'agendada' },
  })
  revalidatePath('/agenda')
  return { success: true, id }
}

export type RejeicaoResult =
  | { success: true; id: string; emailEnviado: boolean; aviso?: string }
  | { success: false; error: string }

export async function rejeitarAgendamentoOnline(id: string): Promise<RejeicaoResult> {
  const r = await carregarPendenteAutorizado(id)
  if ('erro' in r) return { success: false, error: r.erro ?? 'Erro' }
  const { supabase, consulta } = r

  const { data: atualizada, error } = await supabase
    .from('consultas')
    .update({ status: 'cancelada' })
    .eq('id', id)
    .eq('status', 'pendente_confirmacao')
    .select('id')
    .maybeSingle()

  if (error || !atualizada) return { success: false, error: 'Erro ao rejeitar agendamento.' }

  // Remove (soft delete) o paciente criado só por este pedido online:
  // sem criador interno e sem nenhuma outra consulta.
  const admin = createAdminClient()
  const [{ data: paciente }, { count: outrasConsultas }] = await Promise.all([
    admin.from('pacientes').select('id, criado_por').eq('id', consulta.paciente_id).maybeSingle(),
    admin
      .from('consultas')
      .select('id', { count: 'exact', head: true })
      .eq('paciente_id', consulta.paciente_id)
      .neq('id', id),
  ])
  if (paciente && !paciente.criado_por && (outrasConsultas ?? 0) === 0) {
    await admin
      .from('pacientes')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', paciente.id)
  }

  await registrarAuditoria({
    acao: 'update',
    entidade: 'consultas',
    entidadeId: id,
    dadosAnteriores: { status: 'pendente_confirmacao' },
    dadosNovos: { status: 'cancelada', motivo: 'agendamento online rejeitado' },
  })
  revalidatePath('/agenda')

  if (!consulta.solicitante_email) {
    return { success: true, id, emailEnviado: false, aviso: 'Pedido sem e-mail cadastrado.' }
  }

  const { data: config } = await admin
    .from('configuracoes')
    .select('consultorio_nome')
    .eq('id', 1)
    .maybeSingle()

  const email = await enviarEmailRecusaAgendamento({
    para: consulta.solicitante_email,
    nome: consulta.solicitante_nome ?? 'paciente',
    data: consulta.data,
    hora: consulta.hora_inicio,
    protocolo: consulta.protocolo,
    nomeClinica: config?.consultorio_nome || 'Pronto',
  })

  return email.enviado
    ? { success: true, id, emailEnviado: true }
    : { success: true, id, emailEnviado: false, aviso: email.motivo }
}
