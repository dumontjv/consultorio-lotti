import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Settings } from 'lucide-react'
import { ConfiguracoesForm } from '@/components/configuracoes/ConfiguracoesForm'

export default async function ConfiguracoesPage() {
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

  const { data: config } = await supabase
    .from('configuracoes')
    .select('*')
    .eq('id', 1)
    .single()

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
          <Settings className="h-6 w-6 text-slate-400" />
          Configurações
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Dados do consultório</p>
      </div>

      <ConfiguracoesForm config={config} />
    </div>
  )
}
