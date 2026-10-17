-- Migration 006: Adiciona coluna de disponibilidade semanal em profiles
-- Estrutura: { "segunda": { "ativo": true, "horarios": [{ "inicio": "08:00", "fim": "12:00" }] }, ... }

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS disponibilidade JSONB DEFAULT NULL;

COMMENT ON COLUMN profiles.disponibilidade IS
  'Horários de atendimento por dia da semana. Formato: {"segunda": {"ativo": true, "horarios": [{"inicio": "08:00", "fim": "18:00"}]}}';
