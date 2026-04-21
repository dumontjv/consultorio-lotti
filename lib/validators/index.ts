import { z } from 'zod'
import { validarCPF, limparCPF } from './cpf'
import { validarCEP } from './cep'
import { validarTelefone } from './telefone'

// Re-exporta funções individuais
export { validarCPF, limparCPF } from './cpf'
export { buscarCEP, validarCEP, type EnderecoViaCEP } from './cep'
export { validarTelefone, formatarTelefone } from './telefone'

// ---------------------------------------------------------------------------
// Schemas Zod reutilizáveis
// ---------------------------------------------------------------------------

/** CPF no formato 000.000.000-00 ou apenas dígitos, com validação de dígitos verificadores */
export const cpfSchema = z
  .string()
  .min(1, 'CPF é obrigatório')
  .refine((val) => validarCPF(val), { message: 'CPF inválido' })

/** Telefone brasileiro com ou sem formatação */
export const telefoneSchema = z
  .string()
  .min(1, 'Telefone é obrigatório')
  .refine((val) => validarTelefone(val), {
    message: 'Telefone inválido. Use o formato (XX) XXXXX-XXXX',
  })

/** CEP com ou sem máscara */
export const cepSchema = z
  .string()
  .min(1, 'CEP é obrigatório')
  .refine((val) => validarCEP(val), { message: 'CEP inválido. Use o formato 00000-000' })

/** E-mail padrão */
export const emailSchema = z
  .string()
  .min(1, 'E-mail é obrigatório')
  .email('E-mail inválido')

/**
 * Data no formato DD/MM/AAAA.
 * Valida estrutura e se a data existe no calendário.
 */
export const dataSchema = z
  .string()
  .min(1, 'Data é obrigatória')
  .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Data inválida. Use o formato DD/MM/AAAA')
  .refine(
    (val) => {
      const [day, month, year] = val.split('/').map(Number)
      const date = new Date(year, month - 1, day)
      return (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
      )
    },
    { message: 'Data inválida' }
  )

/**
 * CRM — Conselho Regional de Medicina.
 * Formato: número de 4–6 dígitos + UF (ex: 123456-SP ou 12345SP)
 */
export const crmSchema = z
  .string()
  .min(1, 'CRM é obrigatório')
  .regex(
    /^\d{4,6}[-\/]?[A-Z]{2}$/i,
    'CRM inválido. Use o formato 123456-SP'
  )
  .transform((val) => val.toUpperCase())

/**
 * CRP — Conselho Regional de Psicologia.
 * Formato: XX/XXXXXX onde XX é a região (01–23) e XXXXXX é o número (ex: 06/123456)
 */
export const crpSchema = z
  .string()
  .min(1, 'CRP é obrigatório')
  .regex(
    /^(0[1-9]|1\d|2[0-3])\/\d{1,6}$/,
    'CRP inválido. Use o formato XX/XXXXXX (ex: 06/123456)'
  )

// ---------------------------------------------------------------------------
// Schemas compostos de uso comum
// ---------------------------------------------------------------------------

export const enderecoSchema = z.object({
  cep: cepSchema,
  logradouro: z.string().min(1, 'Logradouro é obrigatório'),
  numero: z.string().min(1, 'Número é obrigatório'),
  complemento: z.string().optional(),
  bairro: z.string().min(1, 'Bairro é obrigatório'),
  cidade: z.string().min(1, 'Cidade é obrigatória'),
  uf: z.string().length(2, 'UF deve ter 2 caracteres'),
})

export type EnderecoSchema = z.infer<typeof enderecoSchema>
