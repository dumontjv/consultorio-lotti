'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { IMaskInput } from 'react-imask'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import type { Paciente } from '@/types/domain'
import { criarPaciente, atualizarPaciente } from '@/app/(app)/pacientes/actions'

// Schema de validação (espelho do actions.ts, mas sem .default() para compatibilidade com zodResolver)
const formSchema = z.object({
  nome_completo: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  data_nascimento: z.string().optional(),
  genero: z.enum(['feminino', 'masculino', 'outro', 'nao_informado']),
  estado_civil: z.string().optional(),
  profissao: z.string().optional(),
  naturalidade: z.string().optional(),
  nacionalidade: z.string(),
  telefone_principal: z.string().optional(),
  telefone_secundario: z.string().optional(),
  email: z.string().optional(),
  endereco_logradouro: z.string().optional(),
  endereco_numero: z.string().optional(),
  endereco_complemento: z.string().optional(),
  endereco_bairro: z.string().optional(),
  endereco_cidade: z.string().optional(),
  endereco_uf: z.string().optional(),
  endereco_cep: z.string().optional(),
  convenio_id: z.string().optional(),
  convenio_codigo: z.string().optional(),
  convenio_validade: z.string().optional(),
  atendido_por_medica: z.boolean(),
  atendido_por_psicologa: z.boolean(),
  grupo_sanguineo: z.string().optional(),
  observacoes_gerais: z.string().optional(),
  consentimento_lgpd_aceito: z.boolean(),
})

type FormValues = z.infer<typeof formSchema>

interface PacienteFormProps {
  paciente?: Paciente
  modo: 'criar' | 'editar'
  convenios: { id: string; nome: string; ativo: boolean }[]
}

const inputClass =
  'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm'

export function PacienteForm({ paciente, modo, convenios }: PacienteFormProps) {
  const opcoesConvenio = convenios.filter((c) => c.ativo || c.id === paciente?.convenio_id)
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: paciente
      ? {
          nome_completo: paciente.nome_completo,
          cpf: paciente.cpf
            ? paciente.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
            : '',
          rg: paciente.rg ?? '',
          data_nascimento: paciente.data_nascimento ?? '',
          genero: paciente.genero,
          estado_civil: paciente.estado_civil ?? '',
          profissao: paciente.profissao ?? '',
          naturalidade: paciente.naturalidade ?? '',
          nacionalidade: paciente.nacionalidade,
          telefone_principal: paciente.telefone_principal ?? '',
          telefone_secundario: paciente.telefone_secundario ?? '',
          email: paciente.email ?? '',
          endereco_logradouro: paciente.endereco_logradouro ?? '',
          endereco_numero: paciente.endereco_numero ?? '',
          endereco_complemento: paciente.endereco_complemento ?? '',
          endereco_bairro: paciente.endereco_bairro ?? '',
          endereco_cidade: paciente.endereco_cidade ?? '',
          endereco_uf: paciente.endereco_uf ?? '',
          endereco_cep: paciente.endereco_cep
            ? paciente.endereco_cep.replace(/(\d{5})(\d{3})/, '$1-$2')
            : '',
          convenio_id: paciente.convenio_id ?? '',
          convenio_codigo: paciente.convenio_codigo ?? '',
          convenio_validade: paciente.convenio_validade ?? '',
          atendido_por_medica: paciente.atendido_por_medica,
          atendido_por_psicologa: paciente.atendido_por_psicologa,
          grupo_sanguineo: paciente.grupo_sanguineo ?? '',
          observacoes_gerais: paciente.observacoes_gerais ?? '',
          consentimento_lgpd_aceito: paciente.consentimento_lgpd_aceito,
        }
      : {
          genero: 'nao_informado',
          nacionalidade: 'Brasileira',
          atendido_por_medica: false,
          atendido_por_psicologa: false,
          consentimento_lgpd_aceito: false,
        },
  })

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    try {
      const result =
        modo === 'criar'
          ? await criarPaciente(values)
          : await atualizarPaciente(paciente!.id, values)

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success(modo === 'criar' ? 'Paciente cadastrado!' : 'Dados atualizados!')
      startTransition(() => {
        router.push(`/pacientes/${result.id}`)
        router.refresh()
      })
    } finally {
      setSubmitting(false)
    }
  }

  const isLoading = submitting || isPending

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-3xl">
      {/* ─── Dados Pessoais ─── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-700">Dados Pessoais</h2>
          <Separator className="mt-2" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Nome */}
          <div className="sm:col-span-2 space-y-1">
            <Label htmlFor="nome_completo">
              Nome completo <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nome_completo"
              placeholder="Nome completo do paciente"
              aria-invalid={!!errors.nome_completo}
              {...register('nome_completo')}
            />
            {errors.nome_completo && (
              <p className="text-xs text-destructive">{errors.nome_completo.message}</p>
            )}
          </div>

          {/* CPF */}
          <div className="space-y-1">
            <Label htmlFor="cpf">CPF</Label>
            <Controller
              control={control}
              name="cpf"
              render={({ field }) => (
                <IMaskInput
                  id="cpf"
                  mask="000.000.000-00"
                  value={field.value ?? ''}
                  onAccept={(value) => field.onChange(value)}
                  placeholder="000.000.000-00"
                  className={cn(inputClass, errors.cpf && 'border-destructive')}
                />
              )}
            />
            {errors.cpf && <p className="text-xs text-destructive">{errors.cpf.message}</p>}
          </div>

          {/* RG */}
          <div className="space-y-1">
            <Label htmlFor="rg">RG</Label>
            <Input id="rg" placeholder="Ex: 12.345.678-9" {...register('rg')} />
          </div>

          {/* Data de nascimento */}
          <div className="space-y-1">
            <Label htmlFor="data_nascimento">Data de nascimento</Label>
            <Input id="data_nascimento" type="date" {...register('data_nascimento')} />
          </div>

          {/* Gênero */}
          <div className="space-y-1">
            <Label>Gênero</Label>
            <Controller
              control={control}
              name="genero"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                    <SelectItem value="nao_informado">Não informado</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Estado civil */}
          <div className="space-y-1">
            <Label htmlFor="estado_civil">Estado civil</Label>
            <Controller
              control={control}
              name="estado_civil"
              render={({ field }) => (
                <Select value={field.value ?? ''} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                    <SelectItem value="casado">Casado(a)</SelectItem>
                    <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                    <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                    <SelectItem value="uniao_estavel">União estável</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Profissão */}
          <div className="space-y-1">
            <Label htmlFor="profissao">Profissão</Label>
            <Input id="profissao" placeholder="Ex: Professor" {...register('profissao')} />
          </div>

          {/* Naturalidade */}
          <div className="space-y-1">
            <Label htmlFor="naturalidade">Naturalidade</Label>
            <Input id="naturalidade" placeholder="Ex: Rio de Janeiro - RJ" {...register('naturalidade')} />
          </div>

          {/* Nacionalidade */}
          <div className="space-y-1">
            <Label htmlFor="nacionalidade">Nacionalidade</Label>
            <Input id="nacionalidade" placeholder="Brasileira" {...register('nacionalidade')} />
          </div>
        </div>
      </section>

      {/* ─── Contato & Endereço ─── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-700">Contato & Endereço</h2>
          <Separator className="mt-2" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Telefone principal */}
          <div className="space-y-1">
            <Label htmlFor="telefone_principal">Telefone principal</Label>
            <Controller
              control={control}
              name="telefone_principal"
              render={({ field }) => (
                <IMaskInput
                  id="telefone_principal"
                  mask={[{ mask: '(00) 0000-0000' }, { mask: '(00) 00000-0000' }]}
                  value={field.value ?? ''}
                  onAccept={(value) => field.onChange(value)}
                  placeholder="(21) 99999-9999"
                  className={inputClass}
                />
              )}
            />
          </div>

          {/* Telefone secundário */}
          <div className="space-y-1">
            <Label htmlFor="telefone_secundario">Telefone secundário</Label>
            <Controller
              control={control}
              name="telefone_secundario"
              render={({ field }) => (
                <IMaskInput
                  mask={[{ mask: '(00) 0000-0000' }, { mask: '(00) 00000-0000' }]}
                  value={field.value ?? ''}
                  onAccept={(value) => field.onChange(value)}
                  placeholder="(21) 99999-9999"
                  className={inputClass}
                />
              )}
            />
          </div>

          {/* E-mail */}
          <div className="sm:col-span-2 space-y-1">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="paciente@email.com"
              aria-invalid={!!errors.email}
              {...register('email')}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          {/* CEP */}
          <div className="space-y-1">
            <Label htmlFor="endereco_cep">CEP</Label>
            <Controller
              control={control}
              name="endereco_cep"
              render={({ field }) => (
                <IMaskInput
                  id="endereco_cep"
                  mask="00000-000"
                  value={field.value ?? ''}
                  onAccept={(value) => field.onChange(value)}
                  placeholder="00000-000"
                  className={inputClass}
                />
              )}
            />
          </div>

          {/* Logradouro */}
          <div className="space-y-1">
            <Label htmlFor="endereco_logradouro">Logradouro</Label>
            <Input id="endereco_logradouro" placeholder="Rua, Av., Travessa..." {...register('endereco_logradouro')} />
          </div>

          {/* Número */}
          <div className="space-y-1">
            <Label htmlFor="endereco_numero">Número</Label>
            <Input id="endereco_numero" placeholder="123" {...register('endereco_numero')} />
          </div>

          {/* Complemento */}
          <div className="space-y-1">
            <Label htmlFor="endereco_complemento">Complemento</Label>
            <Input id="endereco_complemento" placeholder="Apto 201, Bloco B..." {...register('endereco_complemento')} />
          </div>

          {/* Bairro */}
          <div className="space-y-1">
            <Label htmlFor="endereco_bairro">Bairro</Label>
            <Input id="endereco_bairro" placeholder="Bairro" {...register('endereco_bairro')} />
          </div>

          {/* Cidade */}
          <div className="space-y-1">
            <Label htmlFor="endereco_cidade">Cidade</Label>
            <Input id="endereco_cidade" placeholder="Cidade" {...register('endereco_cidade')} />
          </div>

          {/* UF */}
          <div className="space-y-1">
            <Label htmlFor="endereco_uf">UF</Label>
            <Controller
              control={control}
              name="endereco_uf"
              render={({ field }) => (
                <Select value={field.value ?? ''} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {UFS.map((uf) => (
                      <SelectItem key={uf} value={uf}>
                        {uf}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
      </section>

      {/* ─── Convênio ─── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-700">Convênio & Atendimento</h2>
          <Separator className="mt-2" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Convênio */}
          <div className="space-y-1">
            <Label htmlFor="convenio_id">Convênio</Label>
            <Controller
              control={control}
              name="convenio_id"
              render={({ field }) => (
                <Select value={field.value ?? ''} onValueChange={(v) => field.onChange(String(v ?? ''))}>
                  <SelectTrigger id="convenio_id" className="w-full">
                    <SelectValue placeholder="Particular ou convênio">
                      {(v: string) => convenios.find((c) => c.id === v)?.nome ?? 'Particular ou convênio'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {opcoesConvenio.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {paciente?.convenio_nome && !paciente.convenio_id && (
              <p className="text-xs text-amber-700">
                Convênio anterior: {paciente.convenio_nome}. Selecione o correspondente da lista.
              </p>
            )}
          </div>

          {/* Código do convênio */}
          <div className="space-y-1">
            <Label htmlFor="convenio_codigo">Nº carteirinha</Label>
            <Input id="convenio_codigo" placeholder="Número da carteirinha" {...register('convenio_codigo')} />
          </div>

          {/* Validade do convênio */}
          <div className="space-y-1">
            <Label htmlFor="convenio_validade">Validade do convênio</Label>
            <Input id="convenio_validade" type="date" {...register('convenio_validade')} />
          </div>
        </div>

        {/* Profissionais que atendem */}
        <div className="space-y-3">
          <p className="text-sm text-slate-600">Profissional(is) que atende(m) este paciente:</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Controller
              control={control}
              name="atendido_por_medica"
              render={({ field }) => (
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <span className="text-sm">Dra. Luciane Lotti Fonseca (Médica)</span>
                </label>
              )}
            />
            <Controller
              control={control}
              name="atendido_por_psicologa"
              render={({ field }) => (
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <span className="text-sm">Leiliane Fonseca Santos Dumont (Psicóloga)</span>
                </label>
              )}
            />
          </div>
        </div>
      </section>

      {/* ─── Dados Clínicos ─── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-700">Dados Clínicos Gerais</h2>
          <Separator className="mt-2" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Grupo sanguíneo */}
          <div className="space-y-1">
            <Label>Grupo sanguíneo</Label>
            <Controller
              control={control}
              name="grupo_sanguineo"
              render={({ field }) => (
                <Select value={field.value ?? ''} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−'].map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Observações gerais */}
          <div className="sm:col-span-2 space-y-1">
            <Label htmlFor="observacoes_gerais">Observações gerais</Label>
            <Textarea
              id="observacoes_gerais"
              placeholder="Informações adicionais relevantes..."
              rows={3}
              {...register('observacoes_gerais')}
            />
          </div>
        </div>
      </section>

      {/* ─── LGPD ─── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-700">Consentimento LGPD</h2>
          <Separator className="mt-2" />
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
          <p className="text-sm text-amber-900">
            De acordo com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018), o paciente
            deve consentir com o tratamento de seus dados pessoais e de saúde para fins de
            atendimento clínico.
          </p>
          <Controller
            control={control}
            name="consentimento_lgpd_aceito"
            render={({ field }) => (
              <label className="flex items-start gap-2 cursor-pointer">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  aria-invalid={!!errors.consentimento_lgpd_aceito}
                  className="mt-0.5"
                />
                <span className="text-sm text-amber-900 font-medium">
                  O paciente consente com o armazenamento e tratamento de seus dados de saúde para
                  fins de atendimento médico/psicológico neste consultório. <span className="text-destructive">*</span>
                </span>
              </label>
            )}
          />
          {errors.consentimento_lgpd_aceito && (
            <p className="text-xs text-destructive">{errors.consentimento_lgpd_aceito.message}</p>
          )}
        </div>
      </section>

      {/* ─── Ações ─── */}
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {modo === 'criar' ? 'Cadastrando...' : 'Salvando...'}
            </>
          ) : modo === 'criar' ? (
            'Cadastrar paciente'
          ) : (
            'Salvar alterações'
          )}
        </Button>
      </div>
    </form>
  )
}

const UFS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA',
  'MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN',
  'RS','RO','RR','SC','SP','SE','TO',
]
