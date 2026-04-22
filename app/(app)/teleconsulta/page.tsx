import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Video, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

export default async function TeleconsultaPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const hoje = format(new Date(), 'yyyy-MM-dd')

  // Teleconsultas de hoje e futuras
  const { data: consultas } = await supabase
    .from('consultas')
    .select('id, data, hora_inicio, hora_fim, status, link_teleconsulta, paciente_id, profissional_id')
    .eq('tipo', 'teleconsulta')
    .gte('data', hoje)
    .in('status', ['agendada', 'confirmada'])
    .order('data', { ascending: true })
    .order('hora_inicio', { ascending: true })
    .limit(20)

  const pacIds = [...new Set((consultas ?? []).map((c) => c.paciente_id))]
  const profIds = [...new Set((consultas ?? []).map((c) => c.profissional_id))]

  const [{ data: pacientes }, { data: profissionais }] = await Promise.all([
    pacIds.length > 0
      ? supabase.from('pacientes').select('id, nome_completo, email').in('id', pacIds)
      : Promise.resolve({ data: [] }),
    profIds.length > 0
      ? supabase.from('profiles').select('id, nome_completo, role').in('id', profIds)
      : Promise.resolve({ data: [] }),
  ])

  const pacMap = new Map((pacientes ?? []).map((p) => [p.id, p]))
  const profMap = new Map((profissionais ?? []).map((p) => [p.id, p]))

  const STATUS_LABELS: Record<string, string> = {
    agendada: 'Agendada',
    confirmada: 'Confirmada',
  }

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
          <Video className="h-6 w-6 text-slate-400" />
          Teleconsulta
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Consultas online agendadas a partir de hoje
        </p>
      </div>

      {!consultas || consultas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Video className="h-12 w-12 text-slate-200 mb-3" />
          <p className="text-slate-500 font-medium">Nenhuma teleconsulta agendada</p>
          <Link
            href="/agenda"
            className={cn(buttonVariants({ variant: 'outline' }), 'mt-4')}
          >
            Ir para a agenda
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {consultas.map((c) => {
            const pac = pacMap.get(c.paciente_id)
            const prof = profMap.get(c.profissional_id)
            const isHoje = c.data === hoje
            return (
              <Card key={c.id}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                        <Video className="h-4 w-4 text-indigo-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">
                          {pac?.nome_completo ?? 'Paciente'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <span className={isHoje ? 'text-teal-600 font-medium' : ''}>
                            {isHoje
                              ? 'Hoje'
                              : format(new Date(c.data + 'T00:00:00'), 'dd/MM', { locale: ptBR })}
                            {' às '}
                            {c.hora_inicio}
                          </span>
                          {prof && <span>— {prof.nome_completo}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant="outline"
                        className={
                          c.status === 'confirmada'
                            ? 'border-teal-200 text-teal-700 bg-teal-50'
                            : 'border-slate-200 text-slate-600'
                        }
                      >
                        {STATUS_LABELS[c.status] ?? c.status}
                      </Badge>
                      {c.link_teleconsulta && (
                        <a
                          href={c.link_teleconsulta}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Entrar
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
