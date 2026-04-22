import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { User } from 'lucide-react'
import { PerfilForm } from '@/components/configuracoes/PerfilForm'

export default async function PerfilPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
          <User className="h-6 w-6 text-slate-400" />
          Meu Perfil
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">{profile.email}</p>
      </div>

      <PerfilForm profile={profile} />
    </div>
  )
}
