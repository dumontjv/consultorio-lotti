import { createClient } from '@/lib/supabase/server'
import { format, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatarTelefone } from '@/lib/validators/telefone'
import { BellRing, History, Phone } from 'lucide-react'
import { LembreteWhatsAppButton } from '@/components/lembretes/LembreteWhatsAppButton'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

function hojeStr() {
  return format(new Date(), 'yyyy-MM-dd')
}

function em7DiasStr() {
  return format(addDays(new Date(), 7), 'yyyy-MM-dd')
}

function mensagemPadrao(pacienteNome: string, data: string, hora: string): string {
  const dataExtenso = format(new Date(data + 'T00:00:00'), "d 'de' MMMM", { locale: ptBR })
  return `Olá ${pacienteNome}! Lembramos que você tem uma consulta dia ${dataExtenso}, às ${hora}, no Consultório Lotti Fonseca. Qualquer dúvida, estamos à disposição!`
}

function agruparPorData<T extends { data: string }>(items: T[]) {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    acc[item.data] = acc[item.data] ? [...acc[item.data], item] : [item]
    return acc
  }, {})
}

export default async function LembretesPage() {
  const supabase = await createClient()

  const [{ data: consultasRaw }, { data: historico }] = await Promise.all([
    supabase
      .from('consultas')
      .select(`
        id, data, hora_inicio, status, tipo,
        paciente:pacientes(id, nome_completo, telefone_principal),
        profissional:profiles(nome_completo),
        lembretes(id, status, canal, enviado_em)
      `)
      .gte('data', hojeStr())
      .lte('data', em7DiasStr())
      .in('status', ['agendada', 'confirmada'])
      .order('data')
      .order('hora_inicio'),

    supabase
      .from('lembretes')
      .select(`
        id, canal, status, enviado_em, mensagem,
        paciente:pacientes(nome_completo),
        consulta:consultas(data, hora_inicio)
      `)
      .eq('canal', 'whatsapp')
      .order('enviado_em', { ascending: false })
      .limit(50),
  ])

  const consultas = (consultasRaw ?? []) as unknown as Array<{
    id: string
    data: string
    hora_inicio: string
    status: string
    tipo: string
    paciente: { id: string; nome_completo: string; telefone_principal: string | null } | null
    profissional: { nome_completo: string } | null
    lembretes: Array<{ id: string; status: string; canal: string; enviado_em: string | null }>
  }>

  const porData = agruparPorData(consultas)
  const datasOrdenadas = Object.keys(porData).sort()

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
          <BellRing className="h-6 w-6 text-green-600" />
          Lembretes
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Envie lembretes de consulta via WhatsApp para os próximos 7 dias.
        </p>
      </div>

      {/* Próximas consultas */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Próximas consultas
        </h2>

        {datasOrdenadas.length === 0 && (
          <p className="text-sm text-muted-foreground py-4">
            Nenhuma consulta agendada nos próximos 7 dias.
          </p>
        )}

        {datasOrdenadas.map((data) => {
          const label = format(new Date(data + 'T00:00:00'), "EEEE, d 'de' MMMM", {
            locale: ptBR,
          })
          const labelCapitalizado = label.charAt(0).toUpperCase() + label.slice(1)

          return (
            <div key={data} className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">{labelCapitalizado}</p>

              <div className="divide-y divide-border rounded-lg border bg-card">
                {porData[data].map((c) => {
                  const lembreteWpp = c.lembretes.find(
                    (l) => l.canal === 'whatsapp' && (l.status === 'enviado' || l.status === 'entregue')
                  )
                  const hora = c.hora_inicio.substring(0, 5)
                  const telefone = c.paciente?.telefone_principal ?? null
                  const nome = c.paciente?.nome_completo ?? '—'

                  return (
                    <div
                      key={c.id}
                      className="flex items-center justify-between px-4 py-3 gap-4"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="text-sm font-mono font-medium text-muted-foreground w-11 shrink-0">
                          {hora}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{nome}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {telefone ? (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {formatarTelefone(telefone)}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">Sem telefone</span>
                            )}
                            {c.tipo === 'teleconsulta' && (
                              <Badge variant="secondary" className="text-xs py-0">
                                Teleconsulta
                              </Badge>
                            )}
                          </div>
                          {c.profissional && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {c.profissional.nome_completo}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0">
                        <LembreteWhatsAppButton
                          consultaId={c.id}
                          pacienteId={c.paciente?.id ?? ''}
                          pacienteNome={nome}
                          telefone={telefone}
                          mensagemPadrao={mensagemPadrao(nome, data, hora)}
                          jaEnviado={!!lembreteWpp}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </section>

      {/* Histórico */}
      {(historico ?? []).length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <History className="h-4 w-4" />
            Histórico recente
          </h2>

          <div className="divide-y divide-border rounded-lg border bg-card">
            {(historico ?? []).map((l) => {
              const enviado = l.enviado_em
                ? format(new Date(l.enviado_em), "dd/MM/yyyy 'às' HH:mm")
                : '—'
              const consulta = l.consulta as unknown as { data: string; hora_inicio: string } | null
              const dataConsulta = consulta
                ? format(new Date(consulta.data + 'T00:00:00'), "d/MM", { locale: ptBR }) +
                  ' às ' +
                  consulta.hora_inicio.substring(0, 5)
                : '—'
              const paciente = l.paciente as unknown as { nome_completo: string } | null

              return (
                <div key={l.id} className="flex items-center justify-between px-4 py-3 gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {paciente?.nome_completo ?? '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Consulta: {dataConsulta} · Enviado: {enviado}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="shrink-0 text-green-600 border-green-200 bg-green-50"
                  >
                    Enviado
                  </Badge>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
