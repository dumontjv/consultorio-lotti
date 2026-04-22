'use client'

import { useState, useTransition } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Loader2, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

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
import { criarLancamento } from '@/app/(app)/financeiro/actions'

const formSchema = z.object({
  paciente_id: z.string().min(1, 'Selecione um paciente'),
  profissional_id: z.string().min(1, 'Selecione um profissional'),
  tipo: z.enum(['consulta', 'pacote', 'outro']),
  descricao: z.string().min(1, 'Descrição obrigatória'),
  valor: z.string().min(1, 'Valor obrigatório'),
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
  data_pagamento: z.string().optional(),
  observacoes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface PacienteResumo {
  id: string
  nome_completo: string
}

interface NovoLancamentoModalProps {
  profissionais: { id: string; nome_completo: string; role: string }[]
}

export function NovoLancamentoModal({ profissionais }: NovoLancamentoModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [submitting, setSubmitting] = useState(false)

  const [buscaPaciente, setBuscaPaciente] = useState('')
  const [pacientes, setPacientes] = useState<PacienteResumo[]>([])
  const [pacienteSelecionado, setPacienteSelecionado] = useState<PacienteResumo | null>(null)
  const [buscando, setBuscando] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipo: 'consulta',
      forma_pagamento: 'pix',
      status: 'pendente',
      data_vencimento: today,
    },
  })

  const statusSelecionado = watch('status')

  useEffect(() => {
    if (!open) {
      reset()
      setPacienteSelecionado(null)
      setBuscaPaciente('')
      setPacientes([])
      return
    }
    if (open) {
      setValue('paciente_id', '')
    }
  }, [open, reset, setValue])

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
          .select('id, nome_completo')
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

  useEffect(() => {
    setValue('paciente_id', pacienteSelecionado?.id ?? '')
  }, [pacienteSelecionado, setValue])

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    try {
      const result = await criarLancamento({
        ...values,
        valor: parseFloat(values.valor.replace(',', '.')),
        data_pagamento: values.status === 'pago' ? (values.data_pagamento || today) : null,
      })

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success('Lançamento registrado!')
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
        Novo lançamento
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar lançamento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Paciente */}
          <div className="space-y-1">
            <Label>
              Paciente <span className="text-destructive">*</span>
            </Label>
            {pacienteSelecionado ? (
              <div className="flex items-center justify-between rounded-lg border border-input bg-muted/30 px-3 py-2">
                <p className="text-sm font-medium">{pacienteSelecionado.nome_completo}</p>
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
                {buscando && <p className="text-xs text-muted-foreground px-1">Buscando...</p>}
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
                        {p.nome_completo}
                      </button>
                    ))}
                  </div>
                )}
                {buscaPaciente.length >= 2 && pacientes.length === 0 && !buscando && (
                  <p className="text-xs text-muted-foreground px-1">Nenhum paciente encontrado</p>
                )}
              </div>
            )}
            <input type="hidden" {...register('paciente_id')} />
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
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {profissionais.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome_completo}
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

          {/* Tipo e Descrição */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Tipo</Label>
              <Controller
                control={control}
                name="tipo"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consulta">Consulta</SelectItem>
                      <SelectItem value="pacote">Pacote</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="valor">
                Valor (R$) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="valor"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                aria-invalid={!!errors.valor}
                {...register('valor')}
              />
              {errors.valor && (
                <p className="text-xs text-destructive">{errors.valor.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="descricao">
              Descrição <span className="text-destructive">*</span>
            </Label>
            <Input
              id="descricao"
              placeholder="Ex: Consulta clínica — Dr. Lotti"
              aria-invalid={!!errors.descricao}
              {...register('descricao')}
            />
            {errors.descricao && (
              <p className="text-xs text-destructive">{errors.descricao.message}</p>
            )}
          </div>

          {/* Forma de pagamento e Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Forma de pagamento</Label>
              <Controller
                control={control}
                name="forma_pagamento"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">Pix</SelectItem>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="credito">Cartão Crédito</SelectItem>
                      <SelectItem value="debito">Cartão Débito</SelectItem>
                      <SelectItem value="transferencia">Transferência</SelectItem>
                      <SelectItem value="convenio">Convênio</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="pago">Pago</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                      <SelectItem value="estornado">Estornado</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="data_vencimento">
                Data de vencimento <span className="text-destructive">*</span>
              </Label>
              <Input
                id="data_vencimento"
                type="date"
                aria-invalid={!!errors.data_vencimento}
                {...register('data_vencimento')}
              />
            </div>
            {statusSelecionado === 'pago' && (
              <div className="space-y-1">
                <Label htmlFor="data_pagamento">Data de pagamento</Label>
                <Input id="data_pagamento" type="date" {...register('data_pagamento')} />
              </div>
            )}
          </div>

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
                  Registrando...
                </>
              ) : (
                'Registrar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
