'use client'

import { useState, useTransition, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Camera } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { salvarPerfilUsuario } from '@/app/(app)/configuracoes/actions'
import { createClient } from '@/lib/supabase/client'

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
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const [fotoUrl, setFotoUrl] = useState<string | null>(profile?.foto_url ?? null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  async function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Foto deve ter no máximo 5 MB')
      return
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem')
      return
    }

    setUploadingFoto(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { toast.error('Sessão expirada'); return }

      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${user.id}/foto.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('fotos-perfil')
        .upload(path, file, { upsert: true })

      if (uploadError) { toast.error('Erro ao enviar foto'); return }

      const { data: { publicUrl } } = supabase.storage
        .from('fotos-perfil')
        .getPublicUrl(path)

      setFotoUrl(`${publicUrl}?t=${Date.now()}`)

      const result = await salvarPerfilUsuario({
        nome_completo: profile?.nome_completo ?? '',
        telefone: profile?.telefone ?? null,
        foto_url: publicUrl,
      })
      if (!result.success) { toast.error(result.error); return }

      toast.success('Foto atualizada!')
      startTransition(() => router.refresh())
    } finally {
      setUploadingFoto(false)
    }
  }

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    try {
      const result = await salvarPerfilUsuario({
        nome_completo: values.nome_completo,
        telefone: values.telefone || null,
      })
      if (!result.success) { toast.error(result.error); return }
      toast.success('Perfil atualizado!')
      startTransition(() => router.refresh())
    } finally {
      setSubmitting(false)
    }
  }

  const isLoading = submitting || isPending
  const initials = (profile?.nome_completo ?? 'U')
    .split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Foto de perfil */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Foto de perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={fotoUrl ?? undefined} alt={profile?.nome_completo} />
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              {uploadingFoto && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploadingFoto}
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-4 w-4 mr-1.5" />
                {uploadingFoto ? 'Enviando...' : 'Trocar foto'}
              </Button>
              <p className="text-xs text-slate-400">JPG, PNG ou WebP — máx. 5 MB</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFotoChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Dados do perfil */}
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
            <Input id="nome_completo" aria-invalid={!!errors.nome_completo} {...register('nome_completo')} />
            {errors.nome_completo && (
              <p className="text-xs text-destructive">{errors.nome_completo.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="telefone">Telefone</Label>
            <Input id="telefone" placeholder="(21) 9 9999-9999" {...register('telefone')} />
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
        {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : 'Salvar perfil'}
      </Button>
    </form>
  )
}
