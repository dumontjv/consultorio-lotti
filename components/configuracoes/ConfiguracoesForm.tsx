'use client'

import { useState, useTransition, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Upload, ImageIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { salvarConfiguracoes, salvarLogoConsultorio } from '@/app/(app)/configuracoes/actions'
import { createClient } from '@/lib/supabase/client'

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
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(config?.consultorio_logo_url ?? null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo deve ter no máximo 5 MB')
      return
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem')
      return
    }

    setUploadingLogo(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() ?? 'png'
      const path = `logo/logo-consultorio.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('logo-consultorio')
        .upload(path, file, { upsert: true })

      if (uploadError) { toast.error('Erro ao enviar logo'); return }

      const { data: { publicUrl } } = supabase.storage
        .from('logo-consultorio')
        .getPublicUrl(path)

      setLogoUrl(`${publicUrl}?t=${Date.now()}`)

      const result = await salvarLogoConsultorio(publicUrl)
      if (!result.success) { toast.error(result.error); return }

      toast.success('Logo atualizado!')
      startTransition(() => router.refresh())
    } finally {
      setUploadingLogo(false)
    }
  }

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    try {
      const result = await salvarConfiguracoes(values)
      if (!result.success) { toast.error(result.error); return }
      toast.success('Configurações salvas!')
      startTransition(() => router.refresh())
    } finally {
      setSubmitting(false)
    }
  }

  const isLoading = submitting || isPending

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Logo */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Logo do consultório</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt="Logo"
                  width={80}
                  height={80}
                  className="object-contain"
                  unoptimized
                />
              ) : (
                <ImageIcon className="h-8 w-8 text-slate-300" />
              )}
            </div>
            <div className="space-y-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploadingLogo}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-1.5" />
                {uploadingLogo ? 'Enviando...' : logoUrl ? 'Trocar logo' : 'Enviar logo'}
              </Button>
              <p className="text-xs text-slate-400">PNG, SVG ou WebP — máx. 5 MB</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Dados */}
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
              <Input id="consultorio_celular" placeholder="(21) 9 9999-9999" {...register('consultorio_celular')} />
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
            <Input id="consultorio_cnpj" placeholder="00.000.000/0000-00" {...register('consultorio_cnpj')} />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : 'Salvar configurações'}
      </Button>
    </form>
  )
}
