import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Users } from 'lucide-react'
import { ProfissionalForm } from '@/components/profissionais/ProfissionalForm'

export default async function NovoProfissionalPage() {
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

  if (profile?.role !== 'admin') redirect('/dashboard')

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
          <Users className="h-6 w-6 text-slate-400" />
          Novo profissional
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Preencha os dados para criar o acesso ao sistema
        </p>
      </div>

      <ProfissionalForm modo="criar" />
    </div>
  )
}
