import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BookOpen } from 'lucide-react'
import { CidBusca } from '@/components/cid/CidBusca'

interface PageProps {
  searchParams: Promise<{ q?: string; categoria?: string }>
}

export default async function CidPage({ searchParams }: PageProps) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const busca = params.q?.trim() ?? ''
  const categoriaFiltro = params.categoria?.trim() ?? ''

  let query = supabase
    .from('cid_codigos')
    .select('id, codigo, descricao, categoria, capitulo, versao')
    .eq('versao', 'cid10')
    .order('codigo', { ascending: true })
    .limit(50)

  if (busca.length >= 2) {
    query = query.or(`codigo.ilike.%${busca}%,descricao.ilike.%${busca}%`)
  }
  if (categoriaFiltro) {
    query = query.eq('categoria', categoriaFiltro)
  }

  const { data: codigos } = await query

  // Busca categorias distintas para o filtro
  const { data: categorias } = await supabase
    .from('cid_codigos')
    .select('categoria')
    .eq('versao', 'cid10')
    .not('categoria', 'is', null)
    .order('categoria')

  const categoriasList = [
    ...new Set((categorias ?? []).map((c) => c.categoria).filter(Boolean)),
  ] as string[]

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-slate-400" />
          CID-10
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Classificação Internacional de Doenças — busca por código ou descrição
        </p>
      </div>

      <CidBusca
        codigos={codigos ?? []}
        categorias={categoriasList}
        buscaInicial={busca}
        categoriaInicial={categoriaFiltro}
      />
    </div>
  )
}
