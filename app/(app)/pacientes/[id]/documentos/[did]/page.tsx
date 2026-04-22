import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronRight, FileText, Pencil, Printer } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PageProps {
  params: Promise<{ id: string; did: string }>
}

const TIPO_LABELS: Record<string, string> = {
  receita: 'Receita Médica',
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

export default async function DocumentoDetalhePage({ params }: PageProps) {
  const { id, did } = await params
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

  const { data: doc } = await supabase
    .from('documentos')
    .select('*')
    .eq('id', did)
    .eq('paciente_id', id)
    .single()

  if (!doc) notFound()

  const { data: prof } = await supabase
    .from('profiles')
    .select('nome_completo, role, crm, crp')
    .eq('id', doc.profissional_id)
    .single()

  const statusClass = STATUS_CLASSES[doc.status] ?? ''

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-400 flex-wrap">
        <Link href="/pacientes" className="hover:text-slate-600 transition-colors">
          Pacientes
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/pacientes/${id}`} className="hover:text-slate-600 transition-colors">
          {paciente.nome_completo}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/pacientes/${id}/documentos`} className="hover:text-slate-600 transition-colors">
          Documentos
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-slate-600 truncate max-w-[180px]">{doc.titulo}</span>
      </nav>

      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-semibold text-slate-900">{doc.titulo}</h1>
            <Badge variant="secondary" className="text-xs">
              {TIPO_LABELS[doc.tipo] ?? doc.tipo}
            </Badge>
            <Badge variant="outline" className={cn('text-xs', statusClass)}>
              {doc.status === 'rascunho' ? 'Rascunho' : doc.status === 'assinado' ? 'Assinado' : doc.status === 'entregue' ? 'Entregue' : 'Cancelado'}
            </Badge>
          </div>
          <p className="text-sm text-slate-500">
            {format(new Date(doc.data_emissao + 'T00:00:00'), "dd 'de' MMMM 'de' yyyy", {
              locale: ptBR,
            })}
            {prof && (
              <span className="ml-2">
                — {prof.nome_completo}
                {prof.crm && <span className="text-slate-400 ml-1">CRM {prof.crm}</span>}
                {prof.crp && <span className="text-slate-400 ml-1">CRP {prof.crp}</span>}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          {doc.pdf_url && (
            <a
              href={doc.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
            >
              <Printer className="h-4 w-4 mr-1.5" />
              Ver PDF
            </a>
          )}
          {doc.status === 'rascunho' && (
            <Link
              href={`/pacientes/${id}/documentos/${did}/editar`}
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
            >
              <Pencil className="h-4 w-4 mr-1.5" />
              Editar
            </Link>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate-400" />
            Conteúdo do Documento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-slate-50 rounded-lg p-4 font-mono text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
            {doc.conteudo}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
