import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Users } from 'lucide-react'

export default function PacientesLoading() {
  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-slate-400" />
            Pacientes
          </h1>
          <Skeleton className="h-4 w-36" />
        </div>
        <Skeleton className="h-9 w-36 rounded-md" />
      </div>

      {/* Busca */}
      <Skeleton className="h-10 w-full rounded-md" />

      {/* Lista */}
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-64" />
                  </div>
                </div>
                <Skeleton className="h-5 w-16 rounded-full shrink-0" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
