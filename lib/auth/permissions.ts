import type { UserRole } from '@/types/database'

export type Permission =
  | 'pacientes:create'
  | 'pacientes:read'
  | 'pacientes:update'
  | 'pacientes:delete'
  | 'anamnese:read'
  | 'anamnese:write'
  | 'evolucoes:read'
  | 'evolucoes:write'
  | 'documentos:read'
  | 'documentos:create'
  | 'documentos:update'
  | 'agenda:read'
  | 'agenda:write'
  | 'financeiro:read'
  | 'financeiro:write'
  | 'relatorios:read'
  | 'teleconsulta:access'
  | 'cid:read'
  | 'configuracoes:read'
  | 'configuracoes:write'
  | 'usuarios:manage'
  | 'auditoria:read'

const ALL_PERMISSIONS: Permission[] = [
  'pacientes:create',
  'pacientes:read',
  'pacientes:update',
  'pacientes:delete',
  'anamnese:read',
  'anamnese:write',
  'evolucoes:read',
  'evolucoes:write',
  'documentos:read',
  'documentos:create',
  'documentos:update',
  'agenda:read',
  'agenda:write',
  'financeiro:read',
  'financeiro:write',
  'relatorios:read',
  'teleconsulta:access',
  'cid:read',
  'configuracoes:read',
  'configuracoes:write',
  'usuarios:manage',
  'auditoria:read',
]

const PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: ALL_PERMISSIONS,

  medica: [
    'pacientes:create',
    'pacientes:read',
    'pacientes:update',
    'anamnese:read',
    'anamnese:write',
    'evolucoes:read',
    'evolucoes:write',
    'documentos:read',
    'documentos:create',
    'documentos:update',
    'agenda:read',
    'agenda:write',
    'financeiro:read',
    'financeiro:write',
    'relatorios:read',
    'teleconsulta:access',
    'cid:read',
    'configuracoes:read',
  ],

  psicologa: [
    'pacientes:create',
    'pacientes:read',
    'pacientes:update',
    'anamnese:read',
    'anamnese:write',
    'evolucoes:read',
    'evolucoes:write',
    'documentos:read',
    'documentos:create',
    'documentos:update',
    'agenda:read',
    'agenda:write',
    'financeiro:read',
    'financeiro:write',
    'relatorios:read',
    'teleconsulta:access',
    'cid:read',
    'configuracoes:read',
  ],

  secretaria: [
    'pacientes:create',
    'pacientes:read',
    'pacientes:update',
    'documentos:read',
    'agenda:read',
    'agenda:write',
    'financeiro:read',
    'financeiro:write',
  ],
}

/**
 * Verifica se um role tem uma permissão específica.
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return PERMISSIONS[role]?.includes(permission) ?? false
}

/**
 * Verifica se um role tem pelo menos uma das permissões listadas.
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p))
}

/**
 * Verifica se um role tem todas as permissões listadas.
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p))
}

/**
 * Retorna a lista completa de permissões de um role.
 */
export function getPermissions(role: UserRole): Permission[] {
  return PERMISSIONS[role] ?? []
}
