'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useTransition, useCallback } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface PacientesBuscaProps {
  buscaInicial?: string
  filtroInicial?: string
}

export function PacientesBusca({ buscaInicial = '', filtroInicial }: PacientesBuscaProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const navigate = useCallback(
    (busca: string, filtro?: string) => {
      const params = new URLSearchParams()
      if (busca) params.set('busca', busca)
      if (filtro) params.set('filtro', filtro)
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`)
      })
    },
    [router, pathname]
  )

  const filtroAtual = searchParams.get('filtro') ?? filtroInicial

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <Input
          type="search"
          placeholder="Buscar por nome..."
          defaultValue={buscaInicial}
          className="pl-8"
          onChange={(e) => {
            const v = e.target.value
            if (v.length === 0 || v.length >= 2) {
              navigate(v, filtroAtual ?? undefined)
            }
          }}
        />
      </div>
      <div className="flex gap-1.5">
        <Button
          variant={filtroAtual === 'medica' ? 'default' : 'outline'}
          size="sm"
          onClick={() => navigate(buscaInicial, filtroAtual === 'medica' ? undefined : 'medica')}
          className={filtroAtual === 'medica' ? 'bg-teal-600 hover:bg-teal-700' : ''}
        >
          Médica
        </Button>
        <Button
          variant={filtroAtual === 'psicologa' ? 'default' : 'outline'}
          size="sm"
          onClick={() =>
            navigate(buscaInicial, filtroAtual === 'psicologa' ? undefined : 'psicologa')
          }
          className={filtroAtual === 'psicologa' ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
        >
          Psicóloga
        </Button>
      </div>
    </div>
  )
}
