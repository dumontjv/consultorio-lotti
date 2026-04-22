'use client'

import { useState, useTransition } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { criarEvolucao, atualizarEvolucao } from '@/app/(app)/pacientes/[id]/evolucoes/actions'

const formSchema = z.object({
  profissional_id: z.string().min(1, 'Selecione um profissional'),
  conteudo: z.string().min(1, 'Descrição da evolução obrigatória'),
  hipotese_diagnostica: z.string().optional(),
  conduta: z.string().optional(),
  pa_sistolica: z.string().optional(),
  pa_diastolica: z.string().optional(),
  fc: z.string().optional(),
  temperatura: z.string().optional(),
  spo2: z.string().optional(),
  peso: z.string().optional(),
  altura: z.string().optional(),
  glicemia: z.string().optional(),
  dor_escala: z.string().optional(),
  exame_geral: z.string().optional(),
  exame_outros: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface EvolucaoFormProps {
  pacienteId: string
  profissionais: { id: string; nome_completo: string; role: string }[]
  evolucao?: {
    id: string
    profissional_id: string
    conteudo: string
    hipotese_diagnostica?: string | null
    conduta?: string | null
    cids?: string[] | null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sinais_vitais?: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    exame_fisico?: any
  }
}

export function EvolucaoForm({ pacienteId, profissionais, evolucao }: EvolucaoFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [submitting, setSubmitting] = useState(false)

  const [cids, setCids] = useState<string[]>(evolucao?.cids ?? [])
  const [cidBusca, setCidBusca] = useState('')
  const [cidResultados, setCidResultados] = useState<{ codigo: string; descricao: string }[]>([])
  const [buscandoCid, setBuscandoCid] = useState(false)

  const editing = !!evolucao

  const sv = evolucao?.sinais_vitais ?? {}
  const ef = evolucao?.exame_fisico ?? {}

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      profissional_id: evolucao?.profissional_id ?? '',
      conteudo: evolucao?.conteudo ?? '',
      hipotese_diagnostica: evolucao?.hipotese_diagnostica ?? '',
      conduta: evolucao?.conduta ?? '',
      pa_sistolica: sv.pa_sistolica?.toString() ?? '',
      pa_diastolica: sv.pa_diastolica?.toString() ?? '',
      fc: sv.fc?.toString() ?? '',
      temperatura: sv.temperatura?.toString() ?? '',
      spo2: sv.spo2?.toString() ?? '',
      peso: sv.peso?.toString() ?? '',
      altura: sv.altura?.toString() ?? '',
      glicemia: sv.glicemia?.toString() ?? '',
      dor_escala: sv.dor_escala?.toString() ?? '',
      exame_geral: ef.geral ?? '',
      exame_outros: ef.outros ?? '',
    },
  })

  async function buscarCid(texto: string) {
    if (texto.length < 2) {
      setCidResultados([])
      return
    }
    setBuscandoCid(true)
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('cid_codigos')
        .select('codigo, descricao')
        .or(`codigo.ilike.%${texto}%,descricao.ilike.%${texto}%`)
        .limit(8)
      setCidResultados(data ?? [])
    } finally {
      setBuscandoCid(false)
    }
  }

  function adicionarCid(codigo: string) {
    if (!cids.includes(codigo)) setCids((prev) => [...prev, codigo])
    setCidBusca('')
    setCidResultados([])
  }

  function removerCid(codigo: string) {
    setCids((prev) => prev.filter((c) => c !== codigo))
  }

  function toNum(v: string | undefined) {
    if (!v || v.trim() === '') return undefined
    const n = parseFloat(v.replace(',', '.'))
    return isNaN(n) ? undefined : n
  }

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    try {
      const payload = {
        paciente_id: pacienteId,
        profissional_id: values.profissional_id,
        conteudo: values.conteudo,
        hipotese_diagnostica: values.hipotese_diagnostica?.trim() || undefined,
        conduta: values.conduta?.trim() || undefined,
        cids: cids.length > 0 ? cids : undefined,
        sinais_vitais: {
          pa_sistolica: toNum(values.pa_sistolica),
          pa_diastolica: toNum(values.pa_diastolica),
          fc: toNum(values.fc),
          temperatura: toNum(values.temperatura),
          spo2: toNum(values.spo2),
          peso: toNum(values.peso),
          altura: toNum(values.altura),
          glicemia: toNum(values.glicemia),
          dor_escala: toNum(values.dor_escala),
        },
        exame_fisico: {
          geral: values.exame_geral?.trim() || undefined,
          outros: values.exame_outros?.trim() || undefined,
        },
      }

      const result = editing
        ? await atualizarEvolucao(evolucao!.id, payload)
        : await criarEvolucao(payload)

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success(editing ? 'Evolução atualizada!' : 'Evolução registrada!')
      startTransition(() => {
        router.push(`/pacientes/${pacienteId}/evolucoes`)
        router.refresh()
      })
    } finally {
      setSubmitting(false)
    }
  }

  const isLoading = submitting || isPending

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Profissional */}
      <div className="space-y-1">
        <Label>
          Profissional <span className="text-destructive">*</span>
        </Label>
        <Controller
          control={control}
          name="profissional_id"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o profissional" />
              </SelectTrigger>
              <SelectContent>
                {profissionais.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nome_completo}{' '}
                    <span className="text-muted-foreground text-xs ml-1">
                      ({p.role === 'medica' ? 'Médica' : 'Psicóloga'})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.profissional_id && (
          <p className="text-xs text-destructive">{errors.profissional_id.message}</p>
        )}
      </div>

      {/* Sinais vitais */}
      <div>
        <p className="text-sm font-medium text-slate-700 mb-3">Sinais Vitais</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label htmlFor="pa_sistolica" className="text-xs">PA Sistólica (mmHg)</Label>
            <Input id="pa_sistolica" type="number" placeholder="120" {...register('pa_sistolica')} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="pa_diastolica" className="text-xs">PA Diastólica (mmHg)</Label>
            <Input id="pa_diastolica" type="number" placeholder="80" {...register('pa_diastolica')} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="fc" className="text-xs">FC (bpm)</Label>
            <Input id="fc" type="number" placeholder="72" {...register('fc')} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="temperatura" className="text-xs">Temperatura (°C)</Label>
            <Input id="temperatura" type="number" step="0.1" placeholder="36.5" {...register('temperatura')} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="spo2" className="text-xs">SpO₂ (%)</Label>
            <Input id="spo2" type="number" placeholder="98" {...register('spo2')} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="peso" className="text-xs">Peso (kg)</Label>
            <Input id="peso" type="number" step="0.1" placeholder="70.0" {...register('peso')} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="altura" className="text-xs">Altura (cm)</Label>
            <Input id="altura" type="number" placeholder="170" {...register('altura')} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="glicemia" className="text-xs">Glicemia (mg/dL)</Label>
            <Input id="glicemia" type="number" placeholder="100" {...register('glicemia')} />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="dor_escala" className="text-xs">Escala de Dor (0–10)</Label>
            <Input id="dor_escala" type="number" min={0} max={10} placeholder="0" {...register('dor_escala')} />
          </div>
        </div>
      </div>

      {/* Evolução */}
      <div className="space-y-1">
        <Label htmlFor="conteudo">
          Evolução / Anamnese <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="conteudo"
          rows={5}
          placeholder="Descreva a evolução clínica do paciente..."
          aria-invalid={!!errors.conteudo}
          {...register('conteudo')}
        />
        {errors.conteudo && (
          <p className="text-xs text-destructive">{errors.conteudo.message}</p>
        )}
      </div>

      {/* Exame físico resumido */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-slate-700">Exame Físico</p>
        <div className="space-y-1">
          <Label htmlFor="exame_geral" className="text-xs">Estado geral</Label>
          <Textarea id="exame_geral" rows={2} placeholder="Bom estado geral, corado, hidratado..." {...register('exame_geral')} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="exame_outros" className="text-xs">Outros achados</Label>
          <Textarea id="exame_outros" rows={2} placeholder="Outros achados relevantes..." {...register('exame_outros')} />
        </div>
      </div>

      {/* Hipótese diagnóstica */}
      <div className="space-y-1">
        <Label htmlFor="hipotese_diagnostica">Hipótese Diagnóstica</Label>
        <Input
          id="hipotese_diagnostica"
          placeholder="Ex: Hipertensão arterial não controlada"
          {...register('hipotese_diagnostica')}
        />
      </div>

      {/* CIDs */}
      <div className="space-y-2">
        <Label>CID-10</Label>
        {cids.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {cids.map((codigo) => (
              <Badge key={codigo} variant="secondary" className="text-xs font-mono gap-1">
                {codigo}
                <button
                  type="button"
                  onClick={() => removerCid(codigo)}
                  className="hover:text-destructive transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <div className="relative">
          <Input
            placeholder="Buscar por código ou descrição (ex: F41, ansiedade)..."
            value={cidBusca}
            onChange={(e) => {
              setCidBusca(e.target.value)
              buscarCid(e.target.value)
            }}
          />
          {buscandoCid && (
            <p className="text-xs text-muted-foreground mt-1">Buscando...</p>
          )}
          {cidResultados.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 border border-input rounded-lg shadow-sm bg-white z-10 overflow-hidden">
              {cidResultados.map((r) => (
                <button
                  key={r.codigo}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors border-b border-input last:border-0"
                  onClick={() => adicionarCid(r.codigo)}
                >
                  <span className="font-mono font-medium text-slate-700">{r.codigo}</span>
                  <span className="text-slate-500 ml-2">{r.descricao}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Conduta */}
      <div className="space-y-1">
        <Label htmlFor="conduta">Conduta</Label>
        <Textarea
          id="conduta"
          rows={3}
          placeholder="Descreva a conduta terapêutica..."
          {...register('conduta')}
        />
      </div>

      {/* Ações */}
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : editing ? (
            'Salvar alterações'
          ) : (
            'Registrar evolução'
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isLoading}
          onClick={() => router.back()}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}
