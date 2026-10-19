import { redirect } from 'next/navigation'
import { HeartHandshake } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { carregarConvenios } from '@/lib/convenios/servidor'
import { ConveniosGestao } from '@/components/configuracoes/ConveniosGestao'

export default async function ConveniosPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (perfil?.role !== 'admin') redirect('/dashboard')

  const [convenios, { data: profissionais }] = await Promise.all([
    carregarConvenios(supabase),
    supabase
      .from('profiles')
      .select('id, nome_completo, role')
      .in('role', ['medica', 'psicologa'])
      .eq('ativo', true)
      .order('nome_completo'),
  ])

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-foreground flex items-center gap-2">
          <HeartHandshake className="h-6 w-6 text-slate-400" />
          Convênios
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Planos aceitos por cada profissional, valores do Particular e repasse de cada convênio
        </p>
      </div>

      <ConveniosGestao
        convenios={convenios}
        profissionais={(profissionais ?? []).map((p) => ({
          id: p.id,
          nome_completo: p.nome_completo,
          role: p.role as 'medica' | 'psicologa',
        }))}
      />
    </div>
  )
}
