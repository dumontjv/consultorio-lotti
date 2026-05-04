'use client'

import { useState, useTransition, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { atualizarLancamento } from '@/app/(app)/financeiro/actions'

const formSchema = z
  .object({
  paciente_id: z.string().optional().nullable(),
  profissional_id: z.string().min(1, 'Selecione um profissional'),
  tipo: z.enum(['consulta', 'pacote', 'outro', 'despesa']),
  descricao: z.string().min(1, 'Descrição obrigatória'),
  valor: z.string().min(1, 'Valor obrigatório'),
  forma_pagamento: z.enum([
    'dinheiro', 'credito', 'debito', 'pix', 'transferencia', 'convenio', 'boleto',
  ]),
  status: z.enum(['pendente', 'pago', 'cancelado', 'estornado']),
  data_vencimento: z.string().min(1, 'Data de vencimento obrigatória'),
  data_pagamento: z.string().optional(),
  observacoes: z.string().optional(),
})
.superRefine((data, ctx) => {
  if (data.tipo !== 'despesa' && !data.paciente_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Selecione um paciente',
      path: ['paciente_id'],
    })
  }
})

type FormValues = z.infer<typeof formSchema>

export interface LancamentoParaEditar {
  id: string
  paciente_id: string | null
  paciente_nome: string | null
  profissional_id: string
  tipo: string
  descricao: string
  valor: number
  forma_pagamento: string | null
  status: string
  data_vencimento: string | null
  data_pagamento: string | null
  observacoes: string | null
}

interface EditarLancamentoModalProps {
  lancamento: LancamentoParaEditar
  profissionais: { id: string; nome_completo: string; role: string }[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditarLancamentoModal({
  lancamento,
  profissionais,
  open,
  onOpenChange,
}: EditarLancamentoModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paciente_id: lancamento.paciente_id,
      profissional_id: lancamento.profissional_id,
      tipo: lancamento.tipo as FormValues['tipo'],
      descricao: lancamento.descricao,
      valor: lancamento.valor.toFixed(2).replace('.', ','),
      forma_pagamento: (lancamento.forma_pagamento ?? 'pix') as FormValues['forma_pagamento'],
      status: lancamento.status as FormValues['status'],
      data_vencimento: lancamento.data_vencimento ?? '',
      data_pagamento: lancamento.data_pagamento ?? '',
      observacoes: lancamento.observacoes ?? '',
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        paciente_id: lancamento.paciente_id,
        profissional_id: lancamento.profissional_id,
        tipo: lancamento.tipo as FormValues['tipo'],
        descricao: lancamento.descricao,
        valor: lancamento.valor.toFixed(2).replace('.', ','),
        forma_pagamento: (lancamento.forma_pagamento ?? 'pix') as FormValues['forma_pagamento'],
        status: lancamento.status as FormValues['status'],
        data_vencimento: lancamento.data_vencimento ?? '',
        data_pagamento: lancamento.data_pagamento ?? '',
        observacoes: lancamento.observacoes ?? '',
      })
    }
  }, [open, lancamento, reset])

  const statusSelecionado = watch('status')
  const tipoSelecionado = watch('tipo')
  const isDespesa = tipoSelecionado === 'despesa'
  const isLoading = submitting || isPending

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    try {
      const result = await atualizarLancamento(lancamento.id, {
        ...values,
        valor: parseFloat(values.valor.replace(',', '.')),
        data_pagamento: values.status === 'pago' ? (values.data_pagamento || new Date().toISOString().split('T')[0]) : null,
      })

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success('Lançamento atualizado!')
      onOpenChange(false)
      startTransition(() => { router.refresh() })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar lançamento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Paciente — somente leitura; oculto para despesas */}
          {!isDespesa && lancamento.paciente_nome && (
            <div className="space-y-1">
              <Label>Paciente</Label>
              <div className="rounded-lg border border-input bg-muted/30 px-3 py-2">
                <p className="text-sm font-medium">{lancamento.paciente_nome}</p>
              </div>
            </div>
          )}
          <input type="hidden" {...register('paciente_id')} />

          {/* Profissional */}
          <div className="space-y-1">
            <Label>Profissional <span className="text-destructive">*</span></Label>
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

          {/* Tipo e Valor */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Tipo</Label>
              <Controller
                control={control}
                name="tipo"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consulta">Consulta</SelectItem>
                      <SelectItem value="pacote">Pacote</SelectItem>
                      <SelectItem value="despesa">Despesa</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-valor">Valor (R$) <span className="text-destructive">*</span></Label>
              <Input
                id="edit-valor"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                aria-invalid={!!errors.valor}
                {...register('valor')}
              />
              {errors.valor && <p className="text-xs text-destructive">{errors.valor.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-descricao">Descrição <span className="text-destructive">*</span></Label>
            <Input
              id="edit-descricao"
              aria-invalid={!!errors.descricao}
              {...register('descricao')}
            />
            {errors.descricao && <p className="text-xs text-destructive">{errors.descricao.message}</p>}
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
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
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
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
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
              <Label htmlFor="edit-vencimento">Data de vencimento <span className="text-destructive">*</span></Label>
              <Input id="edit-vencimento" type="date" {...register('data_vencimento')} />
            </div>
            {statusSelecionado === 'pago' && (
              <div className="space-y-1">
                <Label htmlFor="edit-pagamento">Data de pagamento</Label>
                <Input id="edit-pagamento" type="date" {...register('data_pagamento')} />
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-obs">Observações</Label>
            <Textarea id="edit-obs" rows={2} {...register('observacoes')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
