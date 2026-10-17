import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Users } from 'lucide-react'
import { ProfissionalForm } from '@/components/profissionais/ProfissionalForm'
import type { Profile } from '@/types/domain'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditarProfissionalPage({ params }: PageProps) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (currentProfile?.role !== 'admin') redirect('/dashboard')

  const { id } = await params

  const { data: profissional } = await supabase
    .from('profiles')
    .select('id, nome_completo, email, role, crm, crp, telefone, foto_url, ativo, created_at, updated_at')
    .eq('id', id)
    .single()

  if (!profissional) notFound()

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
          <Users className="h-6 w-6 text-slate-400" />
          Editar profissional
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">{profissional.nome_completo}</p>
      </div>

      <ProfissionalForm modo="editar" profissional={profissional as Profile} />
    </div>
  )
}
