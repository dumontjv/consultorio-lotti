import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ChevronRight, FileText } from 'lucide-react'
import { DocumentoForm } from '@/components/documentos/DocumentoForm'
import type { DocumentoTipo, DocumentoStatus } from '@/types/database'

interface PageProps {
  params: Promise<{ id: string; did: string }>
}

export default async function EditarDocumentoPage({ params }: PageProps) {
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

  const { data: profissionais } = await supabase
    .from('profiles')
    .select('id, nome_completo, role')
    .in('role', ['medica', 'psicologa'])
    .eq('ativo', true)
    .order('nome_completo')

  return (
    <div className="space-y-5 max-w-3xl">
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
        <Link href={`/pacientes/${id}/documentos/${did}`} className="hover:text-slate-600 transition-colors truncate max-w-[120px]">
          {doc.titulo}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-slate-600">Editar</span>
      </nav>

      <div>
        <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
          <FileText className="h-6 w-6 text-slate-400" />
          Editar Documento
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">{paciente.nome_completo}</p>
      </div>

      <DocumentoForm
        pacienteId={id}
        profissionais={profissionais ?? []}
        documento={{
          id: doc.id,
          profissional_id: doc.profissional_id,
          tipo: doc.tipo as DocumentoTipo,
          titulo: doc.titulo,
          conteudo: doc.conteudo ?? '',
          data_emissao: doc.data_emissao ?? '',
          status: (doc.status ?? 'rascunho') as DocumentoStatus,
        }}
      />
    </div>
  )
}
