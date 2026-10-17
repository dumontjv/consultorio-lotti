'use client'

import { useState, useTransition } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { CheckCircle, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { marcarComoPago } from '@/app/(app)/financeiro/actions'

const schema = z.object({
  forma_pagamento: z.enum([
    'pix',
    'dinheiro',
    'credito',
    'debito',
    'convenio',
    'transferencia',
    'boleto',
  ]),
  data_pagamento: z.string().min(1, 'Data obrigatória'),
})

type FormValues = z.infer<typeof schema>

const FORMA_LABELS: Record<string, string> = {
  pix: 'Pix',
  dinheiro: 'Dinheiro',
  credito: 'Cartão de Crédito',
  debito: 'Cartão de Débito',
  convenio: 'Convênio',
  transferencia: 'Transferência',
  boleto: 'Boleto',
}

interface MarcarPagoModalProps {
  id: string
  descricao: string
  valor: number
  formaAtual?: string | null
}

export function MarcarPagoModal({ id, descricao, valor, formaAtual }: MarcarPagoModalProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      forma_pagamento: (formaAtual as FormValues['forma_pagamento']) ?? 'pix',
      data_pagamento: format(new Date(), 'yyyy-MM-dd'),
    },
  })

  function formatarReais(v: number) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    try {
      const result = await marcarComoPago(id, values.data_pagamento, values.forma_pagamento)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success('Pagamento registrado!')
      setOpen(false)
      startTransition(() => {})
    } finally {
      setSubmitting(false)
    }
  }

  const isLoading = submitting || isPending

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="inline-flex items-center h-7 px-2.5 text-xs font-medium rounded-md border border-green-200 text-green-700 hover:bg-green-50 transition-colors shrink-0"
      >
        <CheckCircle className="h-3.5 w-3.5 mr-1" />
        Pagar
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Registrar pagamento</DialogTitle>
        </DialogHeader>

        <div className="py-1">
          <p className="text-sm text-slate-600 truncate">{descricao}</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{formatarReais(valor)}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                    {Object.entries(FORMA_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="data_pagamento">Data do pagamento</Label>
            <Input
              id="data_pagamento"
              type="date"
              {...register('data_pagamento')}
              aria-invalid={!!errors.data_pagamento}
            />
            {errors.data_pagamento && (
              <p className="text-xs text-destructive">{errors.data_pagamento.message}</p>
            )}
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
                  Salvando...
                </>
              ) : (
                'Confirmar pagamento'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
