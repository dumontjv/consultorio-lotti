import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronRight, ClipboardList } from 'lucide-react'
import { AnamneseForm } from '@/components/anamnese/AnamneseForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AnamnesePacientePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: paciente } = await supabase
    .from('pacientes')
    .select('id, nome_completo, genero')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (!paciente) notFound()

  const { data: anamnese } = await supabase
    .from('anamnese')
    .select('*')
    .eq('paciente_id', id)
    .single()

  const { data: atualizador } = anamnese?.atualizado_por
    ? await supabase
        .from('profiles')
        .select('nome_completo')
        .eq('id', anamnese.atualizado_por)
        .single()
    : { data: null }

  return (
    <div className="space-y-5 max-w-3xl">
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
        <span className="text-slate-600">Anamnese</span>
      </nav>

      <div>
        <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-slate-400" />
          Anamnese
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {paciente.nome_completo}
          {anamnese?.updated_at && atualizador && (
            <span className="ml-2 text-slate-400">
              — Atualizada em{' '}
              {format(new Date(anamnese.updated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })} por{' '}
              {atualizador.nome_completo}
            </span>
          )}
        </p>
      </div>

      <AnamneseForm
        pacienteId={id}
        genero={paciente.genero}
        anamnese={anamnese}
      />
    </div>
  )
}
