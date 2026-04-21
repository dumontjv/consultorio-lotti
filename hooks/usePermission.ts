'use client'

import { useUser } from './useUser'
import { hasPermission, hasAnyPermission, type Permission } from '@/lib/auth/permissions'

/**
 * Hook para verificar permissões do usuário autenticado em Client Components.
 *
 * @example
 * const { can, isAdmin } = usePermission()
 * if (can('pacientes:create')) { ... }
 */
export function usePermission() {
  const { user, loading } = useUser()

  return {
    /** Verifica se o usuário possui uma permissão específica */
    can: (permission: Permission): boolean =>
      user ? hasPermission(user.role, permission) : false,

    /** Verifica se o usuário possui pelo menos uma das permissões listadas */
    canAny: (permissions: Permission[]): boolean =>
      user ? hasAnyPermission(user.role, permissions) : false,

    /** Role atual do usuário autenticado */
    role: user?.role ?? null,

    /** Atalhos para verificação rápida de papel */
    isAdmin: user?.role === 'admin',
    isMedica: user?.role === 'medica',
    isPsicologa: user?.role === 'psicologa',
    isSecretaria: user?.role === 'secretaria',

    /** Indica se o perfil ainda está sendo carregado */
    loading,
  }
}
