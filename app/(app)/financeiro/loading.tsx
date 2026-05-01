import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { DollarSign } from 'lucide-react'

export default function FinanceiroLoading() {
  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-slate-400" />
            Financeiro
          </h1>
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-9 w-36 rounded-md" />
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-28" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Navegação de meses */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-28 rounded-md" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-28 rounded-md" />
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-md" />
        ))}
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-64" />
                </div>
                <Skeleton className="h-6 w-24 shrink-0" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
