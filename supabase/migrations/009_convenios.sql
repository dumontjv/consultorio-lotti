-- Migration 009: gestão de convênios + convênio na consulta
--
-- Nomes reais conferidos no banco em produção (2026-10-19):
--   consultas.status → status_consulta | financeiro.forma_pagamento → forma_pagamento (já tem 'convenio')
--   financeiro.status → status_financeiro | profiles.role → user_role | helper: get_user_role()

-- ── Tabelas ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS convenios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL CHECK (length(trim(nome)) > 0),
  ativo BOOLEAN NOT NULL DEFAULT true,
  -- Marca o "Particular": é o único com valores próprios e não pode ser desativado pela tela
  particular BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_convenios_nome ON convenios (lower(trim(nome)));
CREATE UNIQUE INDEX IF NOT EXISTS uq_convenios_particular ON convenios (particular) WHERE particular;

CREATE TABLE IF NOT EXISTS convenio_profissional (
  convenio_id UUID NOT NULL REFERENCES convenios(id) ON DELETE CASCADE,
  profissional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- Só para o Particular
  valor_particular_padrao NUMERIC(10,2) CHECK (valor_particular_padrao >= 0),
  valor_primeira_consulta NUMERIC(10,2) CHECK (valor_primeira_consulta >= 0),
  -- Só para convênios: quanto o plano repassa por consulta (vira o lançamento pendente)
  valor_repasse NUMERIC(10,2) CHECK (valor_repasse >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (convenio_id, profissional_id)
);

CREATE INDEX IF NOT EXISTS idx_convenio_profissional_prof ON convenio_profissional(profissional_id);

-- ── Seed ────────────────────────────────────────────────────
INSERT INTO convenios (nome, particular) VALUES
  ('Particular', true), ('Amil', false), ('Unimed', false), ('Petrobras', false)
ON CONFLICT DO NOTHING;

-- Médica: Particular (R$ 300), Amil, Unimed, Petrobras
INSERT INTO convenio_profissional (convenio_id, profissional_id, valor_particular_padrao)
SELECT c.id, p.id, CASE WHEN c.particular THEN 300.00 END
FROM convenios c CROSS JOIN profiles p
WHERE p.role = 'medica' AND p.ativo
  AND lower(c.nome) IN ('particular', 'amil', 'unimed', 'petrobras')
ON CONFLICT DO NOTHING;

-- Psicóloga: Particular (R$ 80 na 1ª consulta, R$ 200 nas seguintes), Petrobras
INSERT INTO convenio_profissional (convenio_id, profissional_id, valor_particular_padrao, valor_primeira_consulta)
SELECT c.id, p.id,
  CASE WHEN c.particular THEN 200.00 END,
  CASE WHEN c.particular THEN 80.00 END
FROM convenios c CROSS JOIN profiles p
WHERE p.role = 'psicologa' AND p.ativo
  AND lower(c.nome) IN ('particular', 'petrobras')
ON CONFLICT DO NOTHING;

-- ── Pacientes: texto → convenio_id (o texto antigo é mantido) ─
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS convenio_id UUID REFERENCES convenios(id);

-- Nomes que não existem na lista viram convênios novos (sem profissionais, para o admin revisar).
-- "Outro" era só uma opção genérica do formulário: fica sem convenio_id, com o texto preservado.
INSERT INTO convenios (nome)
SELECT DISTINCT ON (lower(trim(convenio_nome))) trim(convenio_nome)
FROM pacientes
WHERE convenio_nome IS NOT NULL
  AND trim(convenio_nome) <> ''
  AND lower(trim(convenio_nome)) <> 'outro'
ON CONFLICT DO NOTHING;

UPDATE pacientes p
SET convenio_id = c.id
FROM convenios c
WHERE p.convenio_id IS NULL
  AND p.convenio_nome IS NOT NULL
  AND lower(trim(p.convenio_nome)) = lower(trim(c.nome));

-- ── Consultas ───────────────────────────────────────────────
ALTER TABLE consultas
  ADD COLUMN IF NOT EXISTS convenio_id UUID REFERENCES convenios(id),
  ADD COLUMN IF NOT EXISTS numero_carteirinha TEXT,
  ADD COLUMN IF NOT EXISTS numero_guia TEXT;

UPDATE consultas SET convenio_id = (SELECT id FROM convenios WHERE particular)
WHERE convenio_id IS NULL;

ALTER TABLE consultas ALTER COLUMN convenio_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_consultas_convenio ON consultas(convenio_id);

-- ── Financeiro: convênio do lançamento (para faturar por plano) ─
ALTER TABLE financeiro ADD COLUMN IF NOT EXISTS convenio_id UUID REFERENCES convenios(id);
CREATE INDEX IF NOT EXISTS idx_financeiro_convenio ON financeiro(convenio_id);

-- ── RLS ─────────────────────────────────────────────────────
ALTER TABLE convenios ENABLE ROW LEVEL SECURITY;
ALTER TABLE convenio_profissional ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS convenios_select ON convenios;
CREATE POLICY convenios_select ON convenios FOR SELECT
  USING (get_user_role() IS NOT NULL);
DROP POLICY IF EXISTS convenios_admin ON convenios;
CREATE POLICY convenios_admin ON convenios FOR ALL
  USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');

DROP POLICY IF EXISTS convenio_profissional_select ON convenio_profissional;
CREATE POLICY convenio_profissional_select ON convenio_profissional FOR SELECT
  USING (get_user_role() IS NOT NULL);
DROP POLICY IF EXISTS convenio_profissional_admin ON convenio_profissional;
CREATE POLICY convenio_profissional_admin ON convenio_profissional FOR ALL
  USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');

-- Antes, quem não era admin só via o próprio perfil: a secretária não listava as
-- profissionais na agenda. Agora toda a equipe lê o perfil das profissionais.
DROP POLICY IF EXISTS profiles_select_profissionais ON profiles;
CREATE POLICY profiles_select_profissionais ON profiles FOR SELECT
  USING (role IN ('medica', 'psicologa') AND get_user_role() IS NOT NULL);

-- ── Regra de valor do Particular (fica no banco) ────────────
-- Retorna o valor sugerido para a consulta, ou NULL quando não é Particular.
-- "Primeira consulta" = o paciente não tem outra consulta agendada, confirmada ou
-- realizada com a profissional (canceladas e faltas não contam).
CREATE OR REPLACE FUNCTION valor_sugerido_consulta(
  p_profissional_id UUID,
  p_convenio_id UUID,
  p_paciente_id UUID,
  p_ignorar_consulta_id UUID DEFAULT NULL
)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN cp.valor_primeira_consulta IS NOT NULL
      AND p_paciente_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM consultas c
        WHERE c.paciente_id = p_paciente_id
          AND c.profissional_id = p_profissional_id
          AND c.status IN ('agendada', 'confirmada', 'compareceu')
          AND c.id IS DISTINCT FROM p_ignorar_consulta_id
      )
    THEN cp.valor_primeira_consulta
    ELSE cp.valor_particular_padrao
  END
  FROM convenio_profissional cp
  JOIN convenios cv ON cv.id = cp.convenio_id AND cv.particular
  WHERE cp.convenio_id = p_convenio_id AND cp.profissional_id = p_profissional_id;
$$;

REVOKE ALL ON FUNCTION valor_sugerido_consulta(UUID, UUID, UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION valor_sugerido_consulta(UUID, UUID, UUID, UUID) TO authenticated, service_role;

-- ── Agendamento online passa a receber o convênio ───────────
DROP FUNCTION IF EXISTS criar_agendamento_online(UUID, DATE, TIME, TIME, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INT);

CREATE FUNCTION criar_agendamento_online(
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
  p_convenio_id UUID,
  p_numero_carteirinha TEXT,
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
  v_particular BOOLEAN;
  v_convenio_nome TEXT;
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

  SELECT cv.particular, cv.nome INTO v_particular, v_convenio_nome
  FROM convenio_profissional cp
  JOIN convenios cv ON cv.id = cp.convenio_id AND cv.ativo
  WHERE cp.convenio_id = p_convenio_id AND cp.profissional_id = p_profissional_id;

  IF v_particular IS NULL THEN
    RAISE EXCEPTION 'CONVENIO_NAO_ACEITO';
  END IF;

  IF NOT v_particular AND coalesce(trim(p_numero_carteirinha), '') = '' THEN
    RAISE EXCEPTION 'CARTEIRINHA_OBRIGATORIA';
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
      convenio_id, convenio_nome, convenio_codigo,
      consentimento_lgpd_aceito, consentimento_lgpd_data, consentimento_lgpd_ip
    ) VALUES (
      -- consentimento_lgpd_ip é INET; o IP real não é guardado, só o hash no log
      p_nome, p_cpf, p_telefone, p_email,
      p_convenio_id, v_convenio_nome,
      CASE WHEN v_particular THEN NULL ELSE trim(p_numero_carteirinha) END,
      true, NOW(), NULL
    )
    RETURNING id INTO v_paciente_id;
  END IF;

  v_protocolo := 'AG' || to_char(NOW() AT TIME ZONE 'America/Sao_Paulo', 'YYMMDD')
    || '-' || upper(substr(md5(gen_random_uuid()::text), 1, 6));

  INSERT INTO consultas (
    paciente_id, profissional_id, tipo, data, hora_inicio, hora_fim, status,
    origem, protocolo, motivo, solicitante_nome, solicitante_telefone, solicitante_email,
    convenio_id, numero_carteirinha, valor_cobrado
  ) VALUES (
    v_paciente_id, p_profissional_id, 'presencial', p_data, p_hora_inicio, p_hora_fim,
    'pendente_confirmacao', 'online', v_protocolo, p_motivo, p_nome, p_telefone, p_email,
    p_convenio_id,
    CASE WHEN v_particular THEN NULL ELSE trim(p_numero_carteirinha) END,
    CASE WHEN v_particular
      THEN valor_sugerido_consulta(p_profissional_id, p_convenio_id, v_paciente_id)
    END
  )
  RETURNING id INTO v_consulta_id;

  INSERT INTO agendamento_online_log (ip_hash, consulta_id) VALUES (p_ip_hash, v_consulta_id);

  RETURN QUERY SELECT v_consulta_id, v_protocolo;
END;
$$;

REVOKE ALL ON FUNCTION criar_agendamento_online(UUID, DATE, TIME, TIME, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, TEXT, INT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION criar_agendamento_online(UUID, DATE, TIME, TIME, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, TEXT, INT)
  TO service_role;
