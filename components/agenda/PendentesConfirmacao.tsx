'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CheckCircle2, Globe, Loader2, Mail, Phone, XCircle, Inbox } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatarTelefone } from '@/lib/validators/telefone'
import { aprovarAgendamentoOnline, rejeitarAgendamentoOnline } from '@/app/(app)/agenda/actions'

export interface AgendamentoPendente {
  id: string
  data: string
  hora_inicio: string
  hora_fim: string
  protocolo: string | null
  motivo: string | null
  solicitante_nome: string | null
  solicitante_telefone: string | null
  solicitante_email: string | null
  created_at: string
  paciente: { id: string; nome_completo: string } | null
  profissional: { id: string; nome_completo: string; role: string } | null
}

export function PendentesConfirmacao({ pendentes }: { pendentes: AgendamentoPendente[] }) {
  if (pendentes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Inbox className="h-12 w-12 text-slate-200 mb-3" />
        <p className="text-slate-500 font-medium">Nenhum agendamento aguardando confirmação</p>
        <p className="text-xs text-slate-400 mt-1">Pedidos feitos em /agendar aparecem aqui.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {pendentes.map((p) => (
        <PendenteCard key={p.id} pendente={p} />
      ))}
    </div>
  )
}

function PendenteCard({ pendente: p }: { pendente: AgendamentoPendente }) {
  const router = useRouter()
  const [confirmandoRejeicao, setConfirmandoRejeicao] = useState(false)
  const [processando, startTransition] = useTransition()

  // CPF coincidiu com um cadastro existente cujo nome é diferente do informado
  const nomeDivergente =
    !!p.paciente &&
    !!p.solicitante_nome &&
    p.paciente.nome_completo.trim().toLowerCase() !== p.solicitante_nome.trim().toLowerCase()

  function aprovar() {
    startTransition(async () => {
      const r = await aprovarAgendamentoOnline(p.id)
      if (!r.success) {
        toast.error(r.error)
        return
      }
      toast.success('Agendamento aprovado')
      router.refresh()
    })
  }

  function rejeitar() {
    startTransition(async () => {
      const r = await rejeitarAgendamentoOnline(p.id)
      if (!r.success) {
        toast.error(r.error)
        return
      }
      if (r.emailEnviado) {
        toast.success('Agendamento rejeitado e paciente avisado por e-mail')
      } else {
        toast.warning(`Agendamento rejeitado, mas o e-mail não foi enviado: ${r.aviso ?? 'erro desconhecido'}`)
      }
      setConfirmandoRejeicao(false)
      router.refresh()
    })
  }

  return (
    <Card className="border-l-4 border-l-amber-400">
      <CardContent className="py-4 px-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-slate-800 capitalize">
                {format(parseISO(p.data), "EEE, d 'de' MMM", { locale: ptBR })} · {p.hora_inicio.slice(0, 5)}–
                {p.hora_fim.slice(0, 5)}
              </span>
              <Badge variant="outline" className="text-xs border-amber-200 text-amber-700 bg-amber-50 gap-1">
                <Globe className="h-3 w-3" />
                Online
              </Badge>
              {p.protocolo && <span className="text-xs font-mono text-slate-400">{p.protocolo}</span>}
            </div>

            <p className="font-medium text-slate-900">{p.solicitante_nome ?? p.paciente?.nome_completo}</p>
            {nomeDivergente && (
              <p className="text-xs text-amber-700">
                CPF já cadastrado em nome de <strong>{p.paciente?.nome_completo}</strong> — confira antes de aprovar.
              </p>
            )}

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              {p.solicitante_telefone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {formatarTelefone(p.solicitante_telefone)}
                </span>
              )}
              {p.solicitante_email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {p.solicitante_email}
                </span>
              )}
              {p.profissional && <span>{p.profissional.nome_completo}</span>}
              <span>
                pedido {formatDistanceToNow(parseISO(p.created_at), { locale: ptBR, addSuffix: true })}
              </span>
            </div>

            {p.motivo && <p className="text-sm text-slate-600 bg-slate-50 rounded-md px-3 py-2 mt-1">{p.motivo}</p>}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {confirmandoRejeicao ? (
              <>
                <span className="text-xs text-rose-600 font-medium">Rejeitar e avisar por e-mail?</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-rose-200 text-rose-600 hover:bg-rose-50"
                  disabled={processando}
                  onClick={rejeitar}
                >
                  {processando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Sim, rejeitar'}
                </Button>
                <Button size="sm" variant="ghost" disabled={processando} onClick={() => setConfirmandoRejeicao(false)}>
                  Não
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-rose-200 text-rose-600 hover:bg-rose-50"
                  disabled={processando}
                  onClick={() => setConfirmandoRejeicao(true)}
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" />
                  Rejeitar
                </Button>
                <Button size="sm" disabled={processando} onClick={aprovar}>
                  {processando ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  )}
                  Aprovar
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
