-- ============================================================
-- Migration 005: Soft delete em evoluções/documentos e despesas sem paciente
-- ============================================================

-- 1. Soft delete em evolucoes
ALTER TABLE evolucoes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_evolucoes_deleted ON evolucoes(deleted_at) WHERE deleted_at IS NULL;

-- 2. Soft delete em documentos
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_documentos_deleted ON documentos(deleted_at) WHERE deleted_at IS NULL;

-- 3. Tornar paciente_id opcional em financeiro (despesas operacionais sem paciente)
--    NULLs são ignorados pela FK — basta remover o NOT NULL.
ALTER TABLE financeiro ALTER COLUMN paciente_id DROP NOT NULL;

-- 4. Adicionar 'despesa' ao enum financeiro_tipo
ALTER TYPE financeiro_tipo ADD VALUE IF NOT EXISTS 'despesa';
