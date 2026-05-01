import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

interface PageProps {
  searchParams: Promise<{
    acao?: string
    usuario?: string
    entidade?: string
    page?: string
  }>
}

const ACAO_META: Record<string, { label: string; class: string }> = {
  view:    { label: 'Visualização', class: 'border-slate-200 text-slate-600 bg-slate-50' },
  create:  { label: 'Criação',      class: 'border-green-200 text-green-700 bg-green-50' },
  update:  { label: 'Edição',       class: 'border-blue-200 text-blue-700 bg-blue-50' },
  delete:  { label: 'Exclusão',     class: 'border-rose-200 text-rose-700 bg-rose-50' },
  export:  { label: 'Exportação',   class: 'border-violet-200 text-violet-700 bg-violet-50' },
  print:   { label: 'Impressão',    class: 'border-amber-200 text-amber-700 bg-amber-50' },
  login:   { label: 'Login',        class: 'border-teal-200 text-teal-700 bg-teal-50' },
  logout:  { label: 'Logout',       class: 'border-slate-200 text-slate-500 bg-slate-50' },
}

const ENTIDADE_LABELS: Record<string, string> = {
  pacientes:         'Paciente',
  consultas:         'Consulta',
  evolucoes:         'Evolução',
  documentos:        'Documento',
  financeiro:        'Financeiro',
  anamnese:          'Anamnese',
  pacotes_psicologia:'Pacote',
  profiles:          'Perfil',
  configuracoes:     'Configurações',
}

const PER_PAGE = 40

export default async function AuditLogPage({ searchParams }: PageProps) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const params = await searchParams
  const acaoFiltro    = params.acao
  const usuarioFiltro = params.usuario
  const entidadeFiltro = params.entidade
  const page = Math.max(1, Number(params.page ?? 1))
  const from = (page - 1) * PER_PAGE

  // Busca todos os usuários para o filtro
  const { data: usuarios } = await supabase
    .from('profiles')
    .select('id, nome_completo, role')
    .eq('ativo', true)
    .order('nome_completo')

  // Query principal
  let query = supabase
    .from('audit_log')
    .select('id, usuario_id, acao, entidade, entidade_id, ip_address, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + PER_PAGE - 1)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (acaoFiltro)     query = query.eq('acao', acaoFiltro as any)
  if (usuarioFiltro)  query = query.eq('usuario_id', usuarioFiltro)
  if (entidadeFiltro) query = query.eq('entidade', entidadeFiltro)

  const { data: logs, count } = await query

  const usuarioMap = new Map((usuarios ?? []).map((u) => [u.id, u]))
  const totalPages = Math.ceil((count ?? 0) / PER_PAGE)

  function buildUrl(overrides: Record<string, string | undefined>) {
    const base: Record<string, string> = {}
    if (acaoFiltro)     base.acao     = acaoFiltro
    if (usuarioFiltro)  base.usuario  = usuarioFiltro
    if (entidadeFiltro) base.entidade = entidadeFiltro
    const merged = { ...base, ...overrides }
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(merged).filter(([, v]) => v !== undefined)) as Record<string, string>
    )
    return `/audit-log${qs.size ? `?${qs}` : ''}`
  }

  const entidadesDisponiveis = Object.keys(ENTIDADE_LABELS)

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-slate-400" />
          Audit Log
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Registro de todas as ações realizadas no sistema
        </p>
      </div>

      {/* Filtros — ação */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-slate-400 font-medium w-16 shrink-0">Ação</span>
          <Link
            href={buildUrl({ acao: undefined, page: undefined })}
            className={cn(buttonVariants({ variant: !acaoFiltro ? 'default' : 'outline', size: 'sm' }))}
          >
            Todas
          </Link>
          {Object.entries(ACAO_META).map(([key, meta]) => (
            <Link
              key={key}
              href={buildUrl({ acao: key, page: undefined })}
              className={cn(buttonVariants({ variant: acaoFiltro === key ? 'default' : 'outline', size: 'sm' }))}
            >
              {meta.label}
            </Link>
          ))}
        </div>

        {/* Filtro — entidade */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-slate-400 font-medium w-16 shrink-0">Módulo</span>
          <Link
            href={buildUrl({ entidade: undefined, page: undefined })}
            className={cn(buttonVariants({ variant: !entidadeFiltro ? 'default' : 'outline', size: 'sm' }))}
          >
            Todos
          </Link>
          {entidadesDisponiveis.map((ent) => (
            <Link
              key={ent}
              href={buildUrl({ entidade: ent, page: undefined })}
              className={cn(buttonVariants({ variant: entidadeFiltro === ent ? 'default' : 'outline', size: 'sm' }))}
            >
              {ENTIDADE_LABELS[ent]}
            </Link>
          ))}
        </div>

        {/* Filtro — usuário */}
        {usuarios && usuarios.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-slate-400 font-medium w-16 shrink-0">Usuário</span>
            <Link
              href={buildUrl({ usuario: undefined, page: undefined })}
              className={cn(buttonVariants({ variant: !usuarioFiltro ? 'default' : 'outline', size: 'sm' }))}
            >
              Todos
            </Link>
            {usuarios.map((u) => (
              <Link
                key={u.id}
                href={buildUrl({ usuario: u.id, page: undefined })}
                className={cn(buttonVariants({ variant: usuarioFiltro === u.id ? 'default' : 'outline', size: 'sm' }))}
              >
                {u.nome_completo.split(' ')[0]}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Contagem */}
      <p className="text-sm text-slate-500">
        {count ?? 0} registro{(count ?? 0) !== 1 ? 's' : ''} encontrado{(count ?? 0) !== 1 ? 's' : ''}
      </p>

      {/* Lista */}
      {!logs || logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ShieldCheck className="h-12 w-12 text-slate-200 mb-3" />
          <p className="text-slate-500 font-medium">Nenhum registro encontrado</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {logs.map((log) => {
            const autor = usuarioMap.get(log.usuario_id)
            const acaoMeta = ACAO_META[log.acao] ?? { label: log.acao, class: 'border-slate-200 text-slate-600' }
            const entLabel = ENTIDADE_LABELS[log.entidade] ?? log.entidade

            return (
              <Card key={log.id}>
                <CardContent className="py-2.5 px-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Badge variant="outline" className={cn('text-xs shrink-0', acaoMeta.class)}>
                        {acaoMeta.label}
                      </Badge>
                      <div className="min-w-0">
                        <p className="text-sm text-slate-800 truncate">
                          <span className="font-medium">{entLabel}</span>
                          {log.entidade_id && (
                            <span className="text-slate-400 text-xs ml-1.5 font-mono">
                              #{log.entidade_id.slice(0, 8)}…
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {autor?.nome_completo ?? 'Usuário desconhecido'}
                          {log.ip_address && (
                            <span className="ml-2 font-mono">{log.ip_address}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <time
                      dateTime={log.created_at}
                      className="text-xs text-slate-400 shrink-0 tabular-nums"
                    >
                      {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </time>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          {page > 1 && (
            <Link
              href={buildUrl({ page: String(page - 1) })}
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
            >
              Anterior
            </Link>
          )}
          <span className="text-sm text-slate-500">
            Página {page} de {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={buildUrl({ page: String(page + 1) })}
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
            >
              Próxima
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
