import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'

const FORMA_LABELS: Record<string, string> = {
  dinheiro: 'Dinheiro',
  credito: 'Cartão de Crédito',
  debito: 'Cartão de Débito',
  pix: 'Pix',
  transferencia: 'Transferência',
  convenio: 'Convênio',
  boleto: 'Boleto',
}

const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  pago: 'Pago',
  cancelado: 'Cancelado',
  estornado: 'Estornado',
}

function csvEscape(value: string | null | undefined): string {
  if (value == null) return ''
  const str = String(value)
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Não autorizado', { status: 401 })

  const { searchParams } = new URL(request.url)
  const mesParam = searchParams.get('mes') ?? format(new Date(), 'yyyy-MM')
  const statusFiltro = searchParams.get('status')

  const [ano, mes] = mesParam.split('-').map(Number)
  const dataInicio = `${mesParam}-01`
  const ultimoDia = new Date(ano, mes, 0).getDate()
  const dataFim = `${mesParam}-${ultimoDia.toString().padStart(2, '0')}`

  let query = supabase
    .from('financeiro')
    .select(
      'id, tipo, descricao, valor, forma_pagamento, status, data_vencimento, data_pagamento, paciente_id, profissional_id, observacoes'
    )
    .gte('data_vencimento', dataInicio)
    .lte('data_vencimento', dataFim)
    .order('data_vencimento', { ascending: false })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (statusFiltro) query = query.eq('status', statusFiltro as any)

  const { data: lancamentos, error } = await query
  if (error) return new NextResponse('Erro ao buscar dados', { status: 500 })

  const pacIds = [...new Set((lancamentos ?? []).map((l) => l.paciente_id).filter((id): id is string => !!id))]
  const profIds = [...new Set((lancamentos ?? []).map((l) => l.profissional_id).filter(Boolean))]

  const [{ data: pacientes }, { data: profissionais }] = await Promise.all([
    pacIds.length > 0
      ? supabase.from('pacientes').select('id, nome_completo').in('id', pacIds)
      : Promise.resolve({ data: [] }),
    profIds.length > 0
      ? supabase.from('profiles').select('id, nome_completo').in('id', profIds)
      : Promise.resolve({ data: [] }),
  ])

  const pacMap = new Map((pacientes ?? []).map((p) => [p.id, p.nome_completo]))
  const profMap = new Map((profissionais ?? []).map((p) => [p.id, p.nome_completo]))

  const header = [
    'Descrição',
    'Tipo',
    'Valor (R$)',
    'Status',
    'Forma de Pagamento',
    'Vencimento',
    'Pagamento',
    'Paciente',
    'Profissional',
    'Observações',
  ].join(',')

  const rows = (lancamentos ?? []).map((l) => {
    const valor = l.valor != null ? l.valor.toFixed(2).replace('.', ',') : ''
    const venc = l.data_vencimento
      ? format(new Date(l.data_vencimento + 'T00:00:00'), 'dd/MM/yyyy')
      : ''
    const pgto = l.data_pagamento
      ? format(new Date(l.data_pagamento + 'T00:00:00'), 'dd/MM/yyyy')
      : ''
    return [
      csvEscape(l.descricao),
      csvEscape(l.tipo),
      valor,
      csvEscape(STATUS_LABELS[l.status] ?? l.status),
      csvEscape(FORMA_LABELS[l.forma_pagamento] ?? l.forma_pagamento),
      venc,
      pgto,
      csvEscape(l.paciente_id ? (pacMap.get(l.paciente_id) ?? '') : ''),
      csvEscape(profMap.get(l.profissional_id) ?? ''),
      csvEscape(l.observacoes),
    ].join(',')
  })

  const csv = '﻿' + [header, ...rows].join('\r\n')
  const filename = `financeiro-${mesParam}${statusFiltro ? `-${statusFiltro}` : ''}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
