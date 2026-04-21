import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/esqueci-senha', '/confirmar-email']

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/pacientes',
  '/agenda',
  '/documentos',
  '/financeiro',
  '/cid',
  '/teleconsulta',
  '/configuracoes',
]

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/'))
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  )
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Atualiza a sessão — necessário para Server Components lerem a sessão atualizada
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Usuário autenticado tentando acessar /login → redireciona para /dashboard
  if (user && isPublicRoute(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Usuário não autenticado tentando acessar rota protegida → redireciona para /login
  if (!user && isProtectedRoute(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Corresponde a todos os caminhos EXCETO:
     * - _next/static  (arquivos estáticos)
     * - _next/image   (otimização de imagens)
     * - favicon.ico, logos, e arquivos de imagem comuns
     */
    '/((?!_next/static|_next/image|favicon.ico|logos|.*\\.svg|.*\\.png|.*\\.jpg).*)',
  ],
}
