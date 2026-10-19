import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ChevronRight } from 'lucide-react'
import { PacienteForm } from '@/components/pacientes/PacienteForm'
import { carregarConvenios } from '@/lib/convenios/servidor'
import type { Paciente } from '@/types/domain'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditarPacientePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: paciente } = await supabase
    .from('pacientes')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (!paciente) notFound()

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-400 flex-wrap">
        <Link href="/pacientes" className="hover:text-slate-600 transition-colors">
          Pacientes
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/pacientes/${id}`} className="hover:text-slate-600 transition-colors truncate max-w-[150px]">
          {paciente.nome_completo}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-slate-600">Editar</span>
      </nav>

      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Editar paciente</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Atualize os dados de {paciente.nome_completo}.
        </p>
      </div>

      <PacienteForm paciente={paciente as Paciente} modo="editar" convenios={await carregarConvenios(supabase)} />
    </div>
  )
}
