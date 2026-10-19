-- Migration 008: agendamento online (página pública /agendar)

-- ── Colunas novas em consultas ──────────────────────────────
ALTER TABLE consultas
  ADD COLUMN IF NOT EXISTS origem TEXT NOT NULL DEFAULT 'interno'
    CHECK (origem IN ('interno', 'online')),
  ADD COLUMN IF NOT EXISTS protocolo TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS motivo TEXT,
  ADD COLUMN IF NOT EXISTS solicitante_nome TEXT,
  ADD COLUMN IF NOT EXISTS solicitante_telefone TEXT,
  ADD COLUMN IF NOT EXISTS solicitante_email TEXT;

CREATE INDEX IF NOT EXISTS idx_consultas_prof_data ON consultas(profissional_id, data);

-- ── Controle de limite por IP (IP guardado apenas como hash) ─
CREATE TABLE IF NOT EXISTS agendamento_online_log (
  id BIGSERIAL PRIMARY KEY,
  ip_hash TEXT NOT NULL,
  consulta_id UUID REFERENCES consultas(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agendamento_online_log_ip
  ON agendamento_online_log(ip_hash, created_at DESC);

-- Sem policies: só o service role acessa
ALTER TABLE agendamento_online_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON agendamento_online_log FROM anon, authenticated;

-- ── Criação atômica do agendamento ──────────────────────────
-- Serializa as reservas com advisory lock para que duas pessoas não
-- peguem o mesmo horário e o limite por IP não seja burlado em paralelo.
CREATE OR REPLACE FUNCTION criar_agendamento_online(
  p_profissional_id UUID,
  p_data DATE,
  p_hora_inicio TIME,
  p_hora_fim TIME,
  p_nome TEXT,
  p_telefone TEXT,
  p_email TEXT,
  p_cpf TEXT,
  p_motivo TEXT,
  p_ip_hash TEXT,
  p_limite_por_hora INT DEFAULT 5
)
RETURNS TABLE (id_consulta UUID, numero_protocolo TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_paciente_id UUID;
  v_paciente_deletado TIMESTAMPTZ;
  v_consulta_id UUID;
  v_protocolo TEXT;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('criar_agendamento_online'));

  IF (
    SELECT COUNT(*) FROM agendamento_online_log l
    WHERE l.ip_hash = p_ip_hash AND l.created_at > NOW() - INTERVAL '1 hour'
  ) >= p_limite_por_hora THEN
    RAISE EXCEPTION 'LIMITE_EXCEDIDO';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_profissional_id AND ativo AND role IN ('medica', 'psicologa')
  ) THEN
    RAISE EXCEPTION 'PROFISSIONAL_INVALIDO';
  END IF;

  IF EXISTS (
    SELECT 1 FROM consultas c
    WHERE c.profissional_id = p_profissional_id
      AND c.data = p_data
      AND c.status <> 'cancelada'
      AND c.hora_inicio < p_hora_fim
      AND c.hora_fim > p_hora_inicio
  ) THEN
    RAISE EXCEPTION 'HORARIO_OCUPADO';
  END IF;

  -- Reaproveita paciente pelo CPF (cpf é UNIQUE mesmo entre excluídos)
  IF p_cpf IS NOT NULL THEN
    SELECT id, deleted_at INTO v_paciente_id, v_paciente_deletado
    FROM pacientes WHERE cpf = p_cpf LIMIT 1;

    IF v_paciente_id IS NOT NULL AND v_paciente_deletado IS NOT NULL THEN
      UPDATE pacientes SET deleted_at = NULL, updated_at = NOW() WHERE id = v_paciente_id;
    END IF;
  END IF;

  IF v_paciente_id IS NULL THEN
    INSERT INTO pacientes (
      nome_completo, cpf, telefone_principal, email,
      consentimento_lgpd_aceito, consentimento_lgpd_data, consentimento_lgpd_ip
    ) VALUES (
      -- consentimento_lgpd_ip é INET; o IP real não é guardado, só o hash no log
      p_nome, p_cpf, p_telefone, p_email,
      true, NOW(), NULL
    )
    RETURNING id INTO v_paciente_id;
  END IF;

  v_protocolo := 'AG' || to_char(NOW() AT TIME ZONE 'America/Sao_Paulo', 'YYMMDD')
    || '-' || upper(substr(md5(gen_random_uuid()::text), 1, 6));

  INSERT INTO consultas (
    paciente_id, profissional_id, tipo, data, hora_inicio, hora_fim, status,
    origem, protocolo, motivo, solicitante_nome, solicitante_telefone, solicitante_email
  ) VALUES (
    v_paciente_id, p_profissional_id, 'presencial', p_data, p_hora_inicio, p_hora_fim,
    'pendente_confirmacao', 'online', v_protocolo, p_motivo, p_nome, p_telefone, p_email
  )
  RETURNING id INTO v_consulta_id;

  INSERT INTO agendamento_online_log (ip_hash, consulta_id) VALUES (p_ip_hash, v_consulta_id);

  RETURN QUERY SELECT v_consulta_id, v_protocolo;
END;
$$;

-- Só o servidor (service role) pode chamar — evita burlar o limite via API pública
REVOKE ALL ON FUNCTION criar_agendamento_online(UUID, DATE, TIME, TIME, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION criar_agendamento_online(UUID, DATE, TIME, TIME, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INT)
  TO service_role;
