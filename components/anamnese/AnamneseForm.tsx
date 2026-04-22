'use client'

import { useState, useTransition } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { salvarAnamnese } from '@/app/(app)/pacientes/[id]/anamnese/actions'

const formSchema = z.object({
  hda: z.string().optional(),
  atividade_fisica: z.boolean().optional(),
  sedentario: z.boolean().optional(),
  menarca: z.string().optional(),
  menopausa: z.string().optional(),
  // HAS
  has_tem: z.boolean().optional(),
  has_descricao: z.string().optional(),
  has_medicacao: z.string().optional(),
  // DM
  dm_tem: z.boolean().optional(),
  dm_tipo: z.string().optional(),
  dm_medicacao: z.string().optional(),
  dm_insulina: z.boolean().optional(),
  // Cirurgias
  cirurgias_tem: z.boolean().optional(),
  cirurgias: z.array(z.object({ descricao: z.string(), ano: z.string().optional() })).optional(),
  // Alergias
  alergias: z.array(z.object({ nome: z.string(), reacao: z.string().optional() })).optional(),
  // Medicações regulares
  medicacoes: z
    .array(
      z.object({
        nome: z.string(),
        dose: z.string().optional(),
        frequencia: z.string().optional(),
      })
    )
    .optional(),
  // Tabagismo
  tabagismo: z.boolean().optional(),
  ex_fumante: z.boolean().optional(),
  cigarros_dia: z.string().optional(),
  anos_fumando: z.string().optional(),
  // Etilismo
  etilismo_frequencia: z.string().optional(),
  etilismo_doses: z.string().optional(),
  // Histórico familiar
  hf_has: z.boolean().optional(),
  hf_dm: z.boolean().optional(),
  hf_cardiopatia: z.boolean().optional(),
  hf_doenca_mental: z.boolean().optional(),
  hf_outras: z.string().optional(),
  // Ginecológico
  gesta: z.string().optional(),
  para: z.string().optional(),
  aborto: z.string().optional(),
  cesarea: z.string().optional(),
  // Outras patologias
  outras_patologias: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildPayload(pacienteId: string, values: FormValues, isGynecologica: boolean): any {
  const toNum = (v: string | undefined) => {
    if (!v || v.trim() === '') return undefined
    const n = parseInt(v)
    return isNaN(n) ? undefined : n
  }

  return {
    paciente_id: pacienteId,
    hda: values.hda?.trim() || undefined,
    atividade_fisica: values.atividade_fisica,
    sedentario: values.sedentario,
    menarca: isGynecologica ? values.menarca || null : undefined,
    menopausa: isGynecologica ? values.menopausa || null : undefined,
    has: {
      tem: values.has_tem ?? false,
      descricao: values.has_descricao?.trim() || undefined,
      medicacao: values.has_medicacao?.trim() || undefined,
    },
    dm: {
      tem: values.dm_tem ?? false,
      tipo: values.dm_tipo || undefined,
      medicacao: values.dm_medicacao?.trim() || undefined,
      insulina: values.dm_insulina,
    },
    cirurgias: {
      tem: values.cirurgias_tem ?? false,
      lista: (values.cirurgias ?? [])
        .filter((c) => c.descricao.trim())
        .map((c) => ({ descricao: c.descricao, ano: toNum(c.ano) })),
    },
    alergia_medicamentosa: {
      medicamentos: (values.alergias ?? [])
        .filter((a) => a.nome.trim())
        .map((a) => ({ nome: a.nome, reacao: a.reacao?.trim() || undefined })),
    },
    medicacao_regular: {
      lista: (values.medicacoes ?? [])
        .filter((m) => m.nome.trim())
        .map((m) => ({
          nome: m.nome,
          dose: m.dose?.trim() || undefined,
          frequencia: m.frequencia?.trim() || undefined,
        })),
    },
    tabagismo: {
      ex_fumante: values.ex_fumante ?? false,
      cigarros_dia: values.tabagismo ? toNum(values.cigarros_dia) : undefined,
      anos_fumando: values.tabagismo ? toNum(values.anos_fumando) : undefined,
    },
    etilismo: {
      frequencia: values.etilismo_frequencia || undefined,
      doses_semana: toNum(values.etilismo_doses),
    },
    historico_familiar: {
      has: values.hf_has,
      dm: values.hf_dm,
      cardiopatia: values.hf_cardiopatia,
      doenca_mental: values.hf_doenca_mental,
      outras: values.hf_outras?.trim() || undefined,
    },
    gesta: isGynecologica
      ? {
          gesta: toNum(values.gesta),
          para: toNum(values.para),
          aborto: toNum(values.aborto),
          cesarea: toNum(values.cesarea),
        }
      : undefined,
    outras_patologias: values.outras_patologias
      ? { lista: values.outras_patologias.split('\n').filter(Boolean) }
      : undefined,
  }
}

interface AnamneseFormProps {
  pacienteId: string
  genero?: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  anamnese?: any
}

export function AnamneseForm({ pacienteId, genero, anamnese }: AnamneseFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [submitting, setSubmitting] = useState(false)

  const isGynecologica = genero === 'feminino'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sv = anamnese as any

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors: _errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hda: sv?.hda ?? '',
      atividade_fisica: sv?.atividade_fisica ?? false,
      sedentario: sv?.sedentario ?? false,
      menarca: sv?.menarca ?? '',
      menopausa: sv?.menopausa ?? '',
      has_tem: sv?.has?.tem ?? false,
      has_descricao: sv?.has?.descricao ?? '',
      has_medicacao: sv?.has?.medicacao ?? '',
      dm_tem: sv?.dm?.tem ?? false,
      dm_tipo: sv?.dm?.tipo ?? '',
      dm_medicacao: sv?.dm?.medicacao ?? '',
      dm_insulina: sv?.dm?.insulina ?? false,
      cirurgias_tem: sv?.cirurgias?.tem ?? false,
      cirurgias: sv?.cirurgias?.lista ?? [],
      alergias: sv?.alergia_medicamentosa?.medicamentos ?? [],
      medicacoes: sv?.medicacao_regular?.lista ?? [],
      tabagismo: (sv?.tabagismo?.cigarros_dia ?? 0) > 0,
      ex_fumante: sv?.tabagismo?.ex_fumante ?? false,
      cigarros_dia: sv?.tabagismo?.cigarros_dia?.toString() ?? '',
      anos_fumando: sv?.tabagismo?.anos_fumando?.toString() ?? '',
      etilismo_frequencia: sv?.etilismo?.frequencia ?? '',
      etilismo_doses: sv?.etilismo?.doses_semana?.toString() ?? '',
      hf_has: sv?.historico_familiar?.has ?? false,
      hf_dm: sv?.historico_familiar?.dm ?? false,
      hf_cardiopatia: sv?.historico_familiar?.cardiopatia ?? false,
      hf_doenca_mental: sv?.historico_familiar?.doenca_mental ?? false,
      hf_outras: sv?.historico_familiar?.outras ?? '',
      gesta: sv?.gesta?.gesta?.toString() ?? '',
      para: sv?.gesta?.para?.toString() ?? '',
      aborto: sv?.gesta?.aborto?.toString() ?? '',
      cesarea: sv?.gesta?.cesarea?.toString() ?? '',
      outras_patologias: (sv?.outras_patologias?.lista ?? []).join('\n'),
    },
  })

  const {
    fields: cirurgiasFields,
    append: appendCirurgia,
    remove: removeCirurgia,
  } = useFieldArray({ control, name: 'cirurgias' })

  const {
    fields: alergiasFields,
    append: appendAlergia,
    remove: removeAlergia,
  } = useFieldArray({ control, name: 'alergias' })

  const {
    fields: medicacoesFields,
    append: appendMedicacao,
    remove: removeMedicacao,
  } = useFieldArray({ control, name: 'medicacoes' })

  const hasTem = watch('has_tem')
  const dmTem = watch('dm_tem')
  const cirurgiasTem = watch('cirurgias_tem')
  const tabagismo = watch('tabagismo')

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    try {
      const payload = buildPayload(pacienteId, values, isGynecologica)
      const result = await salvarAnamnese(pacienteId, payload)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success('Anamnese salva!')
      startTransition(() => router.refresh())
    } finally {
      setSubmitting(false)
    }
  }

  const isLoading = submitting || isPending

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* HDA */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">História da Doença Atual (HDA)</h3>
        <Textarea
          rows={4}
          placeholder="Descreva a queixa principal e história atual..."
          {...register('hda')}
        />
      </section>

      <Separator />

      {/* Antecedentes pessoais */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-700">Antecedentes Pessoais</h3>

        {/* HAS */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Controller
              control={control}
              name="has_tem"
              render={({ field }) => (
                <Checkbox
                  id="has_tem"
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="has_tem" className="cursor-pointer">Hipertensão Arterial (HAS)</Label>
          </div>
          {hasTem && (
            <div className="ml-6 grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Medicação</Label>
                <Input placeholder="Ex: Losartana 50mg" {...register('has_medicacao')} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Observações</Label>
                <Input placeholder="Controlada, descontrolada..." {...register('has_descricao')} />
              </div>
            </div>
          )}
        </div>

        {/* DM */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Controller
              control={control}
              name="dm_tem"
              render={({ field }) => (
                <Checkbox
                  id="dm_tem"
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="dm_tem" className="cursor-pointer">Diabetes Mellitus (DM)</Label>
          </div>
          {dmTem && (
            <div className="ml-6 grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Tipo</Label>
                <Controller
                  control={control}
                  name="dm_tipo"
                  render={({ field }) => (
                    <Select value={field.value ?? ''} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tipo1">Tipo 1</SelectItem>
                        <SelectItem value="tipo2">Tipo 2</SelectItem>
                        <SelectItem value="gestacional">Gestacional</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Medicação</Label>
                <Input placeholder="Metformina..." {...register('dm_medicacao')} />
              </div>
              <div className="flex items-center gap-2 mt-5">
                <Controller
                  control={control}
                  name="dm_insulina"
                  render={({ field }) => (
                    <Checkbox
                      id="dm_insulina"
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor="dm_insulina" className="text-xs cursor-pointer">Usa insulina</Label>
              </div>
            </div>
          )}
        </div>

        {/* Cirurgias */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Controller
              control={control}
              name="cirurgias_tem"
              render={({ field }) => (
                <Checkbox
                  id="cirurgias_tem"
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="cirurgias_tem" className="cursor-pointer">Cirurgias prévias</Label>
          </div>
          {cirurgiasTem && (
            <div className="ml-6 space-y-2">
              {cirurgiasFields.map((field, idx) => (
                <div key={field.id} className="flex items-center gap-2">
                  <Input
                    placeholder="Ex: Apendicectomia"
                    {...register(`cirurgias.${idx}.descricao`)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Ano"
                    type="number"
                    {...register(`cirurgias.${idx}.ano`)}
                    className="w-24"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => removeCirurgia(idx)}
                  >
                    <Trash2 className="h-4 w-4 text-rose-400" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendCirurgia({ descricao: '', ano: '' })}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Adicionar cirurgia
              </Button>
            </div>
          )}
        </div>

        {/* Outras patologias */}
        <div className="space-y-1">
          <Label>Outras patologias / comorbidades</Label>
          <Textarea
            rows={2}
            placeholder="Uma por linha: Hipotireoidismo, Asma, Artrose..."
            {...register('outras_patologias')}
          />
        </div>
      </section>

      <Separator />

      {/* Medicações regulares */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">Medicação de Uso Regular</h3>
        {medicacoesFields.map((field, idx) => (
          <div key={field.id} className="flex items-center gap-2">
            <Input
              placeholder="Medicamento"
              {...register(`medicacoes.${idx}.nome`)}
              className="flex-1"
            />
            <Input
              placeholder="Dose"
              {...register(`medicacoes.${idx}.dose`)}
              className="w-28"
            />
            <Input
              placeholder="Frequência"
              {...register(`medicacoes.${idx}.frequencia`)}
              className="w-32"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => removeMedicacao(idx)}
            >
              <Trash2 className="h-4 w-4 text-rose-400" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => appendMedicacao({ nome: '', dose: '', frequencia: '' })}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Adicionar medicação
        </Button>
      </section>

      <Separator />

      {/* Alergias */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">Alergias a Medicamentos</h3>
        {alergiasFields.map((field, idx) => (
          <div key={field.id} className="flex items-center gap-2">
            <Input
              placeholder="Medicamento"
              {...register(`alergias.${idx}.nome`)}
              className="flex-1"
            />
            <Input
              placeholder="Reação"
              {...register(`alergias.${idx}.reacao`)}
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => removeAlergia(idx)}
            >
              <Trash2 className="h-4 w-4 text-rose-400" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => appendAlergia({ nome: '', reacao: '' })}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Adicionar alergia
        </Button>
      </section>

      <Separator />

      {/* Hábitos */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-700">Hábitos de Vida</h3>

        {/* Atividade física */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Controller
              control={control}
              name="atividade_fisica"
              render={({ field }) => (
                <Checkbox
                  id="atividade_fisica"
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="atividade_fisica" className="cursor-pointer">Pratica atividade física</Label>
          </div>
          <div className="flex items-center gap-2">
            <Controller
              control={control}
              name="sedentario"
              render={({ field }) => (
                <Checkbox
                  id="sedentario"
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="sedentario" className="cursor-pointer">Sedentário</Label>
          </div>
        </div>

        {/* Tabagismo */}
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Controller
                control={control}
                name="tabagismo"
                render={({ field }) => (
                  <Checkbox
                    id="tabagismo"
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="tabagismo" className="cursor-pointer">Tabagismo ativo</Label>
            </div>
            <div className="flex items-center gap-2">
              <Controller
                control={control}
                name="ex_fumante"
                render={({ field }) => (
                  <Checkbox
                    id="ex_fumante"
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="ex_fumante" className="cursor-pointer">Ex-tabagista</Label>
            </div>
          </div>
          {tabagismo && (
            <div className="ml-6 flex gap-3">
              <div className="space-y-1 w-32">
                <Label className="text-xs">Cigarros/dia</Label>
                <Input type="number" {...register('cigarros_dia')} />
              </div>
              <div className="space-y-1 w-32">
                <Label className="text-xs">Anos fumando</Label>
                <Input type="number" {...register('anos_fumando')} />
              </div>
            </div>
          )}
        </div>

        {/* Etilismo */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Consumo de álcool</Label>
            <Controller
              control={control}
              name="etilismo_frequencia"
              render={({ field }) => (
                <Select value={field.value ?? ''} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nunca">Nunca</SelectItem>
                    <SelectItem value="raramente">Raramente</SelectItem>
                    <SelectItem value="socialmente">Socialmente</SelectItem>
                    <SelectItem value="semanalmente">Semanalmente</SelectItem>
                    <SelectItem value="diariamente">Diariamente</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Doses por semana</Label>
            <Input type="number" placeholder="0" {...register('etilismo_doses')} />
          </div>
        </div>
      </section>

      <Separator />

      {/* Histórico familiar */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">Histórico Familiar</h3>
        <div className="flex flex-wrap gap-4">
          {[
            { name: 'hf_has' as const, label: 'HAS' },
            { name: 'hf_dm' as const, label: 'Diabetes' },
            { name: 'hf_cardiopatia' as const, label: 'Cardiopatia' },
            { name: 'hf_doenca_mental' as const, label: 'Doença mental' },
          ].map(({ name, label }) => (
            <div key={name} className="flex items-center gap-2">
              <Controller
                control={control}
                name={name}
                render={({ field }) => (
                  <Checkbox
                    id={name}
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor={name} className="cursor-pointer">{label}</Label>
            </div>
          ))}
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Outros antecedentes familiares</Label>
          <Input placeholder="Ex: Câncer de mama, AVC..." {...register('hf_outras')} />
        </div>
      </section>

      {/* Ginecológico — só para pacientes do sexo feminino */}
      {isGynecologica && (
        <>
          <Separator />
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700">Histórico Ginecológico</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Menarca</Label>
                <Input type="date" {...register('menarca')} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Menopausa</Label>
                <Input type="date" {...register('menopausa')} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Gesta</Label>
                <Input type="number" min={0} {...register('gesta')} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Para</Label>
                <Input type="number" min={0} {...register('para')} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Aborto</Label>
                <Input type="number" min={0} {...register('aborto')} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Cesárea</Label>
                <Input type="number" min={0} {...register('cesarea')} />
              </div>
            </div>
          </section>
        </>
      )}

      {/* Ações */}
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar anamnese'
          )}
        </Button>
      </div>
    </form>
  )
}
