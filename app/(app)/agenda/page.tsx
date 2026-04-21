import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { format, startOfWeek, endOfWeek, parseISO } from 'date-fns'
import { Calendar } from 'lucide-react'
import { AgendaView } from '@/components/agenda/AgendaView'
import type { ConsultaDetalhada, Profile } from '@/types/domain'

interface PageProps {
  searchParams: Promise<{
    data?: string
    modo?: string
    paciente?: string
  }>
}

export default async function AgendaPage({ searchParams }: PageProps) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const modo = params.modo === 'semana' ? 'semana' : 'dia'
  const dataAtual = params.data ?? format(new Date(), 'yyyy-MM-dd')
  const pacienteId = params.paciente

  // Calcula intervalo de datas para a query
  let dataInicio: string
  let dataFim: string

  if (modo === 'dia') {
    dataInicio = dataAtual
    dataFim = dataAtual
  } else {
    const dataObj = parseISO(dataAtual)
    dataInicio = format(startOfWeek(dataObj, { weekStartsOn: 0 }), 'yyyy-MM-dd')
    dataFim = format(endOfWeek(dataObj, { weekStartsOn: 0 }), 'yyyy-MM-dd')
  }

  // Busca profissionais (médica e psicóloga)
  const { data: profissionais } = await supabase
    .from('profiles')
    .select('id, nome_completo, role, crm, crp')
    .in('role', ['medica', 'psicologa'])
    .eq('ativo', true)
    .order('nome_completo')

  // Busca consultas com dados relacionados
  let consultasQuery = supabase
    .from('consultas')
    .select(
      `id, paciente_id, profissional_id, tipo, data, hora_inicio, hora_fim, status,
       valor_cobrado, observacoes, link_teleconsulta, criado_por, created_at, updated_at,
       paciente:pacientes(id, nome_completo, telefone_principal, email),
       profissional:profiles(id, nome_completo, role, crm, crp)`
    )
    .gte('data', dataInicio)
    .lte('data', dataFim)
    .order('data', { ascending: true })
    .order('hora_inicio', { ascending: true })

  if (pacienteId) {
    consultasQuery = consultasQuery.eq('paciente_id', pacienteId)
  }

  const { data: consultasRaw } = await consultasQuery

  // Normaliza os dados para o tipo esperado
  const consultas: ConsultaDetalhada[] = (consultasRaw ?? []).map((c) => ({
    id: c.id,
    paciente_id: c.paciente_id,
    profissional_id: c.profissional_id,
    tipo: c.tipo,
    data: c.data,
    hora_inicio: c.hora_inicio,
    hora_fim: c.hora_fim,
    status: c.status,
    valor_cobrado: c.valor_cobrado,
    observacoes: c.observacoes,
    link_teleconsulta: c.link_teleconsulta,
    criado_por: c.criado_por,
    created_at: c.created_at,
    updated_at: c.updated_at,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    paciente: (Array.isArray(c.paciente) ? c.paciente[0] : c.paciente) as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    profissional: (Array.isArray(c.profissional) ? c.profissional[0] : c.profissional) as any,
  }))

  const profissionaisLista: Pick<Profile, 'id' | 'nome_completo' | 'role'>[] = (profissionais ?? []).map((p) => ({
    id: p.id,
    nome_completo: p.nome_completo,
    role: p.role as Profile['role'],
    crm: p.crm,
    crp: p.crp,
    email: '',
    telefone: null,
    foto_url: null,
    ativo: true,
    created_at: '',
    updated_at: '',
  }))

  const totalDia = consultas.filter((c) => c.data === format(new Date(), 'yyyy-MM-dd')).length

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
          <Calendar className="h-6 w-6 text-slate-400" />
          Agenda
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {totalDia > 0
            ? `${totalDia} consulta${totalDia !== 1 ? 's' : ''} hoje`
            : 'Nenhuma consulta hoje'}
        </p>
      </div>

      <AgendaView
        consultas={consultas}
        profissionais={profissionaisLista}
        dataAtual={dataAtual}
        modo={modo as 'dia' | 'semana'}
      />
    </div>
  )
}
