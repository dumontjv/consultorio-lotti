import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronRight, Pencil, Stethoscope } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface PageProps {
  params: Promise<{ id: string; eid: string }>
}

export default async function EvolucaoDetalhePage({ params }: PageProps) {
  const { id, eid } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: paciente } = await supabase
    .from('pacientes')
    .select('id, nome_completo')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (!paciente) notFound()

  const { data: ev } = await supabase
    .from('evolucoes')
    .select('*')
    .eq('id', eid)
    .eq('paciente_id', id)
    .single()

  if (!ev) notFound()

  const { data: prof } = await supabase
    .from('profiles')
    .select('nome_completo, role')
    .eq('id', ev.profissional_id)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sinais = ev.sinais_vitais as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const exame = ev.exame_fisico as any

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-400 flex-wrap">
        <Link href="/pacientes" className="hover:text-slate-600 transition-colors">
          Pacientes
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/pacientes/${id}`} className="hover:text-slate-600 transition-colors">
          {paciente.nome_completo}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/pacientes/${id}/evolucoes`} className="hover:text-slate-600 transition-colors">
          Evoluções
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-slate-600">
          {format(new Date(ev.data), 'dd/MM/yyyy', { locale: ptBR })}
        </span>
      </nav>

      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-slate-400" />
            Evolução Clínica
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {format(new Date(ev.data), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
            {prof && (
              <span className="ml-2">
                — {prof.nome_completo}{' '}
                <Badge
                  className={cn(
                    'text-xs ml-1',
                    prof.role === 'medica'
                      ? 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-50'
                      : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-50'
                  )}
                >
                  {prof.role === 'medica' ? 'Médica' : 'Psicóloga'}
                </Badge>
              </span>
            )}
          </p>
        </div>
        <Link
          href={`/pacientes/${id}/evolucoes/${eid}/editar`}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
        >
          <Pencil className="h-4 w-4 mr-1.5" />
          Editar
        </Link>
      </div>

      <div className="space-y-4">
        {/* Descrição */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Evolução / Anamnese</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-800 whitespace-pre-wrap">{ev.conteudo}</p>
          </CardContent>
        </Card>

        {/* Sinais vitais */}
        {sinais && Object.values(sinais).some(Boolean) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-500">Sinais Vitais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                {sinais.pa_sistolica && sinais.pa_diastolica && (
                  <div>
                    <p className="text-xs text-slate-400">Pressão Arterial</p>
                    <p className="font-medium text-slate-800">
                      {sinais.pa_sistolica}/{sinais.pa_diastolica} mmHg
                    </p>
                  </div>
                )}
                {sinais.fc && (
                  <div>
                    <p className="text-xs text-slate-400">FC</p>
                    <p className="font-medium text-slate-800">{sinais.fc} bpm</p>
                  </div>
                )}
                {sinais.temperatura && (
                  <div>
                    <p className="text-xs text-slate-400">Temperatura</p>
                    <p className="font-medium text-slate-800">{sinais.temperatura} °C</p>
                  </div>
                )}
                {sinais.spo2 && (
                  <div>
                    <p className="text-xs text-slate-400">SpO₂</p>
                    <p className="font-medium text-slate-800">{sinais.spo2}%</p>
                  </div>
                )}
                {sinais.peso && (
                  <div>
                    <p className="text-xs text-slate-400">Peso</p>
                    <p className="font-medium text-slate-800">{sinais.peso} kg</p>
                  </div>
                )}
                {sinais.altura && (
                  <div>
                    <p className="text-xs text-slate-400">Altura</p>
                    <p className="font-medium text-slate-800">{sinais.altura} cm</p>
                  </div>
                )}
                {sinais.glicemia && (
                  <div>
                    <p className="text-xs text-slate-400">Glicemia</p>
                    <p className="font-medium text-slate-800">{sinais.glicemia} mg/dL</p>
                  </div>
                )}
                {sinais.dor_escala != null && (
                  <div>
                    <p className="text-xs text-slate-400">Dor (EVA)</p>
                    <p className="font-medium text-slate-800">{sinais.dor_escala}/10</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Exame físico */}
        {exame && Object.values(exame).some(Boolean) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-500">Exame Físico</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[
                ['Geral', exame.geral],
                ['Cabeça e Pescoço', exame.cabeca_pescoco],
                ['Tórax', exame.torax],
                ['Abdome', exame.abdome],
                ['Membros', exame.membros],
                ['Neurológico', exame.neurologico],
                ['Pele', exame.pele],
                ['Outros', exame.outros],
              ]
                .filter(([, v]) => v)
                .map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs text-slate-400">{label}</p>
                    <p className="text-slate-700">{value}</p>
                  </div>
                ))}
            </CardContent>
          </Card>
        )}

        {/* Hipótese diagnóstica e CIDs */}
        {(ev.hipotese_diagnostica || (ev.cids && ev.cids.length > 0)) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-500">Hipótese Diagnóstica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ev.hipotese_diagnostica && (
                <p className="text-sm text-slate-800">{ev.hipotese_diagnostica}</p>
              )}
              {ev.cids && ev.cids.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {ev.cids.map((cid: string) => (
                    <Badge key={cid} variant="secondary" className="text-xs font-mono">
                      {cid}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Conduta */}
        {ev.conduta && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-500">Conduta</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-800 whitespace-pre-wrap">{ev.conduta}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
