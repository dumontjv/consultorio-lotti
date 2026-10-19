export interface ConvenioProfissionalRegra {
  profissional_id: string
  valor_particular_padrao: number | null
  valor_primeira_consulta: number | null
  valor_repasse: number | null
}

export interface ConvenioComRegras {
  id: string
  nome: string
  ativo: boolean
  particular: boolean
  profissionais: ConvenioProfissionalRegra[]
}

/**
 * Convênios que a profissional aceita, com o Particular primeiro.
 * `manterId` mantém na lista um convênio já gravado na consulta mesmo que tenha sido desativado.
 */
export function conveniosAceitos<T extends ConvenioComRegras>(
  convenios: T[],
  profissionalId: string | null | undefined,
  manterId?: string | null
): T[] {
  if (!profissionalId) return []
  return convenios
    .filter(
      (c) =>
        (c.ativo || c.id === manterId) &&
        c.profissionais.some((p) => p.profissional_id === profissionalId)
    )
    .sort((a, b) => Number(b.particular) - Number(a.particular) || a.nome.localeCompare(b.nome, 'pt-BR'))
}

/**
 * Convênio a pré-selecionar ao escolher paciente/profissional: o do paciente se a
 * profissional aceitar; senão o Particular, com aviso quando o do paciente foi recusado.
 */
export function escolherConvenioInicial(
  aceitos: Pick<ConvenioComRegras, 'id' | 'nome' | 'particular'>[],
  convenioDoPaciente: Pick<ConvenioComRegras, 'id' | 'nome'> | null
): { convenioId: string | null; aviso: string | null } {
  const particular = aceitos.find((c) => c.particular) ?? null

  if (convenioDoPaciente) {
    if (aceitos.some((c) => c.id === convenioDoPaciente.id)) {
      return { convenioId: convenioDoPaciente.id, aviso: null }
    }
    return {
      convenioId: particular?.id ?? null,
      aviso: `A profissional não atende pelo convênio ${convenioDoPaciente.nome} do paciente. Selecionado Particular.`,
    }
  }

  return { convenioId: particular?.id ?? null, aviso: null }
}
