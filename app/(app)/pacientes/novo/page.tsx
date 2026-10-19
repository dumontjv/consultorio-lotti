import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { PacienteForm } from '@/components/pacientes/PacienteForm'
import { carregarConvenios } from '@/lib/convenios/servidor'

export default async function NovoPacientePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-400">
        <Link href="/pacientes" className="hover:text-slate-600 transition-colors">
          Pacientes
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-slate-600">Novo paciente</span>
      </nav>

      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Cadastrar paciente</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Preencha os dados do paciente. Campos com <span className="text-destructive">*</span> são obrigatórios.
        </p>
      </div>

      <PacienteForm modo="criar" convenios={await carregarConvenios(supabase)} />
    </div>
  )
}
