'use client'

import { useState, useTransition } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
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
import { criarDocumento, atualizarDocumento } from '@/app/(app)/pacientes/[id]/documentos/actions'

const formSchema = z.object({
  profissional_id: z.string().min(1, 'Selecione um profissional'),
  tipo: z.enum(['receita', 'laudo', 'atestado', 'caso_clinico', 'solicitacao_exame', 'relatorio']),
  titulo: z.string().min(1, 'Título obrigatório'),
  conteudo: z.string().min(1, 'Conteúdo obrigatório'),
  data_emissao: z.string().min(1, 'Data de emissão obrigatória'),
  status: z.enum(['rascunho', 'assinado', 'entregue', 'cancelado']),
})

type FormValues = z.infer<typeof formSchema>

interface DocumentoFormProps {
  pacienteId: string
  profissionais: { id: string; nome_completo: string; role: string }[]
  documento?: {
    id: string
    profissional_id: string
    tipo: FormValues['tipo']
    titulo: string
    conteudo: string
    data_emissao: string
    status: FormValues['status']
  }
}

const TIPO_OPTIONS = [
  { value: 'receita', label: 'Receita Médica' },
  { value: 'laudo', label: 'Laudo' },
  { value: 'atestado', label: 'Atestado' },
  { value: 'caso_clinico', label: 'Caso Clínico' },
  { value: 'solicitacao_exame', label: 'Solicitação de Exame' },
  { value: 'relatorio', label: 'Relatório' },
]

const STATUS_OPTIONS = [
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'assinado', label: 'Assinado' },
  { value: 'entregue', label: 'Entregue' },
  { value: 'cancelado', label: 'Cancelado' },
]

export function DocumentoForm({ pacienteId, profissionais, documento }: DocumentoFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [submitting, setSubmitting] = useState(false)

  const editing = !!documento

  const today = new Date().toISOString().split('T')[0]

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      profissional_id: documento?.profissional_id ?? '',
      tipo: documento?.tipo ?? 'receita',
      titulo: documento?.titulo ?? '',
      conteudo: documento?.conteudo ?? '',
      data_emissao: documento?.data_emissao ?? today,
      status: documento?.status ?? 'rascunho',
    },
  })

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    try {
      const payload = { ...values, paciente_id: pacienteId }
      const result = editing
        ? await atualizarDocumento(documento!.id, payload)
        : await criarDocumento(payload)

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success(editing ? 'Documento atualizado!' : 'Documento criado!')
      startTransition(() => {
        router.push(`/pacientes/${pacienteId}/documentos`)
        router.refresh()
      })
    } finally {
      setSubmitting(false)
    }
  }

  const isLoading = submitting || isPending

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {profissionais.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome_completo}
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

        {/* Tipo */}
        <div className="space-y-1">
          <Label>
            Tipo de documento <span className="text-destructive">*</span>
          </Label>
          <Controller
            control={control}
            name="tipo"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPO_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* Data de emissão */}
        <div className="space-y-1">
          <Label htmlFor="data_emissao">
            Data de emissão <span className="text-destructive">*</span>
          </Label>
          <Input
            id="data_emissao"
            type="date"
            aria-invalid={!!errors.data_emissao}
            {...register('data_emissao')}
          />
          {errors.data_emissao && (
            <p className="text-xs text-destructive">{errors.data_emissao.message}</p>
          )}
        </div>

        {/* Status */}
        <div className="space-y-1">
          <Label>Status</Label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      {/* Título */}
      <div className="space-y-1">
        <Label htmlFor="titulo">
          Título <span className="text-destructive">*</span>
        </Label>
        <Input
          id="titulo"
          placeholder="Ex: Receita — Losartana 50mg"
          aria-invalid={!!errors.titulo}
          {...register('titulo')}
        />
        {errors.titulo && <p className="text-xs text-destructive">{errors.titulo.message}</p>}
      </div>

      {/* Conteúdo */}
      <div className="space-y-1">
        <Label htmlFor="conteudo">
          Conteúdo <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="conteudo"
          rows={10}
          placeholder="Redija o conteúdo do documento..."
          aria-invalid={!!errors.conteudo}
          {...register('conteudo')}
          className="font-mono text-sm"
        />
        {errors.conteudo && <p className="text-xs text-destructive">{errors.conteudo.message}</p>}
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
            'Criar documento'
          )}
        </Button>
        <Button type="button" variant="outline" disabled={isLoading} onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
