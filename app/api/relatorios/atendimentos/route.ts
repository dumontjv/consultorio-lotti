import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolverPeriodo } from '@/lib/relatorios/periodo'
import { resolverFiltroConvenio } from '@/lib/relatorios/convenio'

const STATUS_LABELS: Record<string, string> = {
  agendada: 'Agendada',
  confirmada: 'Confirmada',
  compareceu: 'Compareceu',
  faltou: 'Faltou',
  cancelada: 'Cancelada',
}

const TIPO_LABELS: Record<string, string> = {
  presencial: 'Presencial',
  teleconsulta: 'Teleconsulta',
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const periodo = searchParams.get('periodo') ?? 'ano'
  const profissionalId = searchParams.get('profissional') ?? 'todos'

  const { inicio, fim } = resolverPeriodo(periodo)

  const { data: convenios } = await supabase.from('convenios').select('id, nome, particular')
  const convenioFiltro = resolverFiltroConvenio(searchParams.get('convenio'), convenios ?? [])

  let query = supabase
    .from('consultas')
    .select(`
      id, data, hora_inicio, status, tipo, valor_cobrado, numero_carteirinha, numero_guia,
      convenio:convenios(nome),
      paciente:pacientes(nome_completo),
      profissional:profiles!profissional_id(nome_completo)
    `)
    .gte('data', inicio)
    .lte('data', fim)
    .order('data')
    .order('hora_inicio')

  if (profissionalId !== 'todos') {
    query = query.eq('profissional_id', profissionalId)
  }
  if (convenioFiltro) {
    query = query.eq('convenio_id', convenioFiltro.id)
  }

  const { data } = await query
  const rows = (data ?? []) as unknown as Array<{
    id: string
    data: string
    hora_inicio: string
    status: string
    tipo: string
    valor_cobrado: number | null
    numero_carteirinha: string | null
    numero_guia: string | null
    convenio: { nome: string } | null
    paciente: { nome_completo: string } | null
    profissional: { nome_completo: string } | null
  }>

  const cabecalho = [
    'Data', 'Hora', 'Paciente', 'Profissional', 'Tipo', 'Status',
    'Convênio', 'Nº carteirinha', 'Nº guia', 'Valor (R$)',
  ]
  const linhas = rows.map((r) => [
    r.data,
    r.hora_inicio.substring(0, 5),
    r.paciente?.nome_completo ?? '',
    r.profissional?.nome_completo ?? '',
    TIPO_LABELS[r.tipo] ?? r.tipo,
    STATUS_LABELS[r.status] ?? r.status,
    r.convenio?.nome ?? '',
    r.numero_carteirinha ?? '',
    r.numero_guia ?? '',
    r.valor_cobrado != null ? r.valor_cobrado.toFixed(2).replace('.', ',') : '',
  ])

  const csv = [cabecalho, ...linhas]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
    .join('\r\n')

  return new NextResponse('﻿' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="atendimentos_${inicio}_${fim}${convenioFiltro ? `_${convenioFiltro.nome.normalize('NFD').replace(/[^a-zA-Z0-9]/g, '')}` : ''}.csv"`,
    },
  })
}
