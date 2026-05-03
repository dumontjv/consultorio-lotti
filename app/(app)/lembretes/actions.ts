'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { registrarAuditoria } from '@/lib/audit/log'

type ActionResult = { success: boolean; error?: string }

export async function registrarLembreteWhatsApp(
  consultaId: string,
  pacienteId: string,
  mensagem: string
): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { data, error } = await supabase
    .from('lembretes')
    .insert({
      consulta_id: consultaId,
      paciente_id: pacienteId,
      canal: 'whatsapp',
      status: 'enviado',
      mensagem,
      enviado_em: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) return { success: false, error: 'Erro ao registrar lembrete' }

  await registrarAuditoria({ acao: 'create', entidade: 'lembretes', entidadeId: data.id })
  revalidatePath('/lembretes')
  return { success: true }
}
