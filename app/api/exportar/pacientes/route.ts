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
  const busca = url.searchParams.get('busca')
  const profissional = url.searchParams.get('profissional')

  let query = supabase
    .from('pacientes')
    .select(
      'nome_completo, cpf, data_nascimento, genero, telefone_principal, email, endereco_cidade, endereco_uf, convenio_nome, atendido_por_medica, atendido_por_psicologa, created_at'
    )
    .is('deleted_at', null)
    .order('nome_completo')

  if (busca) {
    query = query.ilike('nome_completo', `%${busca}%`)
  }
  if (profissional === 'medica') {
    query = query.eq('atendido_por_medica', true)
  } else if (profissional === 'psicologa') {
    query = query.eq('atendido_por_psicologa', true)
  }

  const { data: pacientes } = await query

  const GENERO_LABELS: Record<string, string> = {
    feminino: 'Feminino',
    masculino: 'Masculino',
    outro: 'Outro',
    nao_informado: 'Não informado',
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

  function formatarCPF(cpf: string | null): string {
    if (!cpf) return ''
    const d = cpf.replace(/\D/g, '')
    if (d.length !== 11) return cpf
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
  }

  const header = [
    'Nome',
    'CPF',
    'Data de Nascimento',
    'Gênero',
    'Telefone',
    'E-mail',
    'Cidade',
    'UF',
    'Convênio',
    'Médica',
    'Psicóloga',
    'Cadastrado em',
  ].join(',')

  const rows = (pacientes ?? []).map((p) =>
    [
      escapeCSV(p.nome_completo),
      escapeCSV(formatarCPF(p.cpf)),
      escapeCSV(formatarData(p.data_nascimento)),
      escapeCSV(GENERO_LABELS[p.genero ?? ''] ?? ''),
      escapeCSV(p.telefone_principal),
      escapeCSV(p.email),
      escapeCSV(p.endereco_cidade),
      escapeCSV(p.endereco_uf),
      escapeCSV(p.convenio_nome),
      p.atendido_por_medica ? 'Sim' : 'Não',
      p.atendido_por_psicologa ? 'Sim' : 'Não',
      escapeCSV(
        p.created_at
          ? format(new Date(p.created_at), 'dd/MM/yyyy', { locale: ptBR })
          : ''
      ),
    ].join(',')
  )

  const csv = [header, ...rows].join('\r\n')
  const hoje = format(new Date(), 'yyyy-MM-dd')

  return new Response('\uFEFF' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="pacientes-${hoje}.csv"`,
    },
  })
}
