'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { salvarConfiguracoes } from '@/app/(app)/configuracoes/actions'

const formSchema = z.object({
  consultorio_nome: z.string().min(1, 'Nome obrigatório'),
  consultorio_endereco: z.string().optional(),
  consultorio_celular: z.string().optional(),
  consultorio_email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  consultorio_cnpj: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface ConfiguracoesFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: any
}

export function ConfiguracoesForm({ config }: ConfiguracoesFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      consultorio_nome: config?.consultorio_nome ?? 'Consultório Lotti Fonseca',
      consultorio_endereco: config?.consultorio_endereco ?? '',
      consultorio_celular: config?.consultorio_celular ?? '',
      consultorio_email: config?.consultorio_email ?? '',
      consultorio_cnpj: config?.consultorio_cnpj ?? '',
    },
  })

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    try {
      const result = await salvarConfiguracoes(values)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success('Configurações salvas!')
      startTransition(() => router.refresh())
    } finally {
      setSubmitting(false)
    }
  }

  const isLoading = submitting || isPending

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Dados do Consultório</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="consultorio_nome">
              Nome <span className="text-destructive">*</span>
            </Label>
            <Input
              id="consultorio_nome"
              aria-invalid={!!errors.consultorio_nome}
              {...register('consultorio_nome')}
            />
            {errors.consultorio_nome && (
              <p className="text-xs text-destructive">{errors.consultorio_nome.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="consultorio_endereco">Endereço</Label>
            <Input
              id="consultorio_endereco"
              placeholder="Rua, número, bairro, cidade — UF"
              {...register('consultorio_endereco')}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="consultorio_celular">Telefone / Celular</Label>
              <Input
                id="consultorio_celular"
                placeholder="(21) 9 9999-9999"
                {...register('consultorio_celular')}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="consultorio_email">E-mail</Label>
              <Input
                id="consultorio_email"
                type="email"
                placeholder="contato@consultorio.com.br"
                aria-invalid={!!errors.consultorio_email}
                {...register('consultorio_email')}
              />
              {errors.consultorio_email && (
                <p className="text-xs text-destructive">{errors.consultorio_email.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="consultorio_cnpj">CNPJ</Label>
            <Input
              id="consultorio_cnpj"
              placeholder="00.000.000/0000-00"
              {...register('consultorio_cnpj')}
            />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Salvando...
          </>
        ) : (
          'Salvar configurações'
        )}
      </Button>
    </form>
  )
}
