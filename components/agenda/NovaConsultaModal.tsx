'use client'

import { useState, useTransition, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Loader2, Search, Pencil, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { criarConsulta, atualizarConsulta } from '@/app/(app)/agenda/actions'
import { conveniosAceitos, escolherConvenioInicial } from '@/lib/convenios/regras'
import { DURACAO_POR_ROLE, paraHora, paraMinutos, type RoleClinica } from '@/lib/agendamento/horarios'
import { useConvenios } from './ConveniosContext'
import type { ConsultaDetalhada, Profile } from '@/types/domain'

const formSchema = z.object({
  paciente_id: z.string().min(1, 'Selecione um paciente'),
  profissional_id: z.string().min(1, 'Selecione um profissional'),
  convenio_id: z.string().min(1, 'Selecione o convênio'),
  tipo: z.enum(['presencial', 'teleconsulta']),
  data: z.string().min(1, 'Data obrigatória'),
  hora_inicio: z.string().min(1, 'Horário de início obrigatório'),
  hora_fim: z.string().min(1, 'Horário de fim obrigatório'),
  valor_cobrado: z.string().optional(),
  numero_carteirinha: z.string().optional(),
  numero_guia: z.string().optional(),
  observacoes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface PacienteResumo {
  id: string
  nome_completo: string
  telefone_principal: string | null
  convenio_id: string | null
  convenio_codigo: string | null
}

interface NovaConsultaModalProps {
  profissionais: Pick<Profile, 'id' | 'nome_completo' | 'role'>[]
  consulta?: ConsultaDetalhada
  dataInicial?: string
  triggerVariant?: 'default' | 'icon'
}

function formatarValor(v: number) {
  return v.toFixed(2).replace('.', ',')
}

// Aceita "1.234,56", "300,00" e "300.50"
function lerValor(texto: string): number {
  const t = texto.trim()
  return parseFloat(t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t)
}

export function NovaConsultaModal({
  profissionais,
  consulta,
  dataInicial,
  triggerVariant = 'default',
}: NovaConsultaModalProps) {
  const router = useRouter()
  const convenios = useConvenios()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [submitting, setSubmitting] = useState(false)

  const [buscaPaciente, setBuscaPaciente] = useState('')
  const [pacientes, setPacientes] = useState<PacienteResumo[]>([])
  const [pacienteSelecionado, setPacienteSelecionado] = useState<PacienteResumo | null>(null)
  const [buscando, setBuscando] = useState(false)
  const [avisoConvenio, setAvisoConvenio] = useState<string | null>(null)

  const editing = !!consulta

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: consulta
      ? {
          paciente_id: consulta.paciente_id,
          profissional_id: consulta.profissional_id,
          convenio_id: consulta.convenio_id,
          tipo: consulta.tipo,
          data: consulta.data,
          hora_inicio: consulta.hora_inicio.slice(0, 5),
          hora_fim: consulta.hora_fim.slice(0, 5),
          valor_cobrado: consulta.valor_cobrado != null ? formatarValor(Number(consulta.valor_cobrado)) : '',
          numero_carteirinha: consulta.numero_carteirinha ?? '',
          numero_guia: consulta.numero_guia ?? '',
          observacoes: consulta.observacoes ?? '',
        }
      : {
          tipo: 'presencial' as const,
          data: dataInicial ?? '',
          hora_inicio: '08:00',
          hora_fim: '09:00',
          convenio_id: '',
        },
  })

  const tipoSelecionado = watch('tipo')
  const profissionalId = watch('profissional_id')
  const convenioId = watch('convenio_id')

  const aceitos = conveniosAceitos(convenios, profissionalId, consulta?.convenio_id)
  const convenioSelecionado = convenios.find((c) => c.id === convenioId) ?? null
  const ehConvenio = !!convenioSelecionado && !convenioSelecionado.particular

  // Busca pacientes pelo nome
  useEffect(() => {
    if (!open) return
    if (buscaPaciente.length < 2) {
      setPacientes([])
      return
    }

    const timeout = setTimeout(async () => {
      setBuscando(true)
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from('pacientes')
          .select('id, nome_completo, telefone_principal, convenio_id, convenio_codigo')
          .ilike('nome_completo', `%${buscaPaciente}%`)
          .is('deleted_at', null)
          .limit(8)

        setPacientes(data ?? [])
      } finally {
        setBuscando(false)
      }
    }, 300)

    return () => clearTimeout(timeout)
  }, [buscaPaciente, open])

  // Quando abre o modal em modo edição, carrega o paciente
  useEffect(() => {
    if (open && consulta) {
      setPacienteSelecionado({
        id: consulta.paciente_id,
        nome_completo: consulta.paciente.nome_completo,
        telefone_principal: consulta.paciente.telefone_principal,
        convenio_id: null,
        convenio_codigo: null,
      })
    }
    if (!open) {
      reset()
      setAvisoConvenio(null)
      if (!consulta) {
        setPacienteSelecionado(null)
        setBuscaPaciente('')
      }
    }
  }, [open, consulta, reset])

  async function sugerirValor(profId: string, convId: string, pacienteId: string | null) {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('valor_sugerido_consulta', {
      p_profissional_id: profId,
      p_convenio_id: convId,
      p_paciente_id: pacienteId,
      p_ignorar_consulta_id: consulta?.id ?? null,
    })
    // Ignora respostas atrasadas se o usuário já trocou profissional/convênio
    if (error || data == null) return
    if (getValues('profissional_id') !== profId || getValues('convenio_id') !== convId) return
    setValue('valor_cobrado', formatarValor(Number(data)))
  }

  function aplicarConvenio(profId: string, convId: string | null, paciente: PacienteResumo | null) {
    setValue('convenio_id', convId ?? '', { shouldValidate: !!convId })
    const conv = convenios.find((c) => c.id === convId)
    if (!conv || !convId) return

    if (conv.particular) {
      setValue('numero_carteirinha', '')
      setValue('numero_guia', '')
      void sugerirValor(profId, convId, paciente?.id ?? null)
    } else {
      setValue('valor_cobrado', '')
      setValue(
        'numero_carteirinha',
        paciente?.convenio_id === convId ? (paciente.convenio_codigo ?? '') : ''
      )
    }
  }

  function recalcularConvenio(profId: string, paciente: PacienteResumo | null) {
    if (!profId) return
    const convenioDoPaciente = paciente?.convenio_id
      ? (convenios.find((c) => c.id === paciente.convenio_id) ?? null)
      : null
    const { convenioId: inicial, aviso } = escolherConvenioInicial(
      conveniosAceitos(convenios, profId),
      convenioDoPaciente
    )
    setAvisoConvenio(aviso)
    aplicarConvenio(profId, inicial, paciente)
  }

  function ajustarFim(inicio: string, profId: string) {
    const role = profissionais.find((p) => p.id === profId)?.role as RoleClinica | undefined
    const duracao = role ? DURACAO_POR_ROLE[role] : undefined
    if (!duracao || !/^\d{2}:\d{2}/.test(inicio)) return
    const fim = paraMinutos(inicio) + duracao
    if (fim < 24 * 60) setValue('hora_fim', paraHora(fim))
  }

  function selecionarPaciente(p: PacienteResumo) {
    setPacienteSelecionado(p)
    setValue('paciente_id', p.id, { shouldValidate: true })
    setBuscaPaciente('')
    setPacientes([])
    recalcularConvenio(getValues('profissional_id'), p)
  }

  async function onSubmit(values: FormValues) {
    const valor = !ehConvenio && values.valor_cobrado ? lerValor(values.valor_cobrado) : null
    if (valor !== null && Number.isNaN(valor)) {
      toast.error('Valor inválido. Use o formato 300,00.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        ...values,
        valor_cobrado: valor,
        numero_carteirinha: ehConvenio ? values.numero_carteirinha : null,
        numero_guia: ehConvenio ? values.numero_guia : null,
      }

      const result = editing
        ? await atualizarConsulta(consulta!.id, payload)
        : await criarConsulta(payload)

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success(editing ? 'Consulta atualizada!' : 'Consulta agendada!')
      setOpen(false)
      startTransition(() => {
        router.refresh()
      })
    } finally {
      setSubmitting(false)
    }
  }

  const isLoading = submitting || isPending

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {triggerVariant === 'icon' ? (
        <DialogTrigger
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'h-7 w-7 p-0 text-slate-500 hover:text-slate-700 hover:bg-slate-100'
          )}
          title="Editar consulta"
        >
          <Pencil className="h-3.5 w-3.5" />
        </DialogTrigger>
      ) : (
        <DialogTrigger className={cn(buttonVariants())}>
          <Plus className="h-4 w-4 mr-1.5" />
          {editing ? 'Editar consulta' : 'Nova consulta'}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar consulta' : 'Agendar consulta'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Paciente */}
          <div className="space-y-1">
            <Label>
              Paciente <span className="text-destructive">*</span>
            </Label>
            {pacienteSelecionado ? (
              <div className="flex items-center justify-between rounded-lg border border-input bg-muted/30 px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{pacienteSelecionado.nome_completo}</p>
                  {pacienteSelecionado.telefone_principal && (
                    <p className="text-xs text-muted-foreground">
                      {pacienteSelecionado.telefone_principal}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => {
                    setPacienteSelecionado(null)
                    setValue('paciente_id', '')
                    setBuscaPaciente('')
                  }}
                >
                  Trocar
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Digite o nome do paciente..."
                    value={buscaPaciente}
                    onChange={(e) => setBuscaPaciente(e.target.value)}
                    className="pl-8"
                  />
                </div>
                {buscando && (
                  <p className="text-xs text-muted-foreground px-1">Buscando...</p>
                )}
                {pacientes.length > 0 && (
                  <div className="border border-input rounded-lg overflow-hidden shadow-sm">
                    {pacientes.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors border-b border-input last:border-0"
                        onClick={() => selecionarPaciente(p)}
                      >
                        <p className="font-medium">{p.nome_completo}</p>
                        {p.telefone_principal && (
                          <p className="text-xs text-muted-foreground">{p.telefone_principal}</p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {buscaPaciente.length >= 2 && pacientes.length === 0 && !buscando && (
                  <p className="text-xs text-muted-foreground px-1">Nenhum paciente encontrado</p>
                )}
              </div>
            )}
            {errors.paciente_id && (
              <p className="text-xs text-destructive">{errors.paciente_id.message}</p>
            )}
          </div>

          {/* Profissional */}
          <div className="space-y-1">
            <Label>
              Profissional <span className="text-destructive">*</span>
            </Label>
            <Controller
              control={control}
              name="profissional_id"
              render={({ field }) => (
                <Select
                  value={field.value ?? ''}
                  onValueChange={(v) => {
                    const id = String(v ?? '')
                    field.onChange(id)
                    recalcularConvenio(id, pacienteSelecionado)
                    ajustarFim(getValues('hora_inicio'), id)
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o profissional">
                      {(v: string) => profissionais.find((p) => p.id === v)?.nome_completo ?? 'Selecione o profissional'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {profissionais.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome_completo}{' '}
                        <span className="text-muted-foreground text-xs ml-1">
                          ({p.role === 'medica' ? 'Médica' : 'Psicóloga'})
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.profissional_id && (
              <p className="text-xs text-destructive">{errors.profissional_id.message}</p>
            )}
          </div>

          {/* Convênio */}
          <div className="space-y-1">
            <Label>
              Convênio <span className="text-destructive">*</span>
            </Label>
            <Controller
              control={control}
              name="convenio_id"
              render={({ field }) => (
                <Select
                  value={field.value ?? ''}
                  disabled={!profissionalId || aceitos.length === 0}
                  onValueChange={(v) => {
                    setAvisoConvenio(null)
                    aplicarConvenio(getValues('profissional_id'), String(v ?? ''), pacienteSelecionado)
                  }}
                >
                  <SelectTrigger className="w-full" aria-invalid={!!errors.convenio_id}>
                    <SelectValue placeholder={profissionalId ? 'Selecione o convênio' : 'Escolha a profissional primeiro'}>
                      {(v: string) =>
                        convenios.find((c) => c.id === v)?.nome ??
                        (profissionalId ? 'Selecione o convênio' : 'Escolha a profissional primeiro')
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {aceitos.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome}
                        {!c.ativo && <span className="text-muted-foreground text-xs ml-1">(desativado)</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {profissionalId && aceitos.length === 0 && (
              <p className="text-xs text-destructive">
                Esta profissional não tem convênios cadastrados (Configurações › Convênios).
              </p>
            )}
            {avisoConvenio && (
              <p className="flex items-start gap-1.5 text-xs text-amber-700" role="status">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-px" />
                {avisoConvenio}
              </p>
            )}
            {errors.convenio_id && (
              <p className="text-xs text-destructive">{errors.convenio_id.message}</p>
            )}
          </div>

          {/* Tipo */}
          <div className="space-y-1">
            <Label>Tipo de consulta</Label>
            <Controller
              control={control}
              name="tipo"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="presencial">Presencial</SelectItem>
                    <SelectItem value="teleconsulta">Teleconsulta</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Data e Horários */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="data">
                Data <span className="text-destructive">*</span>
              </Label>
              <Input id="data" type="date" aria-invalid={!!errors.data} {...register('data')} />
              {errors.data && <p className="text-xs text-destructive">{errors.data.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="hora_inicio">
                Início <span className="text-destructive">*</span>
              </Label>
              <Input
                id="hora_inicio"
                type="time"
                {...register('hora_inicio', {
                  onChange: (e) => ajustarFim(e.target.value, getValues('profissional_id')),
                })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="hora_fim">
                Fim <span className="text-destructive">*</span>
              </Label>
              <Input id="hora_fim" type="time" {...register('hora_fim')} />
            </div>
          </div>

          {/* Valor (Particular) ou dados do convênio */}
          {ehConvenio ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="numero_carteirinha">Nº da carteirinha</Label>
                <Input id="numero_carteirinha" maxLength={60} {...register('numero_carteirinha')} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="numero_guia">Nº da guia/autorização</Label>
                <Input
                  id="numero_guia"
                  maxLength={60}
                  placeholder="Opcional"
                  {...register('numero_guia')}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <Label htmlFor="valor_cobrado">Valor (R$)</Label>
              <Input
                id="valor_cobrado"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                {...register('valor_cobrado')}
              />
            </div>
          )}

          {/* Link teleconsulta */}
          {tipoSelecionado === 'teleconsulta' && (
            <div className="space-y-1">
              <Label htmlFor="link_teleconsulta">Link da teleconsulta</Label>
              <Input
                id="link_teleconsulta"
                type="url"
                placeholder="https://meet.jit.si/..."
                {...register('observacoes')}
              />
            </div>
          )}

          {/* Observações */}
          <div className="space-y-1">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Informações adicionais..."
              rows={2}
              {...register('observacoes')}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {editing ? 'Salvando...' : 'Agendando...'}
                </>
              ) : editing ? (
                'Salvar alterações'
              ) : (
                'Agendar consulta'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
