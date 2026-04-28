import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { BarChart2, TrendingUp, Clock, Users, CalendarCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GraficoReceita, type DadosMes } from '@/components/relatorios/GraficoReceita'

const FORMA_LABELS: Record<string, string> = {
  dinheiro: 'Dinheiro',
  credito: 'Cartão de Crédito',
  debito: 'Cartão de Débito',
  pix: 'Pix',
  transferencia: 'Transferência',
  convenio: 'Convênio',
  boleto: 'Boleto',
}

function formatarReais(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default async function RelatoriosPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const hoje = new Date()
  const inicioMesAtual = format(startOfMonth(hoje), 'yyyy-MM-dd')
  const fimMesAtual = format(endOfMonth(hoje), 'yyyy-MM-dd')

  // Últimos 6 meses para o gráfico
  const inicio6Meses = format(startOfMonth(subMonths(hoje, 5)), 'yyyy-MM-dd')

  // Dados financeiros dos últimos 6 meses
  const { data: financeiroRaw } = await supabase
    .from('financeiro')
    .select('valor, status, data_vencimento, forma_pagamento, profissional_id')
    .gte('data_vencimento', inicio6Meses)
    .lte('data_vencimento', fimMesAtual)
    .order('data_vencimento')

  const financeiro = financeiroRaw ?? []

  // Agrupa por mês para o gráfico
  const mesesMap = new Map<string, DadosMes>()
  for (let i = 5; i >= 0; i--) {
    const d = subMonths(hoje, i)
    const key = format(d, 'yyyy-MM')
    mesesMap.set(key, {
      mes: format(d, 'MMM/yy', { locale: ptBR }),
      recebido: 0,
      pendente: 0,
    })
  }

  for (const f of financeiro) {
    const venc = f.data_vencimento
    if (!venc) continue
    const key = venc.slice(0, 7)
    const entry = mesesMap.get(key)
    if (!entry) continue
    if (f.status === 'pago') entry.recebido += f.valor ?? 0
    else if (f.status === 'pendente') entry.pendente += f.valor ?? 0
  }

  const dadosMensais = Array.from(mesesMap.values())

  // Resumo do mês atual
  const financeiroMes = financeiro.filter(
    (f) => f.data_vencimento != null && f.data_vencimento >= inicioMesAtual && f.data_vencimento <= fimMesAtual
  )
  const recebidoMes = financeiroMes
    .filter((f) => f.status === 'pago')
    .reduce((s, f) => s + (f.valor ?? 0), 0)
  const pendenteMes = financeiroMes
    .filter((f) => f.status === 'pendente')
    .reduce((s, f) => s + (f.valor ?? 0), 0)

  // Receita por forma de pagamento (mês atual, apenas pagos)
  const porForma = new Map<string, number>()
  for (const f of financeiroMes.filter((f) => f.status === 'pago')) {
    const k = f.forma_pagamento ?? 'outro'
    porForma.set(k, (porForma.get(k) ?? 0) + (f.valor ?? 0))
  }
  const porFormaOrdenado = Array.from(porForma.entries())
    .sort((a, b) => b[1] - a[1])

  // Consultas do mês
  const { data: consultasMes } = await supabase
    .from('consultas')
    .select('id, profissional_id, status')
    .gte('data', inicioMesAtual)
    .lte('data', fimMesAtual)

  const totalConsultasMes = consultasMes?.length ?? 0
  const compareceuMes = (consultasMes ?? []).filter((c) => c.status === 'compareceu').length
  const taxaComparecimento =
    totalConsultasMes > 0 ? Math.round((compareceuMes / totalConsultasMes) * 100) : 0

  // Consultas por profissional no mês
  const { data: profissionais } = await supabase
    .from('profiles')
    .select('id, nome_completo, role')
    .in('role', ['medica', 'psicologa'])
    .eq('ativo', true)

  const consultasPorProf = (profissionais ?? []).map((p) => {
    const count = (consultasMes ?? []).filter((c) => c.profissional_id === p.id).length
    return { ...p, count }
  }).sort((a, b) => b.count - a.count)

  // Novos pacientes no mês
  const { count: novosPacientesMes } = await supabase
    .from('pacientes')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', inicioMesAtual + 'T00:00:00')
    .lte('created_at', fimMesAtual + 'T23:59:59')
    .is('deleted_at', null)

  const mesAtualLabel = format(hoje, "MMMM 'de' yyyy", { locale: ptBR })

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
          <BarChart2 className="h-6 w-6 text-slate-400" />
          Relatórios
        </h1>
        <p className="text-sm text-slate-500 mt-0.5 capitalize">{mesAtualLabel}</p>
      </div>

      {/* Cards resumo do mês */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-teal-600 mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium">Recebido no mês</span>
            </div>
            <p className="text-xl font-bold text-slate-900">{formatarReais(recebidoMes)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-amber-600 mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium">Pendente no mês</span>
            </div>
            <p className="text-xl font-bold text-slate-900">{formatarReais(pendenteMes)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-indigo-600 mb-1">
              <CalendarCheck className="h-4 w-4" />
              <span className="text-xs font-medium">Consultas no mês</span>
            </div>
            <p className="text-xl font-bold text-slate-900">{totalConsultasMes}</p>
            {totalConsultasMes > 0 && (
              <p className="text-xs text-slate-400 mt-0.5">{taxaComparecimento}% comparecimento</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-slate-600 mb-1">
              <Users className="h-4 w-4" />
              <span className="text-xs font-medium">Novos pacientes</span>
            </div>
            <p className="text-xl font-bold text-slate-900">{novosPacientesMes ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de receita */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Receita — últimos 6 meses</CardTitle>
        </CardHeader>
        <CardContent>
          <GraficoReceita dados={dadosMensais} />
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Consultas por profissional */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Consultas por profissional</CardTitle>
            <p className="text-xs text-slate-400">Este mês</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {consultasPorProf.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">Sem dados</p>
            ) : (
              consultasPorProf.map((p) => {
                const pct =
                  totalConsultasMes > 0
                    ? Math.round((p.count / totalConsultasMes) * 100)
                    : 0
                return (
                  <div key={p.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-700">
                          {p.nome_completo}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            p.role === 'medica'
                              ? 'border-teal-200 text-teal-700 bg-teal-50'
                              : 'border-indigo-200 text-indigo-700 bg-indigo-50'
                          }`}
                        >
                          {p.role === 'medica' ? 'Médica' : 'Psicóloga'}
                        </Badge>
                      </div>
                      <span className="text-sm font-semibold text-slate-900">{p.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          p.role === 'medica' ? 'bg-teal-400' : 'bg-indigo-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Receita por forma de pagamento */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Receita por forma de pagamento</CardTitle>
            <p className="text-xs text-slate-400">Pagamentos recebidos este mês</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {porFormaOrdenado.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">Nenhum pagamento registrado</p>
            ) : (
              porFormaOrdenado.map(([forma, valor]) => {
                const pct = recebidoMes > 0 ? Math.round((valor / recebidoMes) * 100) : 0
                return (
                  <div key={forma}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-700">
                        {FORMA_LABELS[forma] ?? forma}
                      </span>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-slate-900">
                          {formatarReais(valor)}
                        </span>
                        <span className="text-xs text-slate-400 ml-1.5">{pct}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-teal-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
