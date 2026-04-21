import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar, Users, DollarSign, AlertCircle, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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

  const [{ count: consultasHoje }, { count: totalPacientes }, { data: proximasConsultas }] =
    await Promise.all([
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
        .limit(5),
    ])

  const saudacao = getSaudacao()
  const nomeAbreviado = profile.nome_completo.split(' ')[0]

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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Consultas hoje</CardTitle>
            <Calendar className="h-4 w-4 text-teal-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{consultasHoje ?? 0}</div>
            <p className="text-xs text-slate-400 mt-0.5">agendadas / confirmadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total de pacientes</CardTitle>
            <Users className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{totalPacientes ?? 0}</div>
            <p className="text-xs text-slate-400 mt-0.5">cadastrados ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">A receber</CardTitle>
            <DollarSign className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">—</div>
            <p className="text-xs text-slate-400 mt-0.5">pagamentos pendentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Alertas</CardTitle>
            <AlertCircle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">0</div>
            <p className="text-xs text-slate-400 mt-0.5">pendências</p>
          </CardContent>
        </Card>
      </div>

      {/* Próximas consultas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400" />
            Próximas consultas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!proximasConsultas || proximasConsultas.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">
              Nenhuma consulta agendada nos próximos dias.
            </p>
          ) : (
            <div className="space-y-2">
              {proximasConsultas.map((consulta) => {
                const isHoje = consulta.data === hoje

                return (
                  <div
                    key={consulta.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full shrink-0 bg-teal-400" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">Paciente</p>
                        <p className="text-xs text-slate-400">
                          {isHoje ? 'Hoje' : format(new Date(consulta.data + 'T00:00:00'), 'dd/MM', { locale: ptBR })}{' '}
                          às {consulta.hora_inicio}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
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
