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
import { Badge } from '@/components/ui/badge'
import { salvarPerfilUsuario } from '@/app/(app)/configuracoes/actions'

const formSchema = z.object({
  nome_completo: z.string().min(2, 'Nome obrigatório'),
  telefone: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface PerfilFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  profile: any
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  medica: 'Médica',
  psicologa: 'Psicóloga',
  secretaria: 'Secretária',
}

export function PerfilForm({ profile }: PerfilFormProps) {
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
      nome_completo: profile?.nome_completo ?? '',
      telefone: profile?.telefone ?? '',
    },
  })

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    try {
      const result = await salvarPerfilUsuario({
        nome_completo: values.nome_completo,
        telefone: values.telefone || null,
      })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success('Perfil atualizado!')
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
          <CardTitle className="text-sm flex items-center gap-2">
            Informações do perfil
            {profile?.role && (
              <Badge variant="secondary" className="text-xs">
                {ROLE_LABELS[profile.role] ?? profile.role}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="nome_completo">
              Nome completo <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nome_completo"
              aria-invalid={!!errors.nome_completo}
              {...register('nome_completo')}
            />
            {errors.nome_completo && (
              <p className="text-xs text-destructive">{errors.nome_completo.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              placeholder="(21) 9 9999-9999"
              {...register('telefone')}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-slate-400">E-mail (não editável)</Label>
            <Input value={profile?.email ?? ''} disabled className="bg-slate-50 text-slate-400" />
          </div>

          {profile?.crm && (
            <div className="space-y-1">
              <Label className="text-xs text-slate-400">CRM</Label>
              <Input value={profile.crm} disabled className="bg-slate-50 text-slate-400" />
            </div>
          )}

          {profile?.crp && (
            <div className="space-y-1">
              <Label className="text-xs text-slate-400">CRP</Label>
              <Input value={profile.crp} disabled className="bg-slate-50 text-slate-400" />
            </div>
          )}
        </CardContent>
      </Card>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Salvando...
          </>
        ) : (
          'Salvar perfil'
        )}
      </Button>
    </form>
  )
}
