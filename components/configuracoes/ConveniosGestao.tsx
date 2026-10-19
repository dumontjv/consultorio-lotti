'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Pencil, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatarMoeda } from '@/lib/formatters/moeda'
import { cn } from '@/lib/utils'
import type { ConvenioComRegras } from '@/lib/convenios/regras'
import {
  alterarAtivoConvenio,
  salvarConvenio,
  type ConvenioInput,
} from '@/app/(app)/configuracoes/convenios/actions'

interface Profissional {
  id: string
  nome_completo: string
  role: 'medica' | 'psicologa'
}

interface Props {
  convenios: ConvenioComRegras[]
  profissionais: Profissional[]
}

const ROLE_LABEL = { medica: 'Médica', psicologa: 'Psicóloga' }

export function ConveniosGestao({ convenios, profissionais }: Props) {
  const [editando, setEditando] = useState<ConvenioComRegras | 'novo' | null>(null)

  const ordenados = [...convenios].sort(
    (a, b) => Number(b.particular) - Number(a.particular) || Number(b.ativo) - Number(a.ativo) || a.nome.localeCompare(b.nome, 'pt-BR')
  )

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button onClick={() => setEditando('novo')}>
          <Plus className="h-4 w-4 mr-1.5" />
          Novo convênio
        </Button>
      </div>

      {ordenados.map((c) => (
        <LinhaConvenio key={c.id} convenio={c} profissionais={profissionais} onEditar={() => setEditando(c)} />
      ))}

      {editando && (
        <ConvenioDialog
          convenio={editando === 'novo' ? null : editando}
          profissionais={profissionais}
          onFechar={() => setEditando(null)}
        />
      )}
    </div>
  )
}

function LinhaConvenio({
  convenio: c,
  profissionais,
  onEditar,
}: {
  convenio: ConvenioComRegras
  profissionais: Profissional[]
  onEditar: () => void
}) {
  const router = useRouter()
  const [salvando, startTransition] = useTransition()

  function alternarAtivo(ativo: boolean) {
    startTransition(async () => {
      const r = await alterarAtivoConvenio(c.id, ativo)
      if (!r.success) {
        toast.error(r.error)
        return
      }
      toast.success(ativo ? `${c.nome} ativado` : `${c.nome} desativado`)
      router.refresh()
    })
  }

  return (
    <Card className={cn(!c.ativo && 'opacity-60')}>
      <CardContent className="py-3 px-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2">
            <p className="font-medium">{c.nome}</p>
            {c.particular && <Badge variant="secondary">Particular</Badge>}
            {!c.ativo && <Badge variant="outline">Desativado</Badge>}
          </div>
          {c.profissionais.length === 0 ? (
            <p className="text-xs text-amber-700">Nenhuma profissional aceita este convênio.</p>
          ) : (
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {c.profissionais.map((r) => {
                const prof = profissionais.find((p) => p.id === r.profissional_id)
                if (!prof) return null
                return (
                  <li key={r.profissional_id}>
                    <span className="text-foreground">{prof.nome_completo}</span>
                    {c.particular
                      ? r.valor_primeira_consulta != null
                        ? ` · 1ª ${formatarMoeda(r.valor_primeira_consulta)}, demais ${formatarMoeda(r.valor_particular_padrao ?? 0)}`
                        : r.valor_particular_padrao != null && ` · ${formatarMoeda(r.valor_particular_padrao)}`
                      : r.valor_repasse != null
                        ? ` · repasse ${formatarMoeda(r.valor_repasse)}`
                        : <span className="text-amber-700"> · repasse não cadastrado</span>}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {!c.particular && (
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              {salvando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Ativo
              <Switch checked={c.ativo} disabled={salvando} onCheckedChange={(v) => alternarAtivo(v)} />
            </label>
          )}
          <Button variant="outline" size="sm" onClick={onEditar}>
            <Pencil className="h-3.5 w-3.5 mr-1" />
            Editar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

interface LinhaRegra {
  aceita: boolean
  padrao: string
  primeira: string
  repasse: string
}

function paraTexto(v: number | null | undefined) {
  return v == null ? '' : v.toFixed(2).replace('.', ',')
}

function paraNumero(t: string): number | null | 'invalido' {
  const s = t.trim()
  if (!s) return null
  const n = parseFloat(s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s)
  return Number.isNaN(n) || n < 0 ? 'invalido' : n
}

function ConvenioDialog({
  convenio,
  profissionais,
  onFechar,
}: {
  convenio: ConvenioComRegras | null
  profissionais: Profissional[]
  onFechar: () => void
}) {
  const router = useRouter()
  const [salvando, startTransition] = useTransition()
  const [nome, setNome] = useState(convenio?.nome ?? '')
  const [ativo, setAtivo] = useState(convenio?.ativo ?? true)
  const particular = convenio?.particular ?? false

  const [regras, setRegras] = useState<Record<string, LinhaRegra>>(() =>
    Object.fromEntries(
      profissionais.map((p) => {
        const r = convenio?.profissionais.find((x) => x.profissional_id === p.id)
        return [
          p.id,
          {
            aceita: !!r,
            padrao: paraTexto(r?.valor_particular_padrao),
            primeira: paraTexto(r?.valor_primeira_consulta),
            repasse: paraTexto(r?.valor_repasse),
          },
        ]
      })
    )
  )

  function atualizar(id: string, parcial: Partial<LinhaRegra>) {
    setRegras((atual) => ({ ...atual, [id]: { ...atual[id], ...parcial } }))
  }

  function salvar() {
    const linhas: ConvenioInput['profissionais'] = []
    for (const p of profissionais) {
      const r = regras[p.id]
      if (!r?.aceita) continue
      const padrao = paraNumero(r.padrao)
      const primeira = paraNumero(r.primeira)
      const repasse = paraNumero(r.repasse)
      if (padrao === 'invalido' || primeira === 'invalido' || repasse === 'invalido') {
        toast.error(`Valor inválido para ${p.nome_completo}. Use o formato 300,00.`)
        return
      }
      linhas.push({
        profissional_id: p.id,
        valor_particular_padrao: padrao,
        valor_primeira_consulta: primeira,
        valor_repasse: repasse,
      })
    }

    startTransition(async () => {
      const r = await salvarConvenio({ id: convenio?.id, nome, ativo, profissionais: linhas })
      if (!r.success) {
        toast.error(r.error)
        return
      }
      toast.success('Convênio salvo')
      onFechar()
      router.refresh()
    })
  }

  return (
    <Dialog open onOpenChange={(aberto) => !aberto && onFechar()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{convenio ? `Editar ${convenio.nome}` : 'Novo convênio'}</DialogTitle>
          <DialogDescription>
            {particular
              ? 'Valores cobrados no Particular. O valor é sugerido no agendamento e pode ser alterado.'
              : 'O valor de repasse vira o lançamento pendente quando a consulta é marcada como realizada.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="nome-convenio">Nome</Label>
            <Input id="nome-convenio" value={nome} maxLength={80} onChange={(e) => setNome(e.target.value)} />
          </div>

          {!particular && (
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={ativo} onCheckedChange={(v) => setAtivo(v)} />
              Ativo (aparece no agendamento)
            </label>
          )}

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium mb-1">Profissionais que aceitam</legend>
            {profissionais.map((p) => {
              const r = regras[p.id]
              return (
                <div key={p.id} className="rounded-lg border p-3 space-y-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={r.aceita} onCheckedChange={(v) => atualizar(p.id, { aceita: v === true })} />
                    <span className="font-medium">{p.nome_completo}</span>
                    <span className="text-xs text-muted-foreground">({ROLE_LABEL[p.role]})</span>
                  </label>

                  {r.aceita && (
                    particular ? (
                      <div className="grid grid-cols-2 gap-2 pl-6">
                        <div className="space-y-1">
                          <Label htmlFor={`padrao-${p.id}`} className="text-xs">Valor (R$)</Label>
                          <Input
                            id={`padrao-${p.id}`}
                            inputMode="decimal"
                            placeholder="0,00"
                            value={r.padrao}
                            onChange={(e) => atualizar(p.id, { padrao: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`primeira-${p.id}`} className="text-xs">1ª consulta (R$, opcional)</Label>
                          <Input
                            id={`primeira-${p.id}`}
                            inputMode="decimal"
                            placeholder="Igual ao valor"
                            value={r.primeira}
                            onChange={(e) => atualizar(p.id, { primeira: e.target.value })}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="pl-6 max-w-[200px] space-y-1">
                        <Label htmlFor={`repasse-${p.id}`} className="text-xs">Repasse por consulta (R$)</Label>
                        <Input
                          id={`repasse-${p.id}`}
                          inputMode="decimal"
                          placeholder="0,00"
                          value={r.repasse}
                          onChange={(e) => atualizar(p.id, { repasse: e.target.value })}
                        />
                      </div>
                    )
                  )}
                </div>
              )
            })}
          </fieldset>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onFechar} disabled={salvando}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={salvando || nome.trim().length < 2}>
            {salvando && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
