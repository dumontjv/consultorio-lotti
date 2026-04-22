'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { CheckCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { registrarSessao, cancelarPacote } from '@/app/(app)/pacientes/[id]/pacotes/actions'

interface PacoteAcoesProps {
  pacoteId: string
  pacienteId: string
}

export function PacoteAcoes({ pacoteId, pacienteId }: PacoteAcoesProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState<'sessao' | 'cancelar' | null>(null)

  async function onRegistrarSessao() {
    setLoading('sessao')
    try {
      const result = await registrarSessao(pacoteId, pacienteId)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success('Sessão registrada!')
      startTransition(() => router.refresh())
    } finally {
      setLoading(null)
    }
  }

  async function onCancelar() {
    if (!confirm('Confirma o cancelamento do pacote?')) return
    setLoading('cancelar')
    try {
      const result = await cancelarPacote(pacoteId, pacienteId)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success('Pacote cancelado.')
      startTransition(() => router.refresh())
    } finally {
      setLoading(null)
    }
  }

  const isLoading = loading !== null || isPending

  return (
    <div className="flex flex-col gap-1.5 shrink-0">
      <Button
        size="sm"
        className="text-xs h-7"
        onClick={onRegistrarSessao}
        disabled={isLoading}
      >
        <CheckCircle className="h-3.5 w-3.5 mr-1" />
        {loading === 'sessao' ? 'Registrando...' : 'Registrar sessão'}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="text-xs h-7 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
        onClick={onCancelar}
        disabled={isLoading}
      >
        <X className="h-3.5 w-3.5 mr-1" />
        Cancelar
      </Button>
    </div>
  )
}
