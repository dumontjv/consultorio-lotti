import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar, Users, DollarSign, Clock, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('nome_completo, role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const hoje = format(new Date(), 'yyyy-MM-dd')
  const inicioMes = format(new Date(), 'yyyy-MM-01')
  const fimMes = format(
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
    'yyyy-MM-dd'
  )

  const [
    { count: consultasHoje },
    { count: totalPacientes },
    { data: proximasConsultasRaw },
    { data: financeiroMes },
  ] = await Promise.all([
    supabase
      .from('consultas')
      .select('*', { count: 'exact', head: true })
      .eq('data', hoje)
      .in('status', ['agendada', 'confirmada']),
    supabase
      .from('pacientes')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null),
    supabase
      .from('consultas')
      .select('id, data, hora_inicio, hora_fim, status, tipo, paciente_id, profissional_id')
      .gte('data', hoje)
      .in('status', ['agendada', 'confirmada'])
      .order('data', { ascending: true })
      .order('hora_inicio', { ascending: true })
      .limit(8),
    supabase
      .from('financeiro')
      .select('valor, status')
      .gte('data_vencimento', inicioMes)
      .lte('data_vencimento', fimMes),
  ])

  // Busca nomes dos pacientes e profissionais para as próximas consultas
  const pacIds = [...new Set((proximasConsultasRaw ?? []).map((c) => c.paciente_id))]
  const profIds = [...new Set((proximasConsultasRaw ?? []).map((c) => c.profissional_id))]

  const [{ data: pacientes }, { data: profissionais }] = await Promise.all([
    pacIds.length > 0
      ? supabase.from('pacientes').select('id, nome_completo').in('id', pacIds)
      : Promise.resolve({ data: [] }),
    profIds.length > 0
      ? supabase.from('profiles').select('id, nome_completo, role').in('id', profIds)
      : Promise.resolve({ data: [] }),
  ])

  const pacMap = new Map((pacientes ?? []).map((p) => [p.id, p]))
  const profMap = new Map((profissionais ?? []).map((p) => [p.id, p]))

  // Cálculos financeiros
  const aReceber = (financeiroMes ?? [])
    .filter((f) => f.status === 'pendente')
    .reduce((s, f) => s + (f.valor ?? 0), 0)
  const recebidoMes = (financeiroMes ?? [])
    .filter((f) => f.status === 'pago')
    .reduce((s, f) => s + (f.valor ?? 0), 0)

  const saudacao = getSaudacao()
  const nomeAbreviado = profile.nome_completo.split(' ')[0]

  function formatMoeda(v: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          {saudacao}, {nomeAbreviado}!
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/agenda" className="block">
          <Card className="hover:shadow-sm transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Consultas hoje</CardTitle>
              <Calendar className="h-4 w-4 text-teal-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{consultasHoje ?? 0}</div>
              <p className="text-xs text-slate-400 mt-0.5">agendadas / confirmadas</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/pacientes" className="block">
          <Card className="hover:shadow-sm transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Pacientes ativos</CardTitle>
              <Users className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{totalPacientes ?? 0}</div>
              <p className="text-xs text-slate-400 mt-0.5">cadastrados</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/financeiro" className="block">
          <Card className="hover:shadow-sm transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">A receber</CardTitle>
              <DollarSign className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-700">{formatMoeda(aReceber)}</div>
              <p className="text-xs text-slate-400 mt-0.5">pendente este mês</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/financeiro" className="block">
          <Card className="hover:shadow-sm transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Recebido</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{formatMoeda(recebidoMes)}</div>
              <p className="text-xs text-slate-400 mt-0.5">neste mês</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Próximas consultas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400" />
            Próximas consultas
          </CardTitle>
          <Link
            href="/agenda"
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'text-xs text-slate-500')}
          >
            Ver agenda
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Link>
        </CardHeader>
        <CardContent>
          {!proximasConsultasRaw || proximasConsultasRaw.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">
              Nenhuma consulta agendada nos próximos dias.
            </p>
          ) : (
            <div className="divide-y divide-slate-50">
              {proximasConsultasRaw.map((consulta) => {
                const isHoje = consulta.data === hoje
                const pac = pacMap.get(consulta.paciente_id)
                const prof = profMap.get(consulta.profissional_id)

                return (
                  <div
                    key={consulta.id}
                    className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          'w-2 h-2 rounded-full shrink-0',
                          prof?.role === 'medica' ? 'bg-teal-400' : 'bg-indigo-400'
                        )}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {pac?.nome_completo ?? 'Paciente'}
                        </p>
                        <p className="text-xs text-slate-400">
                          <span className={isHoje ? 'text-teal-600 font-medium' : ''}>
                            {isHoje
                              ? 'Hoje'
                              : format(new Date(consulta.data + 'T00:00:00'), "d 'de' MMM", {
                                  locale: ptBR,
                                })}
                          </span>
                          {' às '}
                          {consulta.hora_inicio}
                          {prof && <span className="ml-1">— {prof.nome_completo}</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      {consulta.tipo === 'teleconsulta' && (
                        <Badge variant="secondary" className="text-xs">
                          Online
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className={
                          consulta.status === 'confirmada'
                            ? 'border-teal-200 text-teal-700 bg-teal-50'
                            : 'border-slate-200 text-slate-600'
                        }
                      >
                        {consulta.status === 'confirmada' ? 'Confirmada' : 'Agendada'}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function getSaudacao(): string {
  const hora = new Date().getHours()
  if (hora < 12) return 'Bom dia'
  if (hora < 18) return 'Boa tarde'
  return 'Boa noite'
}
