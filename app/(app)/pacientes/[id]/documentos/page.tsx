import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronRight, FileText, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

interface PageProps {
  params: Promise<{ id: string }>
}

const TIPO_LABELS: Record<string, string> = {
  receita: 'Receita',
  laudo: 'Laudo',
  atestado: 'Atestado',
  caso_clinico: 'Caso Clínico',
  solicitacao_exame: 'Solicitação de Exame',
  relatorio: 'Relatório',
}

const STATUS_CLASSES: Record<string, string> = {
  rascunho: 'border-amber-200 text-amber-700 bg-amber-50',
  assinado: 'border-blue-200 text-blue-700 bg-blue-50',
  entregue: 'border-green-200 text-green-700 bg-green-50',
  cancelado: 'border-slate-200 text-slate-400',
}

export default async function DocumentosPacientePage({ params }: PageProps) {
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

  const { data: documentos } = await supabase
    .from('documentos')
    .select('id, tipo, titulo, data_emissao, status, profissional_id, pdf_url')
    .eq('paciente_id', id)
    .order('data_emissao', { ascending: false })

  const { data: profissionais } = await supabase
    .from('profiles')
    .select('id, nome_completo, role')
    .in('role', ['medica', 'psicologa'])

  const profMap = new Map((profissionais ?? []).map((p) => [p.id, p]))

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
        <span className="text-slate-600">Documentos</span>
      </nav>

      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-slate-400" />
            Documentos Clínicos
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {paciente.nome_completo} — {documentos?.length ?? 0} documento
            {(documentos?.length ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href={`/pacientes/${id}/documentos/novo`}
          className={cn(buttonVariants())}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Novo documento
        </Link>
      </div>

      {/* Lista */}
      {!documentos || documentos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="h-12 w-12 text-slate-200 mb-3" />
          <p className="text-slate-500 font-medium">Nenhum documento emitido</p>
          <Link
            href={`/pacientes/${id}/documentos/novo`}
            className={cn(buttonVariants({ variant: 'outline' }), 'mt-4')}
          >
            Criar primeiro documento
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {documentos.map((doc) => {
            const prof = profMap.get(doc.profissional_id)
            const statusClass = STATUS_CLASSES[doc.status] ?? ''
            return (
              <Link key={doc.id} href={`/pacientes/${id}/documentos/${doc.id}`}>
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
    </div>
  )
}
