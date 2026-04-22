import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronRight, Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { NovoPacoteModal } from '@/components/pacotes/NovoPacoteModal'
import { PacoteAcoes } from '@/components/pacotes/PacoteAcoes'

interface PageProps {
  params: Promise<{ id: string }>
}

const STATUS_CLASSES: Record<string, string> = {
  ativo: 'border-green-200 text-green-700 bg-green-50',
  concluido: 'border-blue-200 text-blue-700 bg-blue-50',
  cancelado: 'border-slate-200 text-slate-400',
}

export default async function PacotesPacientePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: paciente } = await supabase
    .from('pacientes')
    .select('id, nome_completo')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (!paciente) notFound()

  const { data: pacotes } = await supabase
    .from('pacotes_psicologia')
    .select('*')
    .eq('paciente_id', id)
    .order('created_at', { ascending: false })

  function formatMoeda(valor: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
  }

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-400">
        <Link href="/pacientes" className="hover:text-slate-600 transition-colors">
          Pacientes
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/pacientes/${id}`} className="hover:text-slate-600 transition-colors">
          {paciente.nome_completo}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-slate-600">Pacotes</span>
      </nav>

      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
            <Package className="h-6 w-6 text-slate-400" />
            Pacotes de Psicologia
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{paciente.nome_completo}</p>
        </div>
        <NovoPacoteModal pacienteId={id} />
      </div>

      {/* Lista */}
      {!pacotes || pacotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="h-12 w-12 text-slate-200 mb-3" />
          <p className="text-slate-500 font-medium">Nenhum pacote cadastrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pacotes.map((p) => {
            const st = STATUS_CLASSES[p.status] ?? ''
            const progresso = Math.round(((p.sessoes_usadas ?? 0) / p.sessoes_total) * 100)
            return (
              <Card key={p.id}>
                <CardContent className="py-4 px-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-slate-900">
                          Pacote — {p.sessoes_total} sessões
                        </p>
                        <Badge variant="outline" className={cn('text-xs', st)}>
                          {p.status === 'ativo'
                            ? 'Ativo'
                            : p.status === 'concluido'
                              ? 'Concluído'
                              : 'Cancelado'}
                        </Badge>
                      </div>

                      {/* Progresso */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span>
                            {p.sessoes_usadas ?? 0} de {p.sessoes_total} sessões realizadas
                          </span>
                          <span>{progresso}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              p.status === 'concluido'
                                ? 'bg-blue-500'
                                : p.status === 'cancelado'
                                  ? 'bg-slate-300'
                                  : 'bg-green-500'
                            )}
                            style={{ width: `${Math.min(progresso, 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-500">
                        <div>
                          <p className="text-slate-400">Valor total</p>
                          <p className="font-medium text-slate-700">{formatMoeda(p.valor_total)}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Desconto</p>
                          <p className="font-medium text-slate-700">{p.desconto_percentual}%</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Início</p>
                          <p className="font-medium text-slate-700">
                            {format(new Date(p.data_inicio + 'T00:00:00'), 'dd/MM/yyyy', {
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                        {p.data_fim && (
                          <div>
                            <p className="text-slate-400">Término</p>
                            <p className="font-medium text-slate-700">
                              {format(new Date(p.data_fim + 'T00:00:00'), 'dd/MM/yyyy', {
                                locale: ptBR,
                              })}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {p.status === 'ativo' && (
                      <PacoteAcoes pacoteId={p.id} pacienteId={id} />
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
