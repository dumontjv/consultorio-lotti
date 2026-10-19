export interface ConvenioFiltro {
  id: string
  nome: string
  particular: boolean
}

/** Só aceita o id de um convênio existente — o valor entra em filtros do PostgREST. */
export function resolverFiltroConvenio(
  param: string | null | undefined,
  convenios: ConvenioFiltro[]
): ConvenioFiltro | null {
  if (!param || param === 'todos') return null
  return convenios.find((c) => c.id === param) ?? null
}

/**
 * Filtro do financeiro por convênio. No Particular entram também os lançamentos
 * manuais (sem convênio), exceto os marcados com forma de pagamento "convênio".
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function filtrarFinanceiroPorConvenio<Q extends { eq: any; or: any }>(
  query: Q,
  convenio: ConvenioFiltro | null
): Q {
  if (!convenio) return query
  if (!convenio.particular) return query.eq('convenio_id', convenio.id)
  return query
    .or(`convenio_id.is.null,convenio_id.eq.${convenio.id}`)
    .or('forma_pagamento.is.null,forma_pagamento.neq.convenio')
}
