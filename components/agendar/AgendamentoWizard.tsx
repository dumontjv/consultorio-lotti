'use client'

import { useState, useTransition } from 'react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Stethoscope,
  Brain,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { TELEFONES_CLINICA } from '@/lib/agendamento/contato'
import {
  buscarHorariosDisponiveis,
  criarAgendamentoOnline,
  type AgendamentoResult,
} from '@/app/agendar/actions'

interface ProfissionalPublico {
  id: string
  nome_completo: string
  role: 'medica' | 'psicologa'
}

type Etapa = 'profissional' | 'horario' | 'dados' | 'confirmado'

const ROLE_LABEL = { medica: 'Médica', psicologa: 'Psicóloga' }
const DIAS_SEMANA_CURTO = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function dataExtenso(data: string) {
  return format(parseISO(data), "EEEE, d 'de' MMMM", { locale: ptBR })
}

function mascaraTelefone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

function mascaraCPF(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function AgendamentoWizard({ profissionais }: { profissionais: ProfissionalPublico[] }) {
  const [etapa, setEtapa] = useState<Etapa>('profissional')
  const [profissional, setProfissional] = useState<ProfissionalPublico | null>(null)
  const [dias, setDias] = useState<Record<string, string[]>>({})
  const [duracao, setDuracao] = useState(0)
  const [data, setData] = useState<string | null>(null)
  const [hora, setHora] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [confirmacao, setConfirmacao] = useState<Extract<AgendamentoResult, { success: true }> | null>(null)
  const [carregando, startTransition] = useTransition()

  const [form, setForm] = useState({
    nome: '',
    telefone: '',
    email: '',
    cpf: '',
    motivo: '',
    lgpd: false,
    website: '',
  })

  function carregarHorarios(p: ProfissionalPublico, manterSelecao = false) {
    setErro(null)
    startTransition(async () => {
      const r = await buscarHorariosDisponiveis(p.id)
      if (!r.success) {
        setErro(r.error)
        return
      }
      setDias(r.dias)
      setDuracao(r.duracao)
      if (!manterSelecao) {
        setData(Object.keys(r.dias)[0] ?? null)
        setHora(null)
      }
      setEtapa('horario')
    })
  }

  function escolherProfissional(p: ProfissionalPublico) {
    setProfissional(p)
    carregarHorarios(p)
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (!profissional || !data || !hora) return
    setErro(null)
    startTransition(async () => {
      const r = await criarAgendamentoOnline({
        profissional_id: profissional.id,
        data,
        hora,
        ...form,
        cpf: form.cpf || undefined,
      })
      if (!r.success) {
        setErro(r.error)
        if (r.horarioIndisponivel) {
          setHora(null)
          carregarHorarios(profissional, true)
        }
        return
      }
      setConfirmacao(r)
      setEtapa('confirmado')
    })
  }

  if (etapa === 'confirmado' && confirmacao) {
    return (
      <Card>
        <CardContent className="py-10 text-center space-y-4">
          <CheckCircle2 className="h-14 w-14 text-teal-600 mx-auto" />
          <div>
            <h1 className="text-xl font-semibold">Solicitação enviada!</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Seu horário fica reservado até a clínica confirmar.
            </p>
          </div>
          <div className="inline-block rounded-lg border bg-muted/40 px-6 py-4 text-left space-y-1.5">
            <p className="text-sm">
              <span className="text-muted-foreground">Protocolo: </span>
              <span className="font-mono font-semibold text-base">{confirmacao.protocolo}</span>
            </p>
            <p className="text-sm capitalize">{dataExtenso(confirmacao.data)}</p>
            <p className="text-sm">
              <span className="text-muted-foreground">Horário: </span>
              {confirmacao.hora}
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Profissional: </span>
              {confirmacao.profissional}
            </p>
          </div>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Guarde o número do protocolo. Se precisar falar com a clínica, ligue{' '}
            {TELEFONES_CLINICA.join(' ou ')}.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Passos etapa={etapa} />

      {erro && (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {erro}
        </div>
      )}

      {etapa === 'profissional' && (
        <section className="space-y-3">
          <h1 className="text-lg font-semibold">Com quem você quer se consultar?</h1>
          {profissionais.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                O agendamento online está indisponível no momento. Ligue{' '}
                {TELEFONES_CLINICA.join(' ou ')}.
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {profissionais.map((p) => {
                const Icone = p.role === 'medica' ? Stethoscope : Brain
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={carregando}
                    onClick={() => escolherProfissional(p)}
                    className={cn(
                      'text-left rounded-xl border bg-card p-4 transition-colors hover:border-primary disabled:opacity-60',
                      p.role === 'medica' ? 'hover:bg-teal-50/50 dark:hover:bg-teal-900/10' : 'hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'h-10 w-10 rounded-full flex items-center justify-center shrink-0',
                          p.role === 'medica' ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300' : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                        )}
                      >
                        <Icone className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{p.nome_completo}</p>
                        <p className="text-xs text-muted-foreground">{ROLE_LABEL[p.role]}</p>
                      </div>
                      {carregando && profissional?.id === p.id && (
                        <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </section>
      )}

      {etapa === 'horario' && profissional && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon-sm" onClick={() => setEtapa('profissional')} aria-label="Voltar">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Escolha o dia e o horário</h1>
              <p className="text-xs text-muted-foreground">
                {profissional.nome_completo} · consultas de {duracao} min
              </p>
            </div>
          </div>

          {Object.keys(dias).length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Não há horários livres nos próximos dias. Ligue {TELEFONES_CLINICA.join(' ou ')}.
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-[1fr_220px] gap-4">
              <Calendario
                dias={dias}
                selecionado={data}
                onSelecionar={(d) => {
                  setData(d)
                  setHora(null)
                }}
              />
              <Card>
                <CardContent className="pt-4">
                  {data ? (
                    <>
                      <p className="text-sm font-medium capitalize mb-3">{dataExtenso(data)}</p>
                      <div className="grid grid-cols-3 md:grid-cols-2 gap-2">
                        {(dias[data] ?? []).map((h) => (
                          <button
                            key={h}
                            type="button"
                            onClick={() => setHora(h)}
                            aria-pressed={hora === h}
                            className={cn(
                              'rounded-md border px-2 py-1.5 text-sm tabular-nums transition-colors',
                              hora === h
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'hover:border-primary'
                            )}
                          >
                            {h}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Selecione um dia no calendário.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex justify-end">
            <Button disabled={!data || !hora} onClick={() => setEtapa('dados')}>
              Continuar
            </Button>
          </div>
        </section>
      )}

      {etapa === 'dados' && profissional && data && hora && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon-sm" onClick={() => setEtapa('horario')} aria-label="Voltar">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Seus dados</h1>
              <p className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {dataExtenso(data)} às {hora} · {profissional.nome_completo}
              </p>
            </div>
          </div>

          <Card>
            <CardContent className="pt-5">
              <form onSubmit={enviar} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="nome">Nome completo *</Label>
                  <Input
                    id="nome"
                    required
                    autoComplete="name"
                    maxLength={120}
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="telefone">Telefone (WhatsApp) *</Label>
                    <Input
                      id="telefone"
                      required
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="(21) 99999-9999"
                      value={form.telefone}
                      onChange={(e) => setForm({ ...form, telefone: mascaraTelefone(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">E-mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cpf">CPF (opcional)</Label>
                  <Input
                    id="cpf"
                    inputMode="numeric"
                    placeholder="000.000.000-00"
                    value={form.cpf}
                    onChange={(e) => setForm({ ...form, cpf: mascaraCPF(e.target.value) })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="motivo">Motivo da consulta *</Label>
                  <Textarea
                    id="motivo"
                    required
                    rows={3}
                    maxLength={500}
                    value={form.motivo}
                    onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                  />
                </div>

                {/* Honeypot anti-robô: invisível para pessoas */}
                <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                  <label htmlFor="website">Site</label>
                  <input
                    id="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                  />
                </div>

                <label className="flex items-start gap-2.5 text-sm cursor-pointer">
                  <Checkbox
                    checked={form.lgpd}
                    onCheckedChange={(v) => setForm({ ...form, lgpd: v === true })}
                    className="mt-0.5"
                  />
                  <span className="text-muted-foreground">
                    Autorizo o uso dos meus dados pela clínica para agendamento e atendimento, conforme a
                    Lei Geral de Proteção de Dados (LGPD).
                  </span>
                </label>

                <Button type="submit" className="w-full" disabled={carregando || !form.lgpd}>
                  {carregando ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CalendarCheck className="h-4 w-4 mr-2" />
                  )}
                  Confirmar agendamento
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  )
}

function Passos({ etapa }: { etapa: Etapa }) {
  const passos: { id: Etapa; label: string }[] = [
    { id: 'profissional', label: 'Profissional' },
    { id: 'horario', label: 'Data e horário' },
    { id: 'dados', label: 'Seus dados' },
  ]
  const atual = passos.findIndex((p) => p.id === etapa)
  return (
    <ol className="flex items-center gap-2 text-xs">
      {passos.map((p, i) => (
        <li key={p.id} className="flex items-center gap-2">
          <span
            className={cn(
              'h-6 w-6 rounded-full flex items-center justify-center font-medium',
              i <= atual ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            )}
          >
            {i + 1}
          </span>
          <span className={cn(i === atual ? 'font-medium' : 'text-muted-foreground', 'hidden sm:inline')}>
            {p.label}
          </span>
          {i < passos.length - 1 && <span className="w-6 h-px bg-border" />}
        </li>
      ))}
    </ol>
  )
}

function Calendario({
  dias,
  selecionado,
  onSelecionar,
}: {
  dias: Record<string, string[]>
  selecionado: string | null
  onSelecionar: (data: string) => void
}) {
  const datas = Object.keys(dias).sort()
  const meses = [...new Set(datas.map((d) => d.slice(0, 7)))]
  const [indiceMes, setIndiceMes] = useState(() =>
    Math.max(0, meses.indexOf((selecionado ?? datas[0]).slice(0, 7)))
  )
  const mes = meses[Math.min(indiceMes, meses.length - 1)]
  const [ano, m] = mes.split('-').map(Number)
  const primeiroDiaSemana = new Date(ano, m - 1, 1).getDay()
  const totalDias = new Date(ano, m, 0).getDate()

  const celulas: (string | null)[] = [
    ...Array<null>(primeiroDiaSemana).fill(null),
    ...Array.from({ length: totalDias }, (_, i) => `${mes}-${String(i + 1).padStart(2, '0')}`),
  ]

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={indiceMes === 0}
            onClick={() => setIndiceMes(indiceMes - 1)}
            aria-label="Mês anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <p className="text-sm font-medium capitalize">
            {format(new Date(ano, m - 1, 1), 'MMMM yyyy', { locale: ptBR })}
          </p>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={indiceMes >= meses.length - 1}
            onClick={() => setIndiceMes(indiceMes + 1)}
            aria-label="Próximo mês"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {DIAS_SEMANA_CURTO.map((d) => (
            <span key={d} className="text-[11px] text-muted-foreground py-1">
              {d}
            </span>
          ))}
          {celulas.map((d, i) => {
            if (!d) return <span key={`v${i}`} />
            const disponivel = !!dias[d]
            return (
              <button
                key={d}
                type="button"
                disabled={!disponivel}
                onClick={() => onSelecionar(d)}
                aria-pressed={selecionado === d}
                aria-label={dataExtenso(d)}
                className={cn(
                  'aspect-square rounded-md text-sm tabular-nums transition-colors',
                  selecionado === d
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : disponivel
                      ? 'bg-teal-50 text-teal-800 hover:bg-teal-100 font-medium dark:bg-teal-900/30 dark:text-teal-200'
                      : 'text-muted-foreground/40 cursor-not-allowed'
                )}
              >
                {Number(d.slice(8))}
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
