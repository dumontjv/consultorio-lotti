import { describe, it, expect } from 'vitest'
import { conveniosAceitos, escolherConvenioInicial, type ConvenioComRegras } from '../regras'

const MED = 'med'
const PSI = 'psi'

function conv(id: string, nome: string, profs: string[], extra: Partial<ConvenioComRegras> = {}): ConvenioComRegras {
  return {
    id,
    nome,
    ativo: true,
    particular: false,
    profissionais: profs.map((p) => ({
      profissional_id: p,
      valor_particular_padrao: null,
      valor_primeira_consulta: null,
      valor_repasse: null,
    })),
    ...extra,
  }
}

const convenios = [
  conv('unimed', 'Unimed', [MED]),
  conv('amil', 'Amil', [MED]),
  conv('petro', 'Petrobras', [MED, PSI]),
  conv('part', 'Particular', [MED, PSI], { particular: true }),
  conv('velho', 'Antigo', [MED], { ativo: false }),
]

describe('conveniosAceitos', () => {
  it('filtra pela profissional e coloca o Particular primeiro', () => {
    expect(conveniosAceitos(convenios, PSI).map((c) => c.id)).toEqual(['part', 'petro'])
    expect(conveniosAceitos(convenios, MED).map((c) => c.id)).toEqual(['part', 'amil', 'petro', 'unimed'])
  })

  it('esconde inativos, exceto o já gravado na consulta', () => {
    expect(conveniosAceitos(convenios, MED).some((c) => c.id === 'velho')).toBe(false)
    expect(conveniosAceitos(convenios, MED, 'velho').some((c) => c.id === 'velho')).toBe(true)
  })

  it('sem profissional não há opções', () => {
    expect(conveniosAceitos(convenios, null)).toEqual([])
  })
})

describe('escolherConvenioInicial', () => {
  it('usa o convênio do paciente quando aceito', () => {
    const aceitos = conveniosAceitos(convenios, MED)
    expect(escolherConvenioInicial(aceitos, { id: 'amil', nome: 'Amil' })).toEqual({ convenioId: 'amil', aviso: null })
  })

  it('cai para Particular com aviso quando a profissional não aceita', () => {
    const r = escolherConvenioInicial(conveniosAceitos(convenios, PSI), { id: 'amil', nome: 'Amil' })
    expect(r.convenioId).toBe('part')
    expect(r.aviso).toContain('Amil')
  })

  it('paciente sem convênio fica no Particular sem aviso', () => {
    expect(escolherConvenioInicial(conveniosAceitos(convenios, PSI), null)).toEqual({ convenioId: 'part', aviso: null })
  })
})
