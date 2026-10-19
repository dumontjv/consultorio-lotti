-- Migration 007: novo status para agendamentos feitos pela página pública /agendar
-- Separada da 008 porque um valor novo de enum não pode ser usado na mesma transação.
--
-- Atenção: no banco em produção a coluna consultas.status usa o enum `status_consulta`
-- (o tipo `consulta_status` da migration 001 existe, mas não é usado por nenhuma tabela).

ALTER TYPE status_consulta ADD VALUE IF NOT EXISTS 'pendente_confirmacao';
