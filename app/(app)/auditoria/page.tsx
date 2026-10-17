import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

interface PageProps {
  searchParams: Promise<{ page?: string; entidade?: string }>
}

const ACAO_LABELS: Record<string, { label: string; class: string }> = {
  view: { label: 'Visualizou', class: 'border-slate-200 text-slate-500 bg-slate-50' },
  create: { label: 'Criou', class: 'border-teal-200 text-teal-700 bg-teal-50' },
  update: { label: 'Atualizou', class: 'border-blue-200 text-blue-700 bg-blue-50' },
  delete: { label: 'Removeu', class: 'border-rose-200 text-rose-700 bg-rose-50' },
  export: { label: 'Exportou', class: 'border-amber-200 text-amber-700 bg-amber-50' },
  print: { label: 'Imprimiu', class: 'border-indigo-200 text-indigo-700 bg-indigo-50' },
  login: { label: 'Login', class: 'border-green-200 text-green-700 bg-green-50' },
  logout: { label: 'Logout', class: 'border-slate-200 text-slate-500 bg-slate-50' },
}

const ENTIDADE_LABELS: Record<string, string> = {
  pacientes: 'Paciente',
  consultas: 'Consulta',
  evolucoes: 'Evolução',
  documentos: 'Documento',
  financeiro: 'Financeiro',
  profiles: 'Profissional',
  anamnese: 'Anamnese',
}

const PER_PAGE = 50

export default async function AuditoriaPage({ searchParams }: PageProps) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const params = await searchParams
  const page = Math.max(1, Number(params.page ?? 1))
  const entidadeFiltro = params.entidade
  const from = (page - 1) * PER_PAGE

  let query = supabase
    .from('audit_log')
    .select(
      'id, acao, entidade, entidade_id, ip_address, created_at, usuario_id',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, from + PER_PAGE - 1)

  if (entidadeFiltro) {
    query = query.eq('entidade', entidadeFiltro)
  }

  const { data: logs, count } = await query

  const userIds = [...new Set((logs ?? []).map((l) => l.usuario_id))]
  const { data: usuarios } = userIds.length > 0
    ? await supabase.from('profiles').select('id, nome_completo, role').in('id', userIds)
    : { data: [] }

  const userMap = new Map((usuarios ?? []).map((u) => [u.id, u]))
  const totalPages = Math.ceil((count ?? 0) / PER_PAGE)

  const entidades = [
    'pacientes', 'consultas', 'evolucoes', 'documentos', 'financeiro', 'profiles',
  ]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-slate-400" />
          Log de Auditoria
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {count ?? 0} evento{count !== 1 ? 's' : ''} registrado{count !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Filtro por entidade */}
      <div className="flex flex-wrap gap-2">
        <a
          href="/auditoria"
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
            !entidadeFiltro
              ? 'bg-slate-900 text-white border-slate-900'
              : 'border-input hover:bg-muted text-slate-600'
          }`}
        >
          Todos
        </a>
        {entidades.map((e) => (
          <a
            key={e}
            href={`/auditoria?entidade=${e}`}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
              entidadeFiltro === e
                ? 'bg-slate-900 text-white border-slate-900'
                : 'border-input hover:bg-muted text-slate-600'
            }`}
          >
            {ENTIDADE_LABELS[e] ?? e}
          </a>
        ))}
      </div>

      {/* Lista */}
      {(logs ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
          <ShieldCheck className="h-12 w-12 mb-3 opacity-30" />
          <p className="font-medium">Nenhum evento registrado</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {(logs ?? []).map((log) => {
            const usuario = userMap.get(log.usuario_id)
            const acao = ACAO_LABELS[log.acao] ?? { label: log.acao, class: '' }
            return (
              <Card key={log.id}>
                <CardContent className="py-2.5 px-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <Badge variant="outline" className={`text-xs shrink-0 ${acao.class}`}>
                        {acao.label}
                      </Badge>
                      <span className="text-sm text-slate-700 font-medium">
                        {ENTIDADE_LABELS[log.entidade] ?? log.entidade}
                      </span>
                      {log.entidade_id && (
                        <span className="text-xs text-slate-400 font-mono truncate max-w-[140px]">
                          #{log.entidade_id.slice(0, 8)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 shrink-0">
                      {usuario && (
                        <span className="font-medium text-slate-600">{usuario.nome_completo}</span>
                      )}
                      {log.ip_address && <span>{String(log.ip_address)}</span>}
                      <span>
                        {format(new Date(log.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          {page > 1 && (
            <a
              href={`/auditoria?page=${page - 1}${entidadeFiltro ? `&entidade=${entidadeFiltro}` : ''}`}
              className="px-3 py-1.5 rounded-lg text-sm border border-input hover:bg-muted transition-colors"
            >
              Anterior
            </a>
          )}
          <span className="text-sm text-slate-500">
            Página {page} de {totalPages}
          </span>
          {page < totalPages && (
            <a
              href={`/auditoria?page=${page + 1}${entidadeFiltro ? `&entidade=${entidadeFiltro}` : ''}`}
              className="px-3 py-1.5 rounded-lg text-sm border border-input hover:bg-muted transition-colors"
            >
              Próxima
            </a>
          )}
        </div>
      )}
    </div>
  )
}
