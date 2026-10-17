import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Users, Plus, Pencil } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const ROLE_LABELS = {
  medica: 'Médica',
  psicologa: 'Psicóloga',
  secretaria: 'Secretária',
  admin: 'Admin',
}

const ROLE_COLORS = {
  medica: 'border-teal-200 text-teal-700 bg-teal-50',
  psicologa: 'border-indigo-200 text-indigo-700 bg-indigo-50',
  secretaria: 'border-amber-200 text-amber-700 bg-amber-50',
  admin: 'border-slate-200 text-slate-700 bg-slate-50',
}

export default async function ProfissionaisPage() {
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

  const { data: profissionais } = await supabase
    .from('profiles')
    .select('id, nome_completo, email, role, crm, crp, telefone, ativo')
    .in('role', ['medica', 'psicologa', 'secretaria'])
    .order('role')
    .order('nome_completo')

  const lista = profissionais ?? []

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-slate-400" />
            Profissionais
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {lista.length} profissional{lista.length !== 1 ? 'is' : ''} cadastrado
            {lista.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/profissionais/novo" className={buttonVariants()}>
          <Plus className="h-4 w-4 mr-1.5" />
          Novo profissional
        </Link>
      </div>

      <div className="grid gap-3">
        {lista.map((p) => {
          const role = p.role as keyof typeof ROLE_LABELS
          return (
            <Card key={p.id} className={cn(!p.ativo && 'opacity-60')}>
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-slate-900">{p.nome_completo}</span>
                      <Badge
                        variant="outline"
                        className={cn('text-xs', ROLE_COLORS[role] ?? 'border-slate-200 text-slate-600')}
                      >
                        {ROLE_LABELS[role] ?? p.role}
                      </Badge>
                      {!p.ativo && (
                        <Badge
                          variant="outline"
                          className="text-xs text-slate-400 border-slate-200 bg-slate-50"
                        >
                          Inativo
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">{p.email}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      {p.crm && <span>CRM: {p.crm}</span>}
                      {p.crp && <span>CRP: {p.crp}</span>}
                      {p.telefone && <span>{p.telefone}</span>}
                    </div>
                  </div>
                  <Link
                    href={`/profissionais/${p.id}/editar`}
                    className={buttonVariants({ variant: 'outline', size: 'sm' })}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1" />
                    Editar
                  </Link>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {lista.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
            <Users className="h-12 w-12 mb-3 opacity-30" />
            <p className="font-medium">Nenhum profissional cadastrado</p>
            <p className="text-sm mt-1">Clique em "Novo profissional" para adicionar.</p>
          </div>
        )}
      </div>
    </div>
  )
}
