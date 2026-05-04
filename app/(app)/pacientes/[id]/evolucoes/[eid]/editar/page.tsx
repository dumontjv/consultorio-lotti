import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ChevronRight, Stethoscope } from 'lucide-react'
import { EvolucaoForm } from '@/components/evolucoes/EvolucaoForm'

interface PageProps {
  params: Promise<{ id: string; eid: string }>
}

export default async function EditarEvolucaoPage({ params }: PageProps) {
  const { id, eid } = await params
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

  const { data: evolucao } = await supabase
    .from('evolucoes')
    .select('*')
    .eq('id', eid)
    .eq('paciente_id', id)
    .is('deleted_at', null)
    .single()

  if (!evolucao) notFound()

  const { data: profissionais } = await supabase
    .from('profiles')
    .select('id, nome_completo, role')
    .in('role', ['medica', 'psicologa'])
    .eq('ativo', true)
    .order('nome_completo')

  return (
    <div className="space-y-5 max-w-3xl">
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
        <Link href={`/pacientes/${id}/evolucoes/${eid}`} className="hover:text-slate-600 transition-colors">
          Evolução
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-slate-600">Editar</span>
      </nav>

      <div>
        <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
          <Stethoscope className="h-6 w-6 text-slate-400" />
          Editar Evolução
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">{paciente.nome_completo}</p>
      </div>

      <EvolucaoForm
        pacienteId={id}
        profissionais={profissionais ?? []}
        evolucao={{
          id: evolucao.id,
          profissional_id: evolucao.profissional_id,
          conteudo: evolucao.conteudo,
          hipotese_diagnostica: evolucao.hipotese_diagnostica,
          conduta: evolucao.conduta,
          cids: evolucao.cids,
          sinais_vitais: evolucao.sinais_vitais,
          exame_fisico: evolucao.exame_fisico,
        }}
      />
    </div>
  )
}
