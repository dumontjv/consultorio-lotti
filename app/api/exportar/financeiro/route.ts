import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export async function GET(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const url = new URL(request.url)
  const mes = url.searchParams.get('mes') ?? format(new Date(), 'yyyy-MM')
  const statusFiltro = url.searchParams.get('status')

  const [ano, mesNum] = mes.split('-').map(Number)
  const dataInicio = `${mes}-01`
  const ultimoDia = new Date(ano, mesNum, 0).getDate()
  const dataFim = `${mes}-${ultimoDia.toString().padStart(2, '0')}`

  let query = supabase
    .from('financeiro')
    .select(
      'id, tipo, descricao, valor, forma_pagamento, status, data_vencimento, data_pagamento, observacoes, paciente_id, profissional_id'
    )
    .gte('data_vencimento', dataInicio)
    .lte('data_vencimento', dataFim)
    .order('data_vencimento', { ascending: false })

  if (statusFiltro) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query = query.eq('status', statusFiltro as any)
  }

  const { data: lancamentos } = await query

  const pacIds = [...new Set((lancamentos ?? []).map((l) => l.paciente_id).filter((id): id is string => !!id))]
  const profIds = [...new Set((lancamentos ?? []).map((l) => l.profissional_id))]

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

  function escapeCSV(val: string | null | undefined): string {
    if (val == null) return ''
    const str = String(val)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  function formatarData(d: string | null): string {
    if (!d) return ''
    try {
      return format(new Date(d + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })
    } catch {
      return d
    }
  }

  const header = [
    'Descrição',
    'Paciente',
    'Profissional',
    'Tipo',
    'Valor (R$)',
    'Forma de Pagamento',
    'Status',
    'Vencimento',
    'Pagamento',
    'Observações',
  ].join(',')

  const rows = (lancamentos ?? []).map((l) =>
    [
      escapeCSV(l.descricao),
      escapeCSV((l.paciente_id ? pacMap.get(l.paciente_id) : '') ?? ''),
      escapeCSV(profMap.get(l.profissional_id) ?? ''),
      escapeCSV(l.tipo),
      String(l.valor ?? ''),
      escapeCSV(FORMA_LABELS[l.forma_pagamento ?? ''] ?? l.forma_pagamento ?? ''),
      escapeCSV(STATUS_LABELS[l.status ?? ''] ?? l.status ?? ''),
      escapeCSV(formatarData(l.data_vencimento)),
      escapeCSV(formatarData(l.data_pagamento)),
      escapeCSV(l.observacoes),
    ].join(',')
  )

  const csv = [header, ...rows].join('\r\n')
  const mesFmt = format(new Date(ano, mesNum - 1, 1), 'yyyy-MM', { locale: ptBR })

  return new Response('\uFEFF' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="financeiro-${mesFmt}.csv"`,
    },
  })
}
