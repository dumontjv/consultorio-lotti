import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolverPeriodo } from '@/lib/relatorios/periodo'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const periodo = searchParams.get('periodo') ?? 'ano'
  const { inicio, fim } = resolverPeriodo(periodo)

  const { data } = await supabase
    .from('pacientes')
    .select('id, nome_completo, data_nascimento, genero, email, telefone_principal, endereco_cidade, convenio_nome, created_at')
    .gte('created_at', `${inicio}T00:00:00`)
    .lte('created_at', `${fim}T23:59:59`)
    .is('deleted_at', null)
    .order('created_at')

  const rows = data ?? []

  const GENERO_LABELS: Record<string, string> = {
    feminino: 'Feminino',
    masculino: 'Masculino',
    outro: 'Outro',
    nao_informado: 'Não informado',
  }

  const cabecalho = ['Data de Cadastro', 'Nome', 'Data de Nascimento', 'Gênero', 'Telefone', 'E-mail', 'Cidade', 'Convênio']
  const linhas = rows.map((p) => [
    p.created_at.substring(0, 10),
    p.nome_completo,
    p.data_nascimento ?? '',
    p.genero ? (GENERO_LABELS[p.genero] ?? p.genero) : '',
    p.telefone_principal ?? '',
    p.email ?? '',
    p.endereco_cidade ?? '',
    p.convenio_nome ?? '',
  ])

  const csv = [cabecalho, ...linhas]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
    .join('\r\n')

  return new NextResponse('﻿' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="pacientes_${inicio}_${fim}.csv"`,
    },
  })
}
