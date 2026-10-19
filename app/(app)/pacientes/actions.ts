'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { validarCPF } from '@/lib/validators/cpf'
import { registrarAuditoria } from '@/lib/audit/log'

const opt = () =>
  z
    .string()
    .optional()
    .transform((v) => v?.trim() || undefined)

const pacienteSchema = z.object({
  nome_completo: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cpf: opt(),
  rg: opt(),
  data_nascimento: opt(),
  genero: z.enum(['feminino', 'masculino', 'outro', 'nao_informado']).default('nao_informado'),
  estado_civil: opt(),
  profissao: opt(),
  naturalidade: opt(),
  nacionalidade: z.string().default('Brasileira'),
  telefone_principal: opt(),
  telefone_secundario: opt(),
  email: z
    .string()
    .optional()
    .transform((v) => v?.trim() || undefined)
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), { message: 'E-mail inválido' }),
  endereco_logradouro: opt(),
  endereco_numero: opt(),
  endereco_complemento: opt(),
  endereco_bairro: opt(),
  endereco_cidade: opt(),
  endereco_uf: z
    .string()
    .optional()
    .transform((v) => v?.trim() || undefined)
    .refine((v) => !v || v.length === 2, { message: 'UF deve ter 2 letras' }),
  endereco_cep: opt(),
  convenio_id: z
    .string()
    .optional()
    .nullable()
    .transform((v) => v || null)
    .refine((v) => v === null || z.string().uuid().safeParse(v).success, 'Convênio inválido'),
  convenio_codigo: opt(),
  convenio_validade: opt(),
  atendido_por_medica: z.boolean().default(false),
  atendido_por_psicologa: z.boolean().default(false),
  grupo_sanguineo: opt(),
  observacoes_gerais: opt(),
  consentimento_lgpd_aceito: z.boolean().refine((v) => v === true, {
    message: 'O consentimento LGPD é obrigatório para cadastrar o paciente',
  }),
})

export type PacienteFormValues = z.input<typeof pacienteSchema>
export type ActionResult = { success: true; id: string } | { success: false; error: string }

/** O nome em texto (convenio_nome) acompanha o convenio_id para as telas antigas. */
async function nomeDoConvenio(
  supabase: Awaited<ReturnType<typeof createClient>>,
  convenioId: string | null
): Promise<{ ok: true; nome: string | null } | { ok: false; error: string }> {
  if (!convenioId) return { ok: true, nome: null }
  const { data } = await supabase.from('convenios').select('nome').eq('id', convenioId).maybeSingle()
  if (!data) return { ok: false, error: 'Convênio não encontrado.' }
  return { ok: true, nome: data.nome }
}

export async function criarPaciente(values: unknown): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const parsed = pacienteSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }

  const data = parsed.data

  if (data.cpf) {
    const digits = data.cpf.replace(/\D/g, '')
    if (!validarCPF(digits)) return { success: false, error: 'CPF inválido' }
    data.cpf = digits
  }
  if (data.endereco_cep) data.endereco_cep = data.endereco_cep.replace(/\D/g, '')

  const convenio = await nomeDoConvenio(supabase, data.convenio_id)
  if (!convenio.ok) return { success: false, error: convenio.error }

  const { data: paciente, error } = await supabase
    .from('pacientes')
    .insert({
      ...data,
      convenio_nome: convenio.nome,
      criado_por: user.id,
      atualizado_por: user.id,
      consentimento_lgpd_data: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') return { success: false, error: 'CPF já cadastrado no sistema' }
    return { success: false, error: 'Erro ao salvar paciente. Tente novamente.' }
  }

  await registrarAuditoria({ acao: 'create', entidade: 'pacientes', entidadeId: paciente.id })
  revalidatePath('/pacientes')
  return { success: true, id: paciente.id }
}

export async function atualizarPaciente(id: string, values: unknown): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const parsed = pacienteSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }

  const data = parsed.data

  if (data.cpf) {
    const digits = data.cpf.replace(/\D/g, '')
    if (!validarCPF(digits)) return { success: false, error: 'CPF inválido' }
    data.cpf = digits
  }
  if (data.endereco_cep) data.endereco_cep = data.endereco_cep.replace(/\D/g, '')

  const convenio = await nomeDoConvenio(supabase, data.convenio_id)
  if (!convenio.ok) return { success: false, error: convenio.error }

  const { error } = await supabase
    .from('pacientes')
    .update({ ...data, convenio_nome: convenio.nome, atualizado_por: user.id })
    .eq('id', id)
    .is('deleted_at', null)

  if (error) {
    if (error.code === '23505')
      return { success: false, error: 'CPF já cadastrado para outro paciente' }
    return { success: false, error: 'Erro ao atualizar paciente. Tente novamente.' }
  }

  await registrarAuditoria({ acao: 'update', entidade: 'pacientes', entidadeId: id })
  revalidatePath('/pacientes')
  revalidatePath(`/pacientes/${id}`)
  return { success: true, id }
}

export async function deletarPaciente(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') return { success: false, error: 'Sem permissão' }

  const { error } = await supabase
    .from('pacientes')
    .update({ deleted_at: new Date().toISOString(), atualizado_por: user.id })
    .eq('id', id)
    .is('deleted_at', null)

  if (error) return { success: false, error: 'Erro ao remover paciente' }

  await registrarAuditoria({ acao: 'delete', entidade: 'pacientes', entidadeId: id })
  revalidatePath('/pacientes')
  redirect('/pacientes')
}
