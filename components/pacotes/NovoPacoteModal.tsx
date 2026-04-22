'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { criarPacote } from '@/app/(app)/pacientes/[id]/pacotes/actions'

const formSchema = z.object({
  sessoes_total: z.string().min(1, 'Quantidade de sessões obrigatória'),
  valor_total: z.string().min(1, 'Valor obrigatório'),
  desconto_percentual: z.string(),
  data_inicio: z.string().min(1, 'Data de início obrigatória'),
  data_fim: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface NovoPacoteModalProps {
  pacienteId: string
}

export function NovoPacoteModal({ pacienteId }: NovoPacoteModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [submitting, setSubmitting] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sessoes_total: '4',
      valor_total: '',
      desconto_percentual: '10',
      data_inicio: today,
      data_fim: '',
    },
  })

  function onOpenChange(v: boolean) {
    setOpen(v)
    if (!v) reset()
  }

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    try {
      const result = await criarPacote({
        paciente_id: pacienteId,
        sessoes_total: parseInt(values.sessoes_total),
        valor_total: parseFloat(values.valor_total.replace(',', '.')),
        desconto_percentual: parseFloat(values.desconto_percentual || '0'),
        data_inicio: values.data_inicio,
        data_fim: values.data_fim || null,
      })

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success('Pacote criado!')
      setOpen(false)
      startTransition(() => router.refresh())
    } finally {
      setSubmitting(false)
    }
  }

  const isLoading = submitting || isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger className={cn(buttonVariants())}>
        <Plus className="h-4 w-4 mr-1.5" />
        Novo pacote
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Novo pacote de sessões</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="sessoes_total">
                Sessões <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sessoes_total"
                type="number"
                min={1}
                aria-invalid={!!errors.sessoes_total}
                {...register('sessoes_total')}
              />
              {errors.sessoes_total && (
                <p className="text-xs text-destructive">{errors.sessoes_total.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="desconto_percentual">Desconto (%)</Label>
              <Input
                id="desconto_percentual"
                type="number"
                min={0}
                max={100}
                step={0.5}
                {...register('desconto_percentual')}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="valor_total">
              Valor total (R$) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="valor_total"
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              aria-invalid={!!errors.valor_total}
              {...register('valor_total')}
            />
            {errors.valor_total && (
              <p className="text-xs text-destructive">{errors.valor_total.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="data_inicio">
                Início <span className="text-destructive">*</span>
              </Label>
              <Input
                id="data_inicio"
                type="date"
                aria-invalid={!!errors.data_inicio}
                {...register('data_inicio')}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="data_fim">Término (opcional)</Label>
              <Input id="data_fim" type="date" {...register('data_fim')} />
            </div>
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
                  Criando...
                </>
              ) : (
                'Criar pacote'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
