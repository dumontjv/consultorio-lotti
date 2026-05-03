'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface RelatoriosFiltrosProps {
  profissionais: Array<{ id: string; nome_completo: string; role: string }>
  periodoAtual: string
  profissionalAtual: string
  mostrarProfissional?: boolean
}

const PERIODOS = [
  { value: '1m', label: 'Este mês' },
  { value: 'mes_passado', label: 'Mês passado' },
  { value: '3m', label: 'Últimos 3 meses' },
  { value: '6m', label: 'Últimos 6 meses' },
  { value: 'ano', label: 'Este ano' },
  { value: 'ano_passado', label: 'Ano passado' },
]

export function RelatoriosFiltros({
  profissionais,
  periodoAtual,
  profissionalAtual,
  mostrarProfissional = true,
}: RelatoriosFiltrosProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const atualizar = useCallback(
    (chave: string, valor: string) => {
      const params = new URLSearchParams(searchParams?.toString() ?? '')
      params.set(chave, valor)
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={periodoAtual} onValueChange={(v) => v && atualizar('periodo', v)}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          {PERIODOS.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {mostrarProfissional && (
        <Select value={profissionalAtual} onValueChange={(v) => v && atualizar('profissional', v)}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Profissional" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os profissionais</SelectItem>
            {profissionais.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.nome_completo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
