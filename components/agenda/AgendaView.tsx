'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useTransition, useCallback } from 'react'
import { format, addDays, subDays, addWeeks, subWeeks, startOfWeek, endOfWeek, isSameDay, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Video, CheckCircle2, XCircle, UserCheck } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { NovaConsultaModal } from './NovaConsultaModal'
import { atualizarStatusConsulta } from '@/app/(app)/agenda/actions'
import type { ConsultaDetalhada, Profile } from '@/types/domain'

interface AgendaViewProps {
  consultas: ConsultaDetalhada[]
  profissionais: Pick<Profile, 'id' | 'nome_completo' | 'role'>[]
  dataAtual: string
  modo: 'dia' | 'semana'
}

const STATUS_CONFIG = {
  agendada: { label: 'Agendada', class: 'border-slate-200 text-slate-600 bg-white' },
  confirmada: { label: 'Confirmada', class: 'border-teal-200 text-teal-700 bg-teal-50' },
  compareceu: { label: 'Compareceu', class: 'border-green-200 text-green-700 bg-green-50' },
  faltou: { label: 'Faltou', class: 'border-rose-200 text-rose-600 bg-rose-50' },
  cancelada: { label: 'Cancelada', class: 'border-slate-100 text-slate-400 bg-slate-50' },
}

const PROFISSIONAL_COLORS: Record<string, string> = {
  medica: 'border-l-teal-400',
  psicologa: 'border-l-indigo-400',
  secretaria: 'border-l-slate-400',
  admin: 'border-l-slate-400',
}

export function AgendaView({ consultas, profissionais, dataAtual, modo }: AgendaViewProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [, startTransition] = useTransition()

  const dataObj = parseISO(dataAtual)

  const navegar = useCallback(
    (data: string, novoModo?: string) => {
      const params = new URLSearchParams()
      params.set('data', data)
      params.set('modo', novoModo ?? modo)
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`)
      })
    },
    [router, pathname, modo]
  )

  function anterior() {
    if (modo === 'dia') {
      navegar(format(subDays(dataObj, 1), 'yyyy-MM-dd'))
    } else {
      navegar(format(subWeeks(dataObj, 1), 'yyyy-MM-dd'))
    }
  }

  function proximo() {
    if (modo === 'dia') {
      navegar(format(addDays(dataObj, 1), 'yyyy-MM-dd'))
    } else {
      navegar(format(addWeeks(dataObj, 1), 'yyyy-MM-dd'))
    }
  }

  function hoje() {
    navegar(format(new Date(), 'yyyy-MM-dd'))
  }

  async function mudarStatus(
    id: string,
    status: 'agendada' | 'confirmada' | 'compareceu' | 'faltou' | 'cancelada'
  ) {
    const result = await atualizarStatusConsulta(id, status)
    if (!result.success) {
      toast.error(result.error)
    } else {
      toast.success('Status atualizado')
      startTransition(() => router.refresh())
    }
  }

  // Gera os dias a exibir
  const dias =
    modo === 'dia'
      ? [dataObj]
      : Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(dataObj, { weekStartsOn: 0 }), i))

  const titulo =
    modo === 'dia'
      ? format(dataObj, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })
      : `${format(startOfWeek(dataObj, { weekStartsOn: 0 }), "d 'de' MMM", { locale: ptBR })} – ${format(endOfWeek(dataObj, { weekStartsOn: 0 }), "d 'de' MMM 'de' yyyy", { locale: ptBR })}`

  const isHoje = isSameDay(dataObj, new Date())

  return (
    <div className="space-y-4">
      {/* Barra de navegação */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={anterior} aria-label="Período anterior">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={hoje} disabled={isHoje && modo === 'dia'}>
            Hoje
          </Button>
          <Button variant="outline" size="icon-sm" onClick={proximo} aria-label="Próximo período">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-sm font-medium text-slate-700 capitalize ml-1">{titulo}</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle dia/semana */}
          <div className="flex rounded-lg border border-input overflow-hidden text-sm">
            <button
              className={`px-3 py-1.5 transition-colors ${modo === 'dia' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
              onClick={() => navegar(dataAtual, 'dia')}
            >
              Dia
            </button>
            <button
              className={`px-3 py-1.5 transition-colors ${modo === 'semana' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
              onClick={() => navegar(dataAtual, 'semana')}
            >
              Semana
            </button>
          </div>

          <NovaConsultaModal
            profissionais={profissionais}
            dataInicial={dataAtual}
          />
        </div>
      </div>

      {/* Conteúdo */}
      {modo === 'dia' ? (
        <DiaView
          dia={dataObj}
          consultas={consultas}
          profissionais={profissionais}
          onMudarStatus={mudarStatus}
        />
      ) : (
        <SemanaView
          dias={dias}
          consultas={consultas}
          profissionais={profissionais}
          onMudarStatus={mudarStatus}
          onNavDia={(data) => navegar(format(data, 'yyyy-MM-dd'), 'dia')}
        />
      )}
    </div>
  )
}

function DiaView({
  dia,
  consultas,
  profissionais,
  onMudarStatus,
}: {
  dia: Date
  consultas: ConsultaDetalhada[]
  profissionais: Pick<Profile, 'id' | 'nome_completo' | 'role'>[]
  onMudarStatus: (id: string, status: 'agendada' | 'confirmada' | 'compareceu' | 'faltou' | 'cancelada') => void
}) {
  const consultasDia = consultas
    .filter((c) => c.data === format(dia, 'yyyy-MM-dd'))
    .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))

  if (consultasDia.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
        <p className="font-medium">Nenhuma consulta neste dia</p>
        <p className="text-sm mt-1">Use o botão "Nova consulta" para agendar.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {consultasDia.map((c) => (
        <ConsultaCard
          key={c.id}
          consulta={c}
          profissionais={profissionais}
          onMudarStatus={onMudarStatus}
        />
      ))}
    </div>
  )
}

function SemanaView({
  dias,
  consultas,
  profissionais,
  onMudarStatus,
  onNavDia,
}: {
  dias: Date[]
  consultas: ConsultaDetalhada[]
  profissionais: Pick<Profile, 'id' | 'nome_completo' | 'role'>[]
  onMudarStatus: (id: string, status: 'agendada' | 'confirmada' | 'compareceu' | 'faltou' | 'cancelada') => void
  onNavDia: (dia: Date) => void
}) {
  const hoje = new Date()

  return (
    <div className="grid grid-cols-7 gap-1 min-h-[400px]">
      {dias.map((dia) => {
        const key = format(dia, 'yyyy-MM-dd')
        const consultasDia = consultas
          .filter((c) => c.data === key)
          .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
        const ehHoje = isSameDay(dia, hoje)

        return (
          <div key={key} className="border border-input rounded-lg overflow-hidden">
            <button
              onClick={() => onNavDia(dia)}
              className={`w-full text-center py-2 text-xs font-medium border-b transition-colors hover:bg-muted ${ehHoje ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-muted/30'}`}
            >
              <span className="block capitalize">{format(dia, 'EEE', { locale: ptBR })}</span>
              <span className="block text-sm font-semibold">{format(dia, 'd')}</span>
            </button>
            <div className="p-1 space-y-1 min-h-[80px]">
              {consultasDia.map((c) => (
                <div
                  key={c.id}
                  className={`rounded px-1.5 py-1 border-l-2 bg-white border border-input text-xs cursor-pointer hover:shadow-sm transition-shadow ${PROFISSIONAL_COLORS[c.profissional.role] ?? 'border-l-slate-300'}`}
                >
                  <p className="font-medium text-slate-700 truncate">{c.hora_inicio}</p>
                  <p className="text-slate-500 truncate">{c.paciente.nome_completo}</p>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ConsultaCard({
  consulta: c,
  profissionais,
  onMudarStatus,
}: {
  consulta: ConsultaDetalhada
  profissionais: Pick<Profile, 'id' | 'nome_completo' | 'role'>[]
  onMudarStatus: (id: string, status: 'agendada' | 'confirmada' | 'compareceu' | 'faltou' | 'cancelada') => void
}) {
  const st = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.agendada
  const corBorda = PROFISSIONAL_COLORS[c.profissional.role] ?? 'border-l-slate-300'
  const cancelada = c.status === 'cancelada' || c.status === 'faltou'

  return (
    <Card className={`border-l-4 ${corBorda} ${cancelada ? 'opacity-60' : ''}`}>
      <CardContent className="py-3 px-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-slate-700">
                {c.hora_inicio} – {c.hora_fim}
              </span>
              <Badge variant="outline" className={`text-xs ${st.class}`}>
                {st.label}
              </Badge>
              {c.tipo === 'teleconsulta' && (
                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                  <Video className="h-3 w-3" />
                  Online
                </Badge>
              )}
            </div>
            <p className="font-medium text-slate-900 mt-0.5">{c.paciente.nome_completo}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {c.profissional.nome_completo} ·{' '}
              {c.profissional.role === 'medica'
                ? `CRM ${c.profissional.crm}`
                : `CRP ${c.profissional.crp}`}
            </p>
            {c.observacoes && (
              <p className="text-xs text-slate-400 mt-1 italic">"{c.observacoes}"</p>
            )}
          </div>

          {/* Ações rápidas */}
          {!cancelada && (
            <div className="flex items-center gap-1 shrink-0">
              {c.status === 'agendada' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs border-teal-200 text-teal-700 hover:bg-teal-50"
                  onClick={() => onMudarStatus(c.id, 'confirmada')}
                  title="Confirmar"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  Confirmar
                </Button>
              )}
              {c.status === 'confirmada' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs border-green-200 text-green-700 hover:bg-green-50"
                  onClick={() => onMudarStatus(c.id, 'compareceu')}
                  title="Registrar comparecimento"
                >
                  <UserCheck className="h-3.5 w-3.5 mr-1" />
                  Compareceu
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                onClick={() => onMudarStatus(c.id, 'cancelada')}
                title="Cancelar"
              >
                <XCircle className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
