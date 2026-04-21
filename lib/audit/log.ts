import { createClient } from '@/lib/supabase/server'
import type { AuditAcao } from '@/types/database'

export interface AuditLogParams {
  acao: AuditAcao
  entidade: string
  entidadeId?: string
  dadosAnteriores?: Record<string, unknown>
  dadosNovos?: Record<string, unknown>
  /** Request opcional — usado para extrair IP e User-Agent */
  request?: Request
}

/**
 * Registra uma entrada no log de auditoria.
 * Deve ser chamado apenas em Server Actions ou Route Handlers.
 *
 * Falhas silenciosas: erros de auditoria não propagam exceções
 * para não interromper a operação principal do usuário.
 */
export async function registrarAuditoria(params: AuditLogParams): Promise<void> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const ipAddress = params.request
      ? params.request.headers.get('x-forwarded-for') ??
        params.request.headers.get('x-real-ip') ??
        null
      : null

    const userAgent = params.request
      ? params.request.headers.get('user-agent')
      : null

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabase.from('audit_log').insert({
      usuario_id: user.id,
      acao: params.acao,
      entidade: params.entidade,
      entidade_id: params.entidadeId ?? null,
      dados_anteriores: params.dadosAnteriores ?? null,
      dados_novos: params.dadosNovos ?? null,
      ip_address: ipAddress,
      user_agent: userAgent,
    } as any)
  } catch (error) {
    // Auditoria nunca deve quebrar o fluxo principal
    console.error('[Auditoria] Erro ao registrar log:', error)
  }
}
