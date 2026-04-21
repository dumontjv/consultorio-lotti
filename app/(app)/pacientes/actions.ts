'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { validarCPF } from '@/lib/validators/cpf'

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
  convenio_nome: opt(),
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

  const { data: paciente, error } = await supabase
    .from('pacientes')
    .insert({
      ...data,
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

  const { error } = await supabase
    .from('pacientes')
    .update({ ...data, atualizado_por: user.id })
    .eq('id', id)
    .is('deleted_at', null)

  if (error) {
    if (error.code === '23505')
      return { success: false, error: 'CPF já cadastrado para outro paciente' }
    return { success: false, error: 'Erro ao atualizar paciente. Tente novamente.' }
  }

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

  const { error } = await supabase
    .from('pacientes')
    .update({ deleted_at: new Date().toISOString(), atualizado_por: user.id })
    .eq('id', id)
    .is('deleted_at', null)

  if (error) return { success: false, error: 'Erro ao remover paciente' }

  revalidatePath('/pacientes')
  redirect('/pacientes')
}
