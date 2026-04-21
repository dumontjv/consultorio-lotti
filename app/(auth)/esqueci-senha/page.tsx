'use client'

import { useState } from 'react'
import Link from 'next/link'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Mail, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
})

type FormData = z.infer<typeof schema>

export default function EsqueciSenhaPage() {
  const [enviado, setEnviado] = useState(false)
  const [carregando, setCarregando] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setCarregando(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      })

      if (error) {
        toast.error('Erro ao enviar e-mail. Tente novamente.')
        return
      }

      setEnviado(true)
    } catch {
      toast.error('Erro inesperado. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Recuperar senha</CardTitle>
            <CardDescription>
              {enviado
                ? 'Verifique seu e-mail'
                : 'Digite seu e-mail para receber o link de recuperação'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {enviado ? (
              <div className="space-y-4 text-center">
                <div className="flex justify-center">
                  <Mail className="h-12 w-12 text-teal-500" />
                </div>
                <p className="text-sm text-slate-600">
                  Se esse e-mail estiver cadastrado, você receberá as instruções em breve.
                </p>
                <Link href="/login">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar ao login
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    placeholder="seu@email.com"
                    {...register('email')}
                    aria-invalid={!!errors.email}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={carregando}>
                  {carregando ? 'Enviando...' : 'Enviar link de recuperação'}
                </Button>

                <Link href="/login">
                  <Button variant="ghost" className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar ao login
                  </Button>
                </Link>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
