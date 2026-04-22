import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DollarSign, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NovoLancamentoModal } from '@/components/financeiro/NovoLancamentoModal'

interface PageProps {
  searchParams: Promise<{
    status?: string
    mes?: string
    page?: string
  }>
}

const STATUS_LABELS: Record<string, { label: string; class: string }> = {
  pendente: { label: 'Pendente', class: 'border-amber-200 text-amber-700 bg-amber-50' },
  pago: { label: 'Pago', class: 'border-green-200 text-green-700 bg-green-50' },
  cancelado: { label: 'Cancelado', class: 'border-slate-200 text-slate-400' },
  estornado: { label: 'Estornado', class: 'border-rose-200 text-rose-700 bg-rose-50' },
}

const FORMA_LABELS: Record<string, string> = {
  dinheiro: 'Dinheiro',
  credito: 'Cartão de Crédito',
  debito: 'Cartão de Débito',
  pix: 'Pix',
  transferencia: 'Transferência',
  convenio: 'Convênio',
  boleto: 'Boleto',
}

const PER_PAGE = 30

export default async function FinanceiroPage({ searchParams }: PageProps) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const statusFiltro = params.status
  const page = Math.max(1, Number(params.page ?? 1))
  const from = (page - 1) * PER_PAGE

  // Período atual (mês corrente por padrão)
  const hoje = new Date()
  const mesParam = params.mes ?? format(hoje, 'yyyy-MM')
  const [ano, mes] = mesParam.split('-').map(Number)
  const dataInicio = `${mesParam}-01`
  const ultimoDia = new Date(ano, mes, 0).getDate()
  const dataFim = `${mesParam}-${ultimoDia.toString().padStart(2, '0')}`

  // Busca resumo financeiro do mês
  const { data: resumoData } = await supabase
    .from('financeiro')
    .select('valor, status')
    .gte('data_vencimento', dataInicio)
    .lte('data_vencimento', dataFim)

  const totalRecebido = (resumoData ?? [])
    .filter((r) => r.status === 'pago')
    .reduce((sum, r) => sum + (r.valor ?? 0), 0)

  const totalPendente = (resumoData ?? [])
    .filter((r) => r.status === 'pendente')
    .reduce((sum, r) => sum + (r.valor ?? 0), 0)

  const totalMes = (resumoData ?? [])
    .filter((r) => r.status !== 'cancelado' && r.status !== 'estornado')
    .reduce((sum, r) => sum + (r.valor ?? 0), 0)

  // Busca lançamentos paginados
  let query = supabase
    .from('financeiro')
    .select(
      'id, tipo, descricao, valor, forma_pagamento, status, data_vencimento, data_pagamento, paciente_id, profissional_id, observacoes',
      { count: 'exact' }
    )
    .gte('data_vencimento', dataInicio)
    .lte('data_vencimento', dataFim)
    .order('data_vencimento', { ascending: false })
    .range(from, from + PER_PAGE - 1)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (statusFiltro) query = query.eq('status', statusFiltro as any)

  const { data: lancamentos, count } = await query

  const pacIds = [...new Set((lancamentos ?? []).map((l) => l.paciente_id))]
  const profIds = [...new Set((lancamentos ?? []).map((l) => l.profissional_id))]

  const [{ data: pacientes }, { data: profissionais }] = await Promise.all([
    pacIds.length > 0
      ? supabase.from('pacientes').select('id, nome_completo').in('id', pacIds)
      : Promise.resolve({ data: [] }),
    profIds.length > 0
      ? supabase.from('profiles').select('id, nome_completo, role').in('id', profIds)
      : Promise.resolve({ data: [] }),
  ])

  const { data: todosProfs } = await supabase
    .from('profiles')
    .select('id, nome_completo, role')
    .in('role', ['medica', 'psicologa'])
    .eq('ativo', true)

  const pacMap = new Map((pacientes ?? []).map((p) => [p.id, p]))
  const profMap = new Map((profissionais ?? []).map((p) => [p.id, p]))

  const totalPages = Math.ceil((count ?? 0) / PER_PAGE)

  function formatMoeda(valor: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
  }

  // Mês anterior/próximo
  const dataObj = new Date(ano, mes - 1, 1)
  const mesAnterior = format(new Date(ano, mes - 2, 1), 'yyyy-MM')
  const mesProximo = format(new Date(ano, mes, 1), 'yyyy-MM')

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-slate-400" />
            Financeiro
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {format(dataObj, 'MMMM yyyy', { locale: ptBR })}
          </p>
        </div>
        <NovoLancamentoModal profissionais={todosProfs ?? []} />
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Recebido</p>
                <p className="text-lg font-bold text-green-700">{formatMoeda(totalRecebido)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Pendente</p>
                <p className="text-lg font-bold text-amber-700">{formatMoeda(totalPendente)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                <TrendingUp className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Total do mês</p>
                <p className="text-lg font-bold text-slate-800">{formatMoeda(totalMes)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navegação de meses */}
      <div className="flex items-center gap-2">
        <Link
          href={`/financeiro?mes=${mesAnterior}`}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
        >
          ← Mês anterior
        </Link>
        <span className="text-sm text-slate-600 font-medium capitalize">
          {format(dataObj, 'MMMM yyyy', { locale: ptBR })}
        </span>
        <Link
          href={`/financeiro?mes=${mesProximo}`}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
        >
          Próximo mês →
        </Link>
      </div>

      {/* Filtros por status */}
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/financeiro?mes=${mesParam}`}
          className={cn(buttonVariants({ variant: !statusFiltro ? 'default' : 'outline', size: 'sm' }))}
        >
          Todos
        </Link>
        {(['pendente', 'pago', 'cancelado', 'estornado'] as const).map((s) => (
          <Link
            key={s}
            href={`/financeiro?mes=${mesParam}&status=${s}`}
            className={cn(buttonVariants({ variant: statusFiltro === s ? 'default' : 'outline', size: 'sm' }))}
          >
            {STATUS_LABELS[s].label}
          </Link>
        ))}
      </div>

      {/* Lista */}
      {!lancamentos || lancamentos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <DollarSign className="h-12 w-12 text-slate-200 mb-3" />
          <p className="text-slate-500 font-medium">Nenhum lançamento encontrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {lancamentos.map((l) => {
            const pac = pacMap.get(l.paciente_id)
            const prof = profMap.get(l.profissional_id)
            const st = STATUS_LABELS[l.status] ?? { label: l.status, class: '' }
            return (
              <Card key={l.id}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900 truncate">{l.descricao}</p>
                        <Badge variant="outline" className={cn('text-xs shrink-0', st.class)}>
                          {st.label}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-0.5">
                        {pac && (
                          <Link
                            href={`/pacientes/${l.paciente_id}`}
                            className="font-medium text-slate-600 hover:text-teal-600 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {pac.nome_completo}
                          </Link>
                        )}
                        {prof && <span>{prof.nome_completo}</span>}
                        <span>
                          Venc.{' '}
                          {format(new Date(l.data_vencimento + 'T00:00:00'), 'dd/MM/yyyy', {
                            locale: ptBR,
                          })}
                        </span>
                        {l.data_pagamento && (
                          <span className="text-green-600">
                            Pago em{' '}
                            {format(new Date(l.data_pagamento + 'T00:00:00'), 'dd/MM/yyyy', {
                              locale: ptBR,
                            })}
                          </span>
                        )}
                        {l.forma_pagamento && (
                          <span>{FORMA_LABELS[l.forma_pagamento] ?? l.forma_pagamento}</span>
                        )}
                      </div>
                    </div>
                    <p className="text-lg font-bold text-slate-800 shrink-0 tabular-nums">
                      {formatMoeda(l.valor)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          {page > 1 && (
            <Link
              href={`/financeiro?mes=${mesParam}&page=${page - 1}${statusFiltro ? `&status=${statusFiltro}` : ''}`}
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
              href={`/financeiro?mes=${mesParam}&page=${page + 1}${statusFiltro ? `&status=${statusFiltro}` : ''}`}
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
