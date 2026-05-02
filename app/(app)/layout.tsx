import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import type { UserRole } from '@/types/database'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('nome_completo, role, email, foto_url')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        userRole={profile.role as UserRole}
        userName={profile.nome_completo}
        userEmail={profile.email}
        userFotoUrl={profile.foto_url}
      />
      <main className="md:pl-60 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</div>
      </main>
    </div>
  )
}
