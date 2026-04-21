'use client'

import { useState, useTransition, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Loader2, Search } from 'lucide-react'
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
import type { ConsultaDetalhada, Profile } from '@/types/domain'

const formSchema = z.object({
  paciente_id: z.string().min(1, 'Selecione um paciente'),
  profissional_id: z.string().min(1, 'Selecione um profissional'),
  tipo: z.enum(['presencial', 'teleconsulta']),
  data: z.string().min(1, 'Data obrigatória'),
  hora_inicio: z.string().min(1, 'Horário de início obrigatório'),
  hora_fim: z.string().min(1, 'Horário de fim obrigatório'),
  valor_cobrado: z.string().optional(),
  observacoes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface PacienteResumo {
  id: string
  nome_completo: string
  telefone_principal: string | null
}

interface NovaConsultaModalProps {
  profissionais: Pick<Profile, 'id' | 'nome_completo' | 'role'>[]
  consulta?: ConsultaDetalhada
  dataInicial?: string
}

export function NovaConsultaModal({
  profissionais,
  consulta,
  dataInicial,
}: NovaConsultaModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [submitting, setSubmitting] = useState(false)

  const [buscaPaciente, setBuscaPaciente] = useState('')
  const [pacientes, setPacientes] = useState<PacienteResumo[]>([])
  const [pacienteSelecionado, setPacienteSelecionado] = useState<PacienteResumo | null>(null)
  const [buscando, setBuscando] = useState(false)

  const editing = !!consulta

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: consulta
      ? {
          paciente_id: consulta.paciente_id,
          profissional_id: consulta.profissional_id,
          tipo: consulta.tipo,
          data: consulta.data,
          hora_inicio: consulta.hora_inicio,
          hora_fim: consulta.hora_fim,
          valor_cobrado: consulta.valor_cobrado?.toString() ?? '',
          observacoes: consulta.observacoes ?? '',
        }
      : {
          tipo: 'presencial' as const,
          data: dataInicial ?? '',
          hora_inicio: '08:00',
          hora_fim: '09:00',
        },
  })

  const tipoSelecionado = watch('tipo')

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
          .select('id, nome_completo, telefone_principal')
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
      })
    }
    if (!open) {
      reset()
      if (!consulta) {
        setPacienteSelecionado(null)
        setBuscaPaciente('')
      }
    }
  }, [open, consulta, reset])

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    try {
      const payload = {
        ...values,
        valor_cobrado: values.valor_cobrado ? parseFloat(values.valor_cobrado.replace(',', '.')) : null,
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
      <DialogTrigger className={cn(buttonVariants())}>
        <Plus className="h-4 w-4 mr-1.5" />
        {editing ? 'Editar consulta' : 'Nova consulta'}
      </DialogTrigger>
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
                        onClick={() => {
                          setPacienteSelecionado(p)
                          setBuscaPaciente('')
                          setPacientes([])
                        }}
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
            <Controller
              control={control}
              name="paciente_id"
              render={({ field }) => (
                <input
                  type="hidden"
                  value={pacienteSelecionado?.id ?? ''}
                  onChange={field.onChange}
                  ref={field.ref}
                />
              )}
            />
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
                <Select value={field.value ?? ''} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o profissional" />
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
              <Input id="hora_inicio" type="time" {...register('hora_inicio')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="hora_fim">
                Fim <span className="text-destructive">*</span>
              </Label>
              <Input id="hora_fim" type="time" {...register('hora_fim')} />
            </div>
          </div>

          {/* Valor */}
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
