'use client'

import { useState, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import Link from 'next/link'

interface CidCodigo {
  id: string
  codigo: string
  descricao: string
  categoria: string | null
  capitulo: string | null
  versao: string
}

interface CidBuscaProps {
  codigos: CidCodigo[]
  categorias: string[]
  buscaInicial: string
  categoriaInicial: string
}

export function CidBusca({ codigos, categorias, buscaInicial, categoriaInicial }: CidBuscaProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [, startTransition] = useTransition()
  const [busca, setBusca] = useState(buscaInicial)

  function navegar(q: string, cat?: string) {
    const p = new URLSearchParams()
    if (q.trim().length >= 2) p.set('q', q.trim())
    if (cat) p.set('categoria', cat)
    startTransition(() => {
      router.push(`${pathname}?${p.toString()}`)
    })
  }

  let debounceTimer: ReturnType<typeof setTimeout>

  function onBuscaChange(v: string) {
    setBusca(v)
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      navegar(v, categoriaInicial || undefined)
    }, 400)
  }

  return (
    <div className="space-y-4">
      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por código (ex: F41) ou descrição..."
          value={busca}
          onChange={(e) => onBuscaChange(e.target.value)}
          className="pl-9"
          autoFocus
        />
      </div>

      {/* Filtros de categoria */}
      {categorias.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <Link
            href={pathname + (busca.length >= 2 ? `?q=${encodeURIComponent(busca)}` : '')}
            className={cn(
              buttonVariants({ variant: !categoriaInicial ? 'default' : 'outline', size: 'sm' })
            )}
          >
            Todas
          </Link>
          {categorias.slice(0, 10).map((cat) => (
            <button
              key={cat}
              onClick={() => navegar(busca, cat)}
              className={cn(
                buttonVariants({
                  variant: categoriaInicial === cat ? 'default' : 'outline',
                  size: 'sm',
                })
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Resultados */}
      {busca.length < 2 && !categoriaInicial ? (
        <div className="text-center py-12 text-slate-400">
          <Search className="h-10 w-10 mx-auto mb-3 text-slate-200" />
          <p className="text-sm">Digite pelo menos 2 caracteres para buscar</p>
        </div>
      ) : codigos.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <p className="text-sm">Nenhum código encontrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-slate-400">
            {codigos.length === 50
              ? 'Mostrando os primeiros 50 resultados'
              : `${codigos.length} resultado${codigos.length !== 1 ? 's' : ''}`}
          </p>
          {codigos.map((cid) => (
            <Card key={cid.id}>
              <CardContent className="py-3 px-4">
                <div className="flex items-start gap-3">
                  <Badge
                    variant="secondary"
                    className="font-mono text-sm shrink-0 mt-0.5"
                  >
                    {cid.codigo}
                  </Badge>
                  <div className="min-w-0">
                    <p className="text-sm text-slate-800 font-medium">{cid.descricao}</p>
                    {(cid.categoria || cid.capitulo) && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {[cid.capitulo, cid.categoria].filter(Boolean).join(' › ')}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
