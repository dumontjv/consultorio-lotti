import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { ShieldCheck } from 'lucide-react'

export default function AuditLogLoading() {
  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-slate-400" />
          Audit Log
        </h1>
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Filtros */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-wrap gap-2 items-center">
            <Skeleton className="h-3 w-16" />
            {Array.from({ length: 5 }).map((_, j) => (
              <Skeleton key={j} className="h-8 w-20 rounded-md" />
            ))}
          </div>
        ))}
      </div>

      <Skeleton className="h-4 w-40" />

      {/* Lista */}
      <div className="space-y-1.5">
        {Array.from({ length: 12 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="py-2.5 px-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <Skeleton className="h-5 w-20 rounded-full shrink-0" />
                  <div className="space-y-1.5 min-w-0">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
                <Skeleton className="h-3 w-28 shrink-0" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
