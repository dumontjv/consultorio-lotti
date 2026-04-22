import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

interface PageProps {
  searchParams: Promise<{
    tipo?: string
    status?: string
    page?: string
  }>
}

const TIPO_LABELS: Record<string, string> = {
  receita: 'Receita',
  laudo: 'Laudo',
  atestado: 'Atestado',
  caso_clinico: 'Caso Clínico',
  solicitacao_exame: 'Sol. de Exame',
  relatorio: 'Relatório',
}

const STATUS_CLASSES: Record<string, string> = {
  rascunho: 'border-amber-200 text-amber-700 bg-amber-50',
  assinado: 'border-blue-200 text-blue-700 bg-blue-50',
  entregue: 'border-green-200 text-green-700 bg-green-50',
  cancelado: 'border-slate-200 text-slate-400',
}

const PER_PAGE = 30

export default async function DocumentosPage({ searchParams }: PageProps) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const tipoFiltro = params.tipo
  const statusFiltro = params.status
  const page = Math.max(1, Number(params.page ?? 1))
  const from = (page - 1) * PER_PAGE

  let query = supabase
    .from('documentos')
    .select(
      'id, tipo, titulo, data_emissao, status, paciente_id, profissional_id, pdf_url',
      { count: 'exact' }
    )
    .order('data_emissao', { ascending: false })
    .range(from, from + PER_PAGE - 1)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (tipoFiltro) query = query.eq('tipo', tipoFiltro as any)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (statusFiltro) query = query.eq('status', statusFiltro as any)

  const { data: documentos, count } = await query

  const docIds = (documentos ?? []).map((d) => d.paciente_id)
  const profIds = (documentos ?? []).map((d) => d.profissional_id)

  const [{ data: pacientes }, { data: profissionais }] = await Promise.all([
    docIds.length > 0
      ? supabase.from('pacientes').select('id, nome_completo').in('id', docIds)
      : Promise.resolve({ data: [] }),
    profIds.length > 0
      ? supabase.from('profiles').select('id, nome_completo').in('id', profIds)
      : Promise.resolve({ data: [] }),
  ])

  const pacMap = new Map((pacientes ?? []).map((p) => [p.id, p]))
  const profMap = new Map((profissionais ?? []).map((p) => [p.id, p]))

  const totalPages = Math.ceil((count ?? 0) / PER_PAGE)

  const tipoOptions = ['receita', 'laudo', 'atestado', 'caso_clinico', 'solicitacao_exame', 'relatorio']
  const statusOptions = ['rascunho', 'finalizado', 'cancelado']

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
          <FileText className="h-6 w-6 text-slate-400" />
          Documentos
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {count ?? 0} documento{(count ?? 0) !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/documentos"
          className={cn(
            buttonVariants({ variant: !tipoFiltro && !statusFiltro ? 'default' : 'outline', size: 'sm' })
          )}
        >
          Todos
        </Link>
        {tipoOptions.map((t) => (
          <Link
            key={t}
            href={`/documentos?tipo=${t}${statusFiltro ? `&status=${statusFiltro}` : ''}`}
            className={cn(
              buttonVariants({ variant: tipoFiltro === t ? 'default' : 'outline', size: 'sm' })
            )}
          >
            {TIPO_LABELS[t]}
          </Link>
        ))}
      </div>

      {/* Lista */}
      {!documentos || documentos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="h-12 w-12 text-slate-200 mb-3" />
          <p className="text-slate-500 font-medium">Nenhum documento encontrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documentos.map((doc) => {
            const pac = pacMap.get(doc.paciente_id)
            const prof = profMap.get(doc.profissional_id)
            const statusClass = STATUS_CLASSES[doc.status] ?? ''
            return (
              <Link key={doc.id} href={`/pacientes/${doc.paciente_id}/documentos/${doc.id}`}>
                <Card className="hover:shadow-sm transition-shadow cursor-pointer">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-900 truncate">{doc.titulo}</p>
                          <Badge variant="secondary" className="text-xs shrink-0">
                            {TIPO_LABELS[doc.tipo] ?? doc.tipo}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                          <span>
                            {format(new Date(doc.data_emissao + 'T00:00:00'), 'dd/MM/yyyy', {
                              locale: ptBR,
                            })}
                          </span>
                          {pac && <span className="font-medium text-slate-600">{pac.nome_completo}</span>}
                          {prof && <span>{prof.nome_completo}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {doc.pdf_url && (
                          <Badge variant="outline" className="text-xs border-slate-200 text-slate-500">
                            PDF
                          </Badge>
                        )}
                        <Badge variant="outline" className={cn('text-xs', statusClass)}>
                          {doc.status === 'rascunho'
                            ? 'Rascunho'
                            : doc.status === 'assinado'
                              ? 'Assinado'
                              : doc.status === 'entregue'
                                ? 'Entregue'
                                : 'Cancelado'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          {page > 1 && (
            <Link
              href={`/documentos?page=${page - 1}${tipoFiltro ? `&tipo=${tipoFiltro}` : ''}${statusFiltro ? `&status=${statusFiltro}` : ''}`}
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
              href={`/documentos?page=${page + 1}${tipoFiltro ? `&tipo=${tipoFiltro}` : ''}${statusFiltro ? `&status=${statusFiltro}` : ''}`}
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
