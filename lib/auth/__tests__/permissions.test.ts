import { describe, it, expect } from 'vitest'
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getPermissions,
} from '../permissions'

describe('hasPermission', () => {
  it('admin tem todas as permissões', () => {
    expect(hasPermission('admin', 'auditoria:read')).toBe(true)
    expect(hasPermission('admin', 'usuarios:manage')).toBe(true)
    expect(hasPermission('admin', 'configuracoes:write')).toBe(true)
  })

  it('médica tem permissão clínica', () => {
    expect(hasPermission('medica', 'evolucoes:write')).toBe(true)
    expect(hasPermission('medica', 'teleconsulta:access')).toBe(true)
  })

  it('médica não tem permissão de admin', () => {
    expect(hasPermission('medica', 'auditoria:read')).toBe(false)
    expect(hasPermission('medica', 'usuarios:manage')).toBe(false)
  })

  it('psicóloga tem permissão clínica', () => {
    expect(hasPermission('psicologa', 'anamnese:write')).toBe(true)
    expect(hasPermission('psicologa', 'financeiro:write')).toBe(true)
  })

  it('psicóloga não tem permissão de admin', () => {
    expect(hasPermission('psicologa', 'configuracoes:write')).toBe(false)
  })

  it('secretária tem permissão de agenda', () => {
    expect(hasPermission('secretaria', 'agenda:write')).toBe(true)
    expect(hasPermission('secretaria', 'financeiro:read')).toBe(true)
  })

  it('secretária não acessa prontuário clínico', () => {
    expect(hasPermission('secretaria', 'evolucoes:read')).toBe(false)
    expect(hasPermission('secretaria', 'anamnese:read')).toBe(false)
  })

  it('retorna false para role inexistente', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(hasPermission('inexistente' as any, 'agenda:read')).toBe(false)
  })
})

describe('hasAnyPermission', () => {
  it('retorna true se tiver pelo menos uma permissão', () => {
    expect(hasAnyPermission('secretaria', ['evolucoes:read', 'agenda:read'])).toBe(true)
  })

  it('retorna false se não tiver nenhuma', () => {
    expect(hasAnyPermission('secretaria', ['evolucoes:read', 'anamnese:read'])).toBe(false)
  })

  it('retorna false para lista vazia', () => {
    expect(hasAnyPermission('admin', [])).toBe(false)
  })
})

describe('hasAllPermissions', () => {
  it('retorna true somente se tiver todas as permissões', () => {
    expect(hasAllPermissions('medica', ['evolucoes:read', 'evolucoes:write'])).toBe(true)
  })

  it('retorna false se faltar alguma', () => {
    expect(hasAllPermissions('secretaria', ['agenda:read', 'evolucoes:read'])).toBe(false)
  })

  it('retorna true para lista vazia', () => {
    expect(hasAllPermissions('secretaria', [])).toBe(true)
  })
})

describe('getPermissions', () => {
  it('retorna array não vazio para roles válidas', () => {
    expect(getPermissions('admin').length).toBeGreaterThan(0)
    expect(getPermissions('medica').length).toBeGreaterThan(0)
    expect(getPermissions('secretaria').length).toBeGreaterThan(0)
  })

  it('admin tem mais permissões do que secretária', () => {
    expect(getPermissions('admin').length).toBeGreaterThan(getPermissions('secretaria').length)
  })

  it('retorna array vazio para role inexistente', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(getPermissions('inexistente' as any)).toEqual([])
  })
})
