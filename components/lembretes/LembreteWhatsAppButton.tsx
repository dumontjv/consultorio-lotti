'use client'

import { useState, useTransition } from 'react'
import { MessageCircle, CheckCircle2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { registrarLembreteWhatsApp } from '@/app/(app)/lembretes/actions'

interface LembreteWhatsAppButtonProps {
  consultaId: string
  pacienteId: string
  pacienteNome: string
  telefone: string | null
  mensagemPadrao: string
  jaEnviado: boolean
}

export function LembreteWhatsAppButton({
  consultaId,
  pacienteId,
  pacienteNome,
  telefone,
  mensagemPadrao,
  jaEnviado,
}: LembreteWhatsAppButtonProps) {
  const [aberto, setAberto] = useState(false)
  const [mensagem, setMensagem] = useState(mensagemPadrao)
  const [isPending, startTransition] = useTransition()

  function buildWhatsAppUrl(tel: string, msg: string) {
    const digits = tel.replace(/\D/g, '')
    const numero = digits.startsWith('55') ? digits : `55${digits}`
    return `https://wa.me/${numero}?text=${encodeURIComponent(msg)}`
  }

  function handleEnviar() {
    if (!telefone) return

    startTransition(async () => {
      const resultado = await registrarLembreteWhatsApp(consultaId, pacienteId, mensagem)

      if (!resultado.success) {
        toast.error(resultado.error ?? 'Erro ao registrar lembrete')
        return
      }

      window.open(buildWhatsAppUrl(telefone, mensagem), '_blank', 'noopener,noreferrer')
      toast.success(`Lembrete enviado para ${pacienteNome}`)
      setAberto(false)
    })
  }

  if (!telefone) {
    return (
      <span className="text-xs text-muted-foreground italic">Sem telefone cadastrado</span>
    )
  }

  return (
    <>
      <Button
        variant={jaEnviado ? 'ghost' : 'outline'}
        size="sm"
        className={jaEnviado ? 'text-green-600 hover:text-green-700' : 'text-green-700 border-green-200 hover:bg-green-50'}
        onClick={() => setAberto(true)}
      >
        {jaEnviado ? (
          <>
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            Enviado
            <RefreshCw className="h-3 w-3 ml-1.5 opacity-50" />
          </>
        ) : (
          <>
            <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
            Enviar lembrete
          </>
        )}
      </Button>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {jaEnviado ? 'Reenviar lembrete' : 'Enviar lembrete'} — {pacienteNome}
            </DialogTitle>
            <DialogDescription>
              A mensagem abaixo será aberta no WhatsApp já preenchida. Confirme e envie.
            </DialogDescription>
          </DialogHeader>

          <Textarea
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            rows={5}
            className="resize-none text-sm"
          />

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAberto(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button
              onClick={handleEnviar}
              disabled={isPending || !mensagem.trim()}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <MessageCircle className="h-4 w-4 mr-1.5" />
              {isPending ? 'Abrindo...' : 'Abrir no WhatsApp'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
