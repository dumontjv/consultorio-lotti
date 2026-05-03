import { createClient } from '@/lib/supabase/server'
import { resolverPeriodo } from '@/lib/relatorios/periodo'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RelatoriosFiltros } from '@/components/relatorios/RelatoriosFiltros'
import { BarChart2, Download, Users, CalendarCheck, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{
    tab?: string
    periodo?: string
    profissional?: string
  }>
}

const BRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const STATUS_CORES: Record<string, string> = {
  compareceu: 'bg-green-50 text-green-700 border-green-200',
  faltou: 'bg-red-50 text-red-700 border-red-200',
  cancelada: 'bg-slate-100 text-slate-600 border-slate-200',
  agendada: 'bg-blue-50 text-blue-700 border-blue-200',
  confirmada: 'bg-teal-50 text-teal-700 border-teal-200',
}

const STATUS_LABELS: Record<string, string> = {
  agendada: 'Agendada',
  confirmada: 'Confirmada',
  compareceu: 'Compareceu',
  faltou: 'Faltou',
  cancelada: 'Cancelada',
}

export default async function RelatoriosPage({ searchParams }: PageProps) {
  const params = await searchParams
  const tab = params.tab ?? 'atendimentos'
  const periodo = params.periodo ?? 'ano'
  const profissionalId = params.profissional ?? 'todos'

  const { inicio, fim } = resolverPeriodo(periodo)
  const supabase = await createClient()

  // Profissionais clínicos para o filtro
  const { data: profissionais } = await supabase
    .from('profiles')
    .select('id, nome_completo, role')
    .in('role', ['medica', 'psicologa'])
    .eq('ativo', true)
    .order('nome_completo')

  const profs = profissionais ?? []

  // ── Dados de Atendimentos ─────────────────────────────────────────────────
  let consultasQuery = supabase
    .from('consultas')
    .select('id, data, hora_inicio, status, tipo, profissional_id, profiles!inner(nome_completo)')
    .gte('data', inicio)
    .lte('data', fim)

  if (profissionalId !== 'todos') {
    consultasQuery = consultasQuery.eq('profissional_id', profissionalId)
  }

  const { data: consultasRaw } = await consultasQuery

  const consultas = (consultasRaw ?? []) as unknown as Array<{
    id: string
    data: string
    hora_inicio: string
    status: string
    tipo: string
    profissional_id: string
    profiles: { nome_completo: string }
  }>

  // Agrupar atendimentos por profissional
  const atendimentosPorProf = new Map<string, {
    nome: string
    total: number
    porStatus: Record<string, number>
  }>()

  for (const c of consultas) {
    const nome = c.profiles?.nome_completo ?? 'Desconhecido'
    if (!atendimentosPorProf.has(c.profissional_id)) {
      atendimentosPorProf.set(c.profissional_id, { nome, total: 0, porStatus: {} })
    }
    const entry = atendimentosPorProf.get(c.profissional_id)!
    entry.total++
    entry.porStatus[c.status] = (entry.porStatus[c.status] ?? 0) + 1
  }

  const totalConsultas = consultas.length
  const totalCompareceu = consultas.filter((c) => c.status === 'compareceu').length
  const totalFaltou = consultas.filter((c) => c.status === 'faltou').length
  const totalCancelada = consultas.filter((c) => c.status === 'cancelada').length
  const taxaPresenca = totalConsultas > 0
    ? Math.round((totalCompareceu / totalConsultas) * 100)
    : 0

  // ── Dados de Pacientes ────────────────────────────────────────────────────
  const [{ data: novosPac }, { count: totalAtivos }] = await Promise.all([
    supabase
      .from('pacientes')
      .select('id, nome_completo, created_at')
      .gte('created_at', `${inicio}T00:00:00`)
      .lte('created_at', `${fim}T23:59:59`)
      .is('deleted_at', null)
      .order('created_at'),
    supabase
      .from('pacientes')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null),
  ])

  const novosPorMes = new Map<string, number>()
  for (const p of (novosPac ?? [])) {
    const mes = p.created_at.substring(0, 7)
    novosPorMes.set(mes, (novosPorMes.get(mes) ?? 0) + 1)
  }
  const mesesOrdenados = [...novosPorMes.entries()].sort(([a], [b]) => a.localeCompare(b))

  // ── Dados Financeiros ─────────────────────────────────────────────────────
  let finQuery = supabase
    .from('financeiro')
    .select('id, valor, status, profissional_id, profiles!inner(nome_completo)')
    .gte('data_vencimento', inicio)
    .lte('data_vencimento', fim)

  if (profissionalId !== 'todos') {
    finQuery = finQuery.eq('profissional_id', profissionalId)
  }

  const { data: finRaw } = await finQuery
  const lancamentos = (finRaw ?? []) as unknown as Array<{
    id: string
    valor: number
    status: string
    profissional_id: string
    profiles: { nome_completo: string }
  }>

  const finPorProf = new Map<string, { nome: string; pago: number; pendente: number }>()
  let totalPago = 0
  let totalPendente = 0

  for (const l of lancamentos) {
    const nome = l.profiles?.nome_completo ?? 'Desconhecido'
    if (!finPorProf.has(l.profissional_id)) {
      finPorProf.set(l.profissional_id, { nome, pago: 0, pendente: 0 })
    }
    const entry = finPorProf.get(l.profissional_id)!
    if (l.status === 'pago') { entry.pago += l.valor; totalPago += l.valor }
    else if (l.status === 'pendente') { entry.pendente += l.valor; totalPendente += l.valor }
  }

  // ── URL helpers ───────────────────────────────────────────────────────────
  const csvParams = `?periodo=${periodo}${profissionalId !== 'todos' ? `&profissional=${profissionalId}` : ''}`

  const labelPeriodo = {
    '1m': 'este mês', mes_passado: 'mês passado', '3m': 'últimos 3 meses',
    '6m': 'últimos 6 meses', ano: 'este ano', ano_passado: 'ano passado',
  }[periodo] ?? periodo

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-muted-foreground" />
            Relatórios
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Período: <span className="font-medium">{labelPeriodo}</span>
            {' · '}{inicio} até {fim}
          </p>
        </div>
        <RelatoriosFiltros
          profissionais={profs}
          periodoAtual={periodo}
          profissionalAtual={profissionalId}
          mostrarProfissional={tab !== 'pacientes'}
        />
      </div>

      {/* Tabs nav */}
      {(() => {
        const tabs = [
          { value: 'atendimentos', label: 'Atendimentos', icon: CalendarCheck },
          { value: 'pacientes', label: 'Pacientes', icon: Users },
          { value: 'financeiro', label: 'Financeiro', icon: DollarSign },
        ]
        return (
          <div className="flex gap-1 border-b">
            {tabs.map(({ value, label, icon: Icon }) => (
              <a
                key={value}
                href={`/relatorios?tab=${value}&periodo=${periodo}&profissional=${profissionalId}`}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                  tab === value
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </a>
            ))}
          </div>
        )
      })()}

      <div className="space-y-4">

        {/* ── ABA: ATENDIMENTOS ── */}
        {tab === 'atendimentos' && (<div className="space-y-4">
          {/* Resumo */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total', value: totalConsultas, cor: '' },
              { label: 'Compareceram', value: totalCompareceu, cor: 'text-green-600' },
              { label: 'Faltaram', value: totalFaltou, cor: 'text-red-600' },
              { label: 'Canceladas', value: totalCancelada, cor: 'text-slate-500' },
            ].map((card) => (
              <Card key={card.label}>
                <CardContent className="pt-4 pb-3">
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p className={`text-2xl font-bold mt-0.5 ${card.cor}`}>{card.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalConsultas > 0 && (
            <p className="text-sm text-muted-foreground">
              Taxa de comparecimento:{' '}
              <span className={`font-semibold ${taxaPresenca >= 80 ? 'text-green-600' : 'text-amber-600'}`}>
                {taxaPresenca}%
              </span>
            </p>
          )}

          {/* Tabela por profissional */}
          {atendimentosPorProf.size > 0 ? (
            <Card>
              <CardHeader className="pb-3 flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold">Por profissional</CardTitle>
                <a
                  href={`/api/relatorios/atendimentos${csvParams}`}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Exportar CSV
                </a>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground">Profissional</th>
                      <th className="text-center px-3 py-2 font-medium text-muted-foreground">Total</th>
                      {['compareceu', 'faltou', 'cancelada', 'agendada', 'confirmada'].map((s) => (
                        <th key={s} className="text-center px-3 py-2 font-medium text-muted-foreground hidden sm:table-cell">
                          {STATUS_LABELS[s]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[...atendimentosPorProf.values()].map((p) => (
                      <tr key={p.nome} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-2.5 font-medium">{p.nome}</td>
                        <td className="px-3 py-2.5 text-center font-semibold">{p.total}</td>
                        {['compareceu', 'faltou', 'cancelada', 'agendada', 'confirmada'].map((s) => (
                          <td key={s} className="px-3 py-2.5 text-center hidden sm:table-cell">
                            {p.porStatus[s] ? (
                              <Badge variant="outline" className={`text-xs ${STATUS_CORES[s] ?? ''}`}>
                                {p.porStatus[s]}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Nenhum atendimento no período.
            </p>
          )}
        </div>)}

        {/* ── ABA: PACIENTES ── */}
        {tab === 'pacientes' && (<div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Novos no período</p>
                <p className="text-2xl font-bold mt-0.5 text-teal-600">{novosPac?.length ?? 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Total de ativos</p>
                <p className="text-2xl font-bold mt-0.5">{totalAtivos ?? 0}</p>
              </CardContent>
            </Card>
          </div>

          {mesesOrdenados.length > 0 ? (
            <Card>
              <CardHeader className="pb-3 flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold">Novos cadastros por mês</CardTitle>
                <a
                  href={`/api/relatorios/pacientes${csvParams}`}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Exportar CSV
                </a>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground">Mês</th>
                      <th className="text-center px-4 py-2 font-medium text-muted-foreground">Novos pacientes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {mesesOrdenados.map(([mes, qtd]) => {
                      const label = format(new Date(mes + '-01'), "MMMM 'de' yyyy", { locale: ptBR })
                      const labelCap = label.charAt(0).toUpperCase() + label.slice(1)
                      return (
                        <tr key={mes} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-2.5">{labelCap}</td>
                          <td className="px-4 py-2.5 text-center font-semibold">{qtd}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Nenhum paciente novo no período.
            </p>
          )}
        </div>)}

        {/* ── ABA: FINANCEIRO ── */}
        {tab === 'financeiro' && (<div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Recebido</p>
                <p className="text-xl font-bold mt-0.5 text-green-600">{BRL(totalPago)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Pendente</p>
                <p className="text-xl font-bold mt-0.5 text-amber-600">{BRL(totalPendente)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Total (pago + pendente)</p>
                <p className="text-xl font-bold mt-0.5">{BRL(totalPago + totalPendente)}</p>
              </CardContent>
            </Card>
          </div>

          {finPorProf.size > 0 ? (
            <Card>
              <CardHeader className="pb-3 flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold">Por profissional</CardTitle>
                <a
                  href={`/api/relatorios/financeiro${csvParams}`}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Exportar CSV
                </a>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground">Profissional</th>
                      <th className="text-right px-4 py-2 font-medium text-muted-foreground">Recebido</th>
                      <th className="text-right px-4 py-2 font-medium text-muted-foreground">Pendente</th>
                      <th className="text-right px-4 py-2 font-medium text-muted-foreground">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[...finPorProf.values()].map((p) => (
                      <tr key={p.nome} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-2.5 font-medium">{p.nome}</td>
                        <td className="px-4 py-2.5 text-right text-green-600 font-medium">{BRL(p.pago)}</td>
                        <td className="px-4 py-2.5 text-right text-amber-600">{BRL(p.pendente)}</td>
                        <td className="px-4 py-2.5 text-right font-semibold">{BRL(p.pago + p.pendente)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Nenhum lançamento no período.
            </p>
          )}
        </div>)}

      </div>
    </div>
  )
}
