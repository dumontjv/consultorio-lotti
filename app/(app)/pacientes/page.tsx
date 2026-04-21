import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Users, Plus, Phone, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { PacientesBusca } from '@/components/pacientes/PacientesBusca'

interface PageProps {
  searchParams: Promise<{
    busca?: string
    filtro?: 'medica' | 'psicologa'
    page?: string
  }>
}

const PER_PAGE = 20

export default async function PacientesPage({ searchParams }: PageProps) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const busca = params.busca?.trim() ?? ''
  const filtro = params.filtro
  const page = Math.max(1, Number(params.page ?? 1))
  const from = (page - 1) * PER_PAGE

  let query = supabase
    .from('pacientes')
    .select('id, nome_completo, cpf, data_nascimento, idade_calculada, telefone_principal, email, atendido_por_medica, atendido_por_psicologa, convenio_nome, created_at', { count: 'exact' })
    .is('deleted_at', null)
    .order('nome_completo', { ascending: true })
    .range(from, from + PER_PAGE - 1)

  if (busca) {
    query = query.ilike('nome_completo', `%${busca}%`)
  }
  if (filtro === 'medica') {
    query = query.eq('atendido_por_medica', true)
  } else if (filtro === 'psicologa') {
    query = query.eq('atendido_por_psicologa', true)
  }

  const { data: pacientes, count } = await query

  const totalPages = Math.ceil((count ?? 0) / PER_PAGE)

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-slate-400" />
            Pacientes
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {count ?? 0} paciente{(count ?? 0) !== 1 ? 's' : ''} cadastrado{(count ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/pacientes/novo" className={cn(buttonVariants())}>
          <Plus className="h-4 w-4 mr-1.5" />
          Novo paciente
        </Link>
      </div>

      {/* Busca e filtros */}
      <PacientesBusca buscaInicial={busca} filtroInicial={filtro} />

      {/* Lista */}
      {!pacientes || pacientes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <User className="h-12 w-12 text-slate-200 mb-3" />
          <p className="text-slate-500 font-medium">
            {busca ? `Nenhum paciente encontrado para "${busca}"` : 'Nenhum paciente cadastrado'}
          </p>
          {!busca && (
            <Link href="/pacientes/novo" className={cn(buttonVariants({ variant: 'outline' }), 'mt-4')}>
              Cadastrar primeiro paciente
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {pacientes.map((p) => (
            <Link key={p.id} href={`/pacientes/${p.id}`}>
              <Card className="hover:shadow-sm transition-shadow cursor-pointer">
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <span className="text-sm font-medium text-slate-500">
                          {p.nome_completo.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">{p.nome_completo}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                          {p.cpf && (
                            <span>
                              CPF: {p.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                            </span>
                          )}
                          {p.idade_calculada != null && (
                            <span>{p.idade_calculada} anos</span>
                          )}
                          {p.data_nascimento && !p.idade_calculada && (
                            <span>
                              Nasc.:{' '}
                              {format(new Date(p.data_nascimento + 'T00:00:00'), 'dd/MM/yyyy', {
                                locale: ptBR,
                              })}
                            </span>
                          )}
                          {p.telefone_principal && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {p.telefone_principal}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {p.convenio_nome && (
                        <Badge variant="secondary" className="text-xs">
                          {p.convenio_nome}
                        </Badge>
                      )}
                      {p.atendido_por_medica && (
                        <Badge className="text-xs bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-50">
                          Médica
                        </Badge>
                      )}
                      {p.atendido_por_psicologa && (
                        <Badge className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-50">
                          Psicóloga
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          {page > 1 && (
            <Link
              href={`/pacientes?page=${page - 1}${busca ? `&busca=${encodeURIComponent(busca)}` : ''}${filtro ? `&filtro=${filtro}` : ''}`}
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
            >
              Anterior
            </Link>
          )}
          <span className="text-sm text-slate-500">
            Página {page} de {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/pacientes?page=${page + 1}${busca ? `&busca=${encodeURIComponent(busca)}` : ''}${filtro ? `&filtro=${filtro}` : ''}`}
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
            >
              Próxima
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
