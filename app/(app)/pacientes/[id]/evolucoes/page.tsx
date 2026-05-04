import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronRight, FileText, Plus, Stethoscope } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EvolucoesPacientePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role === 'secretaria') redirect(`/pacientes/${id}`)

  const { data: paciente } = await supabase
    .from('pacientes')
    .select('id, nome_completo')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (!paciente) notFound()

  const { data: evolucoes } = await supabase
    .from('evolucoes')
    .select('id, data, conteudo, hipotese_diagnostica, conduta, cids, profissional_id')
    .eq('paciente_id', id)
    .is('deleted_at', null)
    .order('data', { ascending: false })

  const { data: profissionais } = await supabase
    .from('profiles')
    .select('id, nome_completo, role')
    .in('role', ['medica', 'psicologa'])

  const profMap = new Map((profissionais ?? []).map((p) => [p.id, p]))

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-400">
        <Link href="/pacientes" className="hover:text-slate-600 transition-colors">
          Pacientes
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/pacientes/${id}`} className="hover:text-slate-600 transition-colors">
          {paciente.nome_completo}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-slate-600">Evoluções</span>
      </nav>

      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-slate-400" />
            Evoluções Clínicas
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {paciente.nome_completo} — {evolucoes?.length ?? 0} evolução
            {(evolucoes?.length ?? 0) !== 1 ? 'ões' : ''}
          </p>
        </div>
        <Link
          href={`/pacientes/${id}/evolucoes/nova`}
          className={cn(buttonVariants())}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Nova evolução
        </Link>
      </div>

      {/* Lista */}
      {!evolucoes || evolucoes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="h-12 w-12 text-slate-200 mb-3" />
          <p className="text-slate-500 font-medium">Nenhuma evolução registrada</p>
          <Link
            href={`/pacientes/${id}/evolucoes/nova`}
            className={cn(buttonVariants({ variant: 'outline' }), 'mt-4')}
          >
            Registrar primeira evolução
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {evolucoes.map((ev) => {
            const prof = profMap.get(ev.profissional_id)
            return (
              <Link key={ev.id} href={`/pacientes/${id}/evolucoes/${ev.id}`}>
                <Card className="hover:shadow-sm transition-shadow cursor-pointer">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-slate-900">
                            {format(new Date(ev.data), "dd 'de' MMMM 'de' yyyy, HH:mm", {
                              locale: ptBR,
                            })}
                          </p>
                          {prof && (
                            <Badge
                              className={cn(
                                'text-xs',
                                prof.role === 'medica'
                                  ? 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-50'
                                  : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-50'
                              )}
                            >
                              {prof.nome_completo}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-2">{ev.conteudo}</p>
                        {ev.hipotese_diagnostica && (
                          <p className="text-xs text-slate-400 mt-1">
                            Hipótese: {ev.hipotese_diagnostica}
                          </p>
                        )}
                        {ev.cids && ev.cids.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {ev.cids.map((cid) => (
                              <Badge key={cid} variant="secondary" className="text-xs font-mono">
                                {cid}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
