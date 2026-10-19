import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolverPeriodo } from '@/lib/relatorios/periodo'
import { resolverFiltroConvenio, filtrarFinanceiroPorConvenio } from '@/lib/relatorios/convenio'

const STATUS_LABELS: Record<string, string> = {
  pago: 'Pago',
  pendente: 'Pendente',
  cancelado: 'Cancelado',
  estornado: 'Estornado',
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
    .from('financeiro')
    .select(`
      id, descricao, valor, status, forma_pagamento, data_vencimento, data_pagamento,
      convenio:convenios(nome),
      consulta:consultas(numero_carteirinha, numero_guia),
      paciente:pacientes(nome_completo),
      profissional:profiles!profissional_id(nome_completo)
    `)
    .gte('data_vencimento', inicio)
    .lte('data_vencimento', fim)
    .order('data_vencimento')

  if (profissionalId !== 'todos') {
    query = query.eq('profissional_id', profissionalId)
  }
  query = filtrarFinanceiroPorConvenio(query, convenioFiltro)

  const { data } = await query
  const rows = (data ?? []) as unknown as Array<{
    id: string
    descricao: string
    valor: number
    status: string
    forma_pagamento: string | null
    data_vencimento: string | null
    data_pagamento: string | null
    convenio: { nome: string } | null
    consulta: { numero_carteirinha: string | null; numero_guia: string | null } | null
    paciente: { nome_completo: string } | null
    profissional: { nome_completo: string } | null
  }>

  const cabecalho = [
    'Profissional', 'Paciente', 'Descrição', 'Valor (R$)',
    'Status', 'Forma de Pagamento', 'Convênio', 'Nº carteirinha', 'Nº guia',
    'Vencimento', 'Data de Pagamento',
  ]
  const linhas = rows.map((r) => [
    r.profissional?.nome_completo ?? '',
    r.paciente?.nome_completo ?? '',
    r.descricao,
    r.valor.toFixed(2).replace('.', ','),
    STATUS_LABELS[r.status] ?? r.status,
    r.forma_pagamento ? (FORMA_LABELS[r.forma_pagamento] ?? r.forma_pagamento) : '',
    r.convenio?.nome ?? '',
    r.consulta?.numero_carteirinha ?? '',
    r.consulta?.numero_guia ?? '',
    r.data_vencimento ?? '',
    r.data_pagamento ?? '',
  ])

  const csv = [cabecalho, ...linhas]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
    .join('\r\n')

  return new NextResponse('﻿' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="financeiro_${inicio}_${fim}${convenioFiltro ? `_${convenioFiltro.nome.normalize('NFD').replace(/[^a-zA-Z0-9]/g, '')}` : ''}.csv"`,
    },
  })
}
