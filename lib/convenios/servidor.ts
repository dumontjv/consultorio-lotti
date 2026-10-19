import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { ConvenioComRegras } from './regras'

type Cliente = SupabaseClient<Database>

export async function carregarConvenios(supabase: Cliente): Promise<ConvenioComRegras[]> {
  const [{ data: convenios }, { data: regras }] = await Promise.all([
    supabase.from('convenios').select('id, nome, ativo, particular').order('nome'),
    supabase
      .from('convenio_profissional')
      .select('convenio_id, profissional_id, valor_particular_padrao, valor_primeira_consulta, valor_repasse'),
  ])

  return (convenios ?? []).map((c) => ({
    ...c,
    profissionais: (regras ?? [])
      .filter((r) => r.convenio_id === c.id)
      .map((r) => ({
        profissional_id: r.profissional_id,
        valor_particular_padrao: r.valor_particular_padrao === null ? null : Number(r.valor_particular_padrao),
        valor_primeira_consulta: r.valor_primeira_consulta === null ? null : Number(r.valor_primeira_consulta),
        valor_repasse: r.valor_repasse === null ? null : Number(r.valor_repasse),
      })),
  }))
}

export type ConvenioVerificado =
  | { ok: true; id: string; nome: string; particular: boolean; valorRepasse: number | null }
  | { ok: false; erro: string }

/**
 * Garante que a profissional aceita o convênio. Convênio desativado só é aceito
 * quando já era o da consulta sendo editada.
 */
export async function verificarConvenioAceito(
  supabase: Cliente,
  profissionalId: string,
  convenioId: string,
  convenioAtualDaConsulta?: string | null
): Promise<ConvenioVerificado> {
  const { data } = await supabase
    .from('convenio_profissional')
    .select('valor_repasse, convenio:convenios(id, nome, ativo, particular)')
    .eq('profissional_id', profissionalId)
    .eq('convenio_id', convenioId)
    .maybeSingle()

  const convenio = Array.isArray(data?.convenio) ? data?.convenio[0] : data?.convenio
  if (!data || !convenio) {
    return { ok: false, erro: 'A profissional selecionada não atende por este convênio.' }
  }
  if (!convenio.ativo && convenio.id !== convenioAtualDaConsulta) {
    return { ok: false, erro: `O convênio ${convenio.nome} está desativado.` }
  }

  return {
    ok: true,
    id: convenio.id,
    nome: convenio.nome,
    particular: convenio.particular,
    valorRepasse: data.valor_repasse === null ? null : Number(data.valor_repasse),
  }
}
