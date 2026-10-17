'use client'

import { useState, useTransition } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { criarProfissional, atualizarProfissional } from '@/app/(app)/profissionais/actions'
import { DisponibilidadeEditor, type Disponibilidade } from './DisponibilidadeEditor'
import type { Profile } from '@/types/domain'

const criarSchema = z.object({
  nome_completo: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  role: z.enum(['medica', 'psicologa', 'secretaria'], { message: 'Selecione a função' }),
  crm: z.string().optional(),
  crp: z.string().optional(),
  telefone: z.string().optional(),
  ativo: z.boolean().default(true),
  disponibilidade: z.record(z.string(), z.any()).optional(),
})

const editarSchema = criarSchema.omit({ email: true })

type FormValues = z.infer<typeof criarSchema>

interface ProfissionalFormProps {
  profissional?: Profile
  modo: 'criar' | 'editar'
}

export function ProfissionalForm({ profissional, modo }: ProfissionalFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [submitting, setSubmitting] = useState(false)

  const schema = modo === 'criar' ? criarSchema : editarSchema

  const [disponibilidade, setDisponibilidade] = useState<Disponibilidade>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (profissional as any)?.disponibilidade ?? {}
  )

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema as any),
    defaultValues: profissional
      ? {
          nome_completo: profissional.nome_completo,
          role: profissional.role as 'medica' | 'psicologa' | 'secretaria',
          crm: profissional.crm ?? '',
          crp: profissional.crp ?? '',
          telefone: profissional.telefone ?? '',
          ativo: profissional.ativo,
        }
      : { ativo: true, role: 'medica' as const },
  })

  const roleWatch = watch('role')

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    try {
      const payload = { ...values, disponibilidade }
      const result =
        modo === 'criar'
          ? await criarProfissional(payload)
          : await atualizarProfissional(profissional!.id, payload)

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success(modo === 'criar' ? 'Profissional criado!' : 'Profissional atualizado!')
      startTransition(() => router.push('/profissionais'))
    } finally {
      setSubmitting(false)
    }
  }

  const isLoading = submitting || isPending

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados pessoais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="nome_completo">
              Nome completo <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nome_completo"
              {...register('nome_completo')}
              aria-invalid={!!errors.nome_completo}
            />
            {errors.nome_completo && (
              <p className="text-xs text-destructive">{errors.nome_completo.message}</p>
            )}
          </div>

          {modo === 'criar' ? (
            <div className="space-y-1">
              <Label htmlFor="email">
                E-mail <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
              <p className="text-xs text-slate-400">
                O profissional usará este e-mail para acessar o sistema.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <Label>E-mail</Label>
              <Input
                value={profissional?.email ?? ''}
                disabled
                className="bg-muted text-muted-foreground"
              />
              <p className="text-xs text-slate-400">
                O e-mail de acesso só pode ser alterado pelo próprio usuário.
              </p>
            </div>
          )}

          <div className="space-y-1">
            <Label>
              Função <span className="text-destructive">*</span>
            </Label>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <Select value={field.value ?? ''} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione a função" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="medica">Médica</SelectItem>
                    <SelectItem value="psicologa">Psicóloga</SelectItem>
                    <SelectItem value="secretaria">Secretária</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.role && (
              <p className="text-xs text-destructive">{errors.role.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              {...register('telefone')}
              placeholder="(11) 99999-9999"
            />
          </div>
        </CardContent>
      </Card>

      {(roleWatch === 'medica' || roleWatch === 'psicologa') && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Registro profissional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {roleWatch === 'medica' && (
              <div className="space-y-1">
                <Label htmlFor="crm">CRM</Label>
                <Input id="crm" {...register('crm')} placeholder="SP-123456" />
              </div>
            )}
            {roleWatch === 'psicologa' && (
              <div className="space-y-1">
                <Label htmlFor="crp">CRP</Label>
                <Input id="crp" {...register('crp')} placeholder="06/123456" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {modo === 'editar' && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">Profissional ativo</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Inativos não aparecem na seleção de profissional da agenda
                </p>
              </div>
              <Controller
                control={control}
                name="ativo"
                render={({ field }) => (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={field.value}
                    onClick={() => field.onChange(!field.value)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      field.value ? 'bg-teal-500' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        field.value ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                )}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {(roleWatch === 'medica' || roleWatch === 'psicologa') && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Disponibilidade semanal</CardTitle>
          </CardHeader>
          <CardContent>
            <DisponibilidadeEditor value={disponibilidade} onChange={setDisponibilidade} />
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/profissionais')}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {modo === 'criar' ? 'Criando...' : 'Salvando...'}
            </>
          ) : modo === 'criar' ? (
            'Criar profissional'
          ) : (
            'Salvar alterações'
          )}
        </Button>
      </div>
    </form>
  )
}
