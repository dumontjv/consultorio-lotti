import type { Metadata } from 'next'
import Image from 'next/image'
import { createAdminClient } from '@/lib/supabase/admin'
import { AgendamentoWizard } from '@/components/agendar/AgendamentoWizard'
import { TELEFONES_CLINICA } from '@/lib/agendamento/contato'
import { carregarConvenios } from '@/lib/convenios/servidor'
import { conveniosAceitos } from '@/lib/convenios/regras'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Agendar consulta',
  description: 'Agende sua consulta online',
}

export default async function AgendarPage() {
  const admin = createAdminClient()

  const [{ data: profissionais }, { data: config }, convenios] = await Promise.all([
    admin
      .from('profiles')
      .select('id, nome_completo, role')
      .eq('ativo', true)
      .in('role', ['medica', 'psicologa'])
      .not('disponibilidade', 'is', null)
      .order('nome_completo'),
    admin.from('configuracoes').select('consultorio_nome').eq('id', 1).maybeSingle(),
    carregarConvenios(admin),
  ])

  const nomeClinica = config?.consultorio_nome || 'Pronto'

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background">
      <header className="border-b bg-white dark:bg-card">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Image src="/logos/logo-consultorio.svg" alt="" width={36} height={36} />
          <div>
            <p className="font-semibold text-slate-900 dark:text-foreground">{nomeClinica}</p>
            <p className="text-xs text-muted-foreground">Agendamento online</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <AgendamentoWizard
          profissionais={(profissionais ?? []).map((p) => ({
            id: p.id,
            nome_completo: p.nome_completo,
            role: p.role as 'medica' | 'psicologa',
            // Só nome e tipo: valores e repasses não vão para a página pública
            convenios: conveniosAceitos(convenios, p.id).map((c) => ({
              id: c.id,
              nome: c.nome,
              particular: c.particular,
            })),
          })).filter((p) => p.convenios.length > 0)}
        />
      </main>

      <footer className="max-w-3xl mx-auto px-4 pb-8 text-center text-xs text-muted-foreground">
        Dúvidas? Ligue {TELEFONES_CLINICA.join(' ou ')}
      </footer>
    </div>
  )
}
