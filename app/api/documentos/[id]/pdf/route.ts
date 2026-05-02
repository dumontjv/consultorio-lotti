import { NextRequest, NextResponse } from 'next/server'
import { createElement } from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/server'
import { DocumentoPDF } from '@/components/pdf/DocumentoPDF'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: doc } = await supabase
    .from('documentos')
    .select('id, titulo, tipo, conteudo, data_emissao, paciente_id, profissional_id, status')
    .eq('id', id)
    .single()

  if (!doc) return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 })

  const [{ data: paciente }, { data: prof }, { data: config }] = await Promise.all([
    supabase
      .from('pacientes')
      .select('nome_completo')
      .eq('id', doc.paciente_id)
      .is('deleted_at', null)
      .single(),
    supabase
      .from('profiles')
      .select('nome_completo, role, crm, crp')
      .eq('id', doc.profissional_id)
      .single(),
    supabase
      .from('configuracoes')
      .select(
        'consultorio_nome, consultorio_endereco, consultorio_telefones, consultorio_celular, consultorio_email, consultorio_logo_url'
      )
      .eq('id', 1)
      .single(),
  ])

  const dataFormatada = format(
    new Date(doc.data_emissao + 'T00:00:00'),
    "dd 'de' MMMM 'de' yyyy",
    { locale: ptBR }
  )

  const element = createElement(DocumentoPDF, {
    doc: {
      titulo: doc.titulo,
      tipo: doc.tipo,
      conteudo: doc.conteudo,
      data_emissao: doc.data_emissao,
    },
    paciente,
    prof,
    config,
    dataFormatada,
  })

  const buffer = await renderToBuffer(element as Parameters<typeof renderToBuffer>[0])

  const nomeArquivo = [
    doc.tipo,
    doc.data_emissao,
    paciente?.nome_completo?.replace(/\s+/g, '_') ?? 'paciente',
  ]
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${nomeArquivo}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
