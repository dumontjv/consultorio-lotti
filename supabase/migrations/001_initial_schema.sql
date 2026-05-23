-- ============================================================
-- Migration 001: Initial Schema (versão blindada)
-- Pronto — Sistema de Gestão para Clínicas
-- ============================================================

-- Extensões úteis
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- ENUM TYPES
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'user_role'
  ) THEN
    CREATE TYPE user_role AS ENUM ('medica', 'psicologa', 'secretaria', 'admin');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'genero_type'
  ) THEN
    CREATE TYPE genero_type AS ENUM ('feminino', 'masculino', 'outro', 'nao_informado');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'consulta_tipo'
  ) THEN
    CREATE TYPE consulta_tipo AS ENUM ('presencial', 'teleconsulta');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'consulta_status'
  ) THEN
    CREATE TYPE consulta_status AS ENUM ('agendada', 'confirmada', 'compareceu', 'faltou', 'cancelada');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'documento_tipo'
  ) THEN
    CREATE TYPE documento_tipo AS ENUM ('receita', 'laudo', 'atestado', 'caso_clinico', 'solicitacao_exame', 'relatorio');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'documento_status'
  ) THEN
    CREATE TYPE documento_status AS ENUM ('rascunho', 'assinado', 'entregue', 'cancelado');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'financeiro_tipo'
  ) THEN
    CREATE TYPE financeiro_tipo AS ENUM ('consulta', 'pacote', 'outro');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'forma_pagamento'
  ) THEN
    CREATE TYPE forma_pagamento AS ENUM (
      'pix',
      'dinheiro',
      'credito',
      'debito',
      'convenio',
      'transferencia',
      'boleto'
    );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'financeiro_status'
  ) THEN
    CREATE TYPE financeiro_status AS ENUM ('pago', 'pendente', 'cancelado', 'estornado');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'pacote_status'
  ) THEN
    CREATE TYPE pacote_status AS ENUM ('ativo', 'concluido', 'cancelado');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'lembrete_canal'
  ) THEN
    CREATE TYPE lembrete_canal AS ENUM ('whatsapp', 'sms', 'email');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'lembrete_status'
  ) THEN
    CREATE TYPE lembrete_status AS ENUM ('pendente', 'enviado', 'entregue', 'erro');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'audit_acao'
  ) THEN
    CREATE TYPE audit_acao AS ENUM ('view', 'create', 'update', 'delete', 'export', 'print', 'login', 'logout');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'cid_versao'
  ) THEN
    CREATE TYPE cid_versao AS ENUM ('cid10', 'cid11');
  END IF;
END
$$;

-- ============================================================
-- TABELA: profiles (extensão de auth.users)
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'secretaria',
  crm TEXT,
  crp TEXT,
  email TEXT NOT NULL,
  telefone TEXT,
  foto_url TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: pacientes
-- ============================================================

CREATE TABLE IF NOT EXISTS pacientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  nome_completo TEXT NOT NULL,
  cpf TEXT UNIQUE,
  rg TEXT,
  data_nascimento DATE,
  genero genero_type NOT NULL DEFAULT 'nao_informado',
  estado_civil TEXT,
  profissao TEXT,
  naturalidade TEXT,
  nacionalidade TEXT NOT NULL DEFAULT 'Brasileira',

  telefone_principal TEXT,
  telefone_secundario TEXT,
  email TEXT,
  endereco_logradouro TEXT,
  endereco_numero TEXT,
  endereco_complemento TEXT,
  endereco_bairro TEXT,
  endereco_cidade TEXT,
  endereco_uf TEXT,
  endereco_cep TEXT,

  convenio_nome TEXT,
  convenio_codigo TEXT,
  convenio_validade DATE,

  atendido_por_medica BOOLEAN NOT NULL DEFAULT false,
  atendido_por_psicologa BOOLEAN NOT NULL DEFAULT false,
  primeira_consulta_em DATE,

  grupo_sanguineo TEXT,
  alergias_medicamentosas TEXT[],
  observacoes_gerais TEXT,

  consentimento_lgpd_aceito BOOLEAN NOT NULL DEFAULT false,
  consentimento_lgpd_data TIMESTAMPTZ,
  consentimento_lgpd_ip TEXT,

  criado_por UUID REFERENCES profiles(id),
  atualizado_por UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE pacientes
ADD COLUMN IF NOT EXISTS idade_calculada INTEGER
GENERATED ALWAYS AS (
  CASE
    WHEN data_nascimento IS NOT NULL
    THEN EXTRACT(YEAR FROM AGE(data_nascimento))::INTEGER
    ELSE NULL
  END
) STORED;

CREATE INDEX IF NOT EXISTS idx_pacientes_cpf ON pacientes(cpf) WHERE cpf IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pacientes_nome ON pacientes USING gin(to_tsvector('portuguese', nome_completo));
CREATE INDEX IF NOT EXISTS idx_pacientes_deleted ON pacientes(deleted_at) WHERE deleted_at IS NULL;

-- ============================================================
-- TABELA: anamnese
-- ============================================================

CREATE TABLE IF NOT EXISTS anamnese (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,

  hda TEXT,

  has JSONB DEFAULT '{"tem": false}',
  dm JSONB DEFAULT '{"tem": false}',
  dpoc JSONB DEFAULT '{"tem": false}',
  asma JSONB DEFAULT '{"tem": false}',
  hepatite JSONB DEFAULT '{"tem": false}',
  transfusao JSONB DEFAULT '{"tem": false}',
  cirurgias JSONB DEFAULT '{"tem": false}',
  outras_patologias JSONB DEFAULT '{"tem": false}',
  alergia_medicamentosa JSONB DEFAULT '{"tem": false}',
  medicacao_regular JSONB DEFAULT '{"tem": false}',

  tabagismo JSONB DEFAULT '{"tem": false}',
  etilismo JSONB DEFAULT '{"tem": false}',
  atividade_fisica BOOLEAN,
  sedentario BOOLEAN,

  menarca DATE,
  menopausa DATE,
  gesta JSONB DEFAULT '{"tem": false}',

  historico_familiar JSONB DEFAULT '{}',

  atualizado_por UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_anamnese_paciente ON anamnese(paciente_id);

-- ============================================================
-- TABELA: consultas
-- ============================================================

CREATE TABLE IF NOT EXISTS consultas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  profissional_id UUID NOT NULL REFERENCES profiles(id),
  tipo consulta_tipo NOT NULL DEFAULT 'presencial',
  data DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  status consulta_status NOT NULL DEFAULT 'agendada',
  valor_cobrado DECIMAL(10,2),
  observacoes TEXT,
  link_teleconsulta TEXT,
  criado_por UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consultas_paciente ON consultas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_consultas_profissional ON consultas(profissional_id);
CREATE INDEX IF NOT EXISTS idx_consultas_data ON consultas(data DESC);
CREATE INDEX IF NOT EXISTS idx_consultas_status ON consultas(status);

-- ============================================================
-- TABELA: evolucoes
-- ============================================================

CREATE TABLE IF NOT EXISTS evolucoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  profissional_id UUID NOT NULL REFERENCES profiles(id),
  consulta_id UUID REFERENCES consultas(id),
  data TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  conteudo TEXT NOT NULL,
  sinais_vitais JSONB,
  exame_fisico JSONB,
  conduta TEXT,
  hipotese_diagnostica TEXT,
  cids TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evolucoes_paciente ON evolucoes(paciente_id);
CREATE INDEX IF NOT EXISTS idx_evolucoes_profissional ON evolucoes(profissional_id);
CREATE INDEX IF NOT EXISTS idx_evolucoes_data ON evolucoes(data DESC);

-- ============================================================
-- TABELA: documentos
-- ============================================================

CREATE TABLE IF NOT EXISTS documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  profissional_id UUID NOT NULL REFERENCES profiles(id),
  tipo documento_tipo NOT NULL,
  titulo TEXT NOT NULL,
  conteudo TEXT,
  data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
  assinatura_digital TEXT,
  link_memed TEXT,
  pdf_url TEXT,
  status documento_status NOT NULL DEFAULT 'rascunho',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documentos_paciente ON documentos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_documentos_profissional ON documentos(profissional_id);
CREATE INDEX IF NOT EXISTS idx_documentos_tipo ON documentos(tipo);

-- ============================================================
-- TABELA: financeiro
-- ============================================================

CREATE TABLE IF NOT EXISTS financeiro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  profissional_id UUID NOT NULL REFERENCES profiles(id),
  consulta_id UUID REFERENCES consultas(id),
  tipo financeiro_tipo NOT NULL DEFAULT 'consulta',
  descricao TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  forma_pagamento forma_pagamento NOT NULL DEFAULT 'pix',
  status financeiro_status NOT NULL DEFAULT 'pendente',
  data_vencimento DATE,
  data_pagamento DATE,
  observacoes TEXT,
  registrado_por UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_financeiro_paciente ON financeiro(paciente_id);
CREATE INDEX IF NOT EXISTS idx_financeiro_profissional ON financeiro(profissional_id);
CREATE INDEX IF NOT EXISTS idx_financeiro_status ON financeiro(status);
CREATE INDEX IF NOT EXISTS idx_financeiro_data_pagamento ON financeiro(data_pagamento DESC);

-- ============================================================
-- TABELA: pacotes_psicologia
-- ============================================================

CREATE TABLE IF NOT EXISTS pacotes_psicologia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  sessoes_total INTEGER NOT NULL DEFAULT 4,
  sessoes_usadas INTEGER NOT NULL DEFAULT 0,
  valor_total DECIMAL(10,2) NOT NULL,
  desconto_percentual DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  status pacote_status NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pacotes_paciente ON pacotes_psicologia(paciente_id);
CREATE INDEX IF NOT EXISTS idx_pacotes_status ON pacotes_psicologia(status);

-- ============================================================
-- TABELA: cid_codigos
-- ============================================================

CREATE TABLE IF NOT EXISTS cid_codigos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  versao cid_versao NOT NULL DEFAULT 'cid10',
  codigo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  categoria TEXT,
  capitulo TEXT,
  UNIQUE(versao, codigo)
);

CREATE INDEX IF NOT EXISTS idx_cid_codigo ON cid_codigos(codigo);
CREATE INDEX IF NOT EXISTS idx_cid_descricao ON cid_codigos USING gin(to_tsvector('portuguese', descricao));

-- ============================================================
-- TABELA: lembretes
-- ============================================================

CREATE TABLE IF NOT EXISTS lembretes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consulta_id UUID NOT NULL REFERENCES consultas(id) ON DELETE CASCADE,
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  canal lembrete_canal NOT NULL DEFAULT 'email',
  enviado_em TIMESTAMPTZ,
  status lembrete_status NOT NULL DEFAULT 'pendente',
  mensagem TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lembretes_consulta ON lembretes(consulta_id);
CREATE INDEX IF NOT EXISTS idx_lembretes_status ON lembretes(status);

-- ============================================================
-- TABELA: audit_log
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES profiles(id),
  acao audit_acao NOT NULL,
  entidade TEXT NOT NULL,
  entidade_id UUID,
  dados_anteriores JSONB,
  dados_novos JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_usuario ON audit_log(usuario_id);
CREATE INDEX IF NOT EXISTS idx_audit_entidade ON audit_log(entidade, entidade_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);

-- ============================================================
-- TABELA: configuracoes (singleton)
-- ============================================================

CREATE TABLE IF NOT EXISTS configuracoes (
  id INTEGER PRIMARY KEY DEFAULT 1,
  consultorio_nome TEXT NOT NULL DEFAULT 'Consultório Lotti Fonseca',
  consultorio_endereco TEXT,
  consultorio_telefones TEXT[] DEFAULT ARRAY['(21) 3392-2142', '(21) 2425-5230'],
  consultorio_celular TEXT,
  consultorio_email TEXT DEFAULT 'consultoriolotti@gmail.com',
  consultorio_cnpj TEXT,
  consultorio_logo_url TEXT,
  horario_atendimento JSONB DEFAULT '{"seg_sex": "08:00-18:00", "sab": "08:00-12:00"}',
  CONSTRAINT configuracoes_singleton CHECK (id = 1)
);

INSERT INTO configuracoes (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- FUNÇÃO E TRIGGERS: updated_at automático
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_profiles_updated_at ON profiles;
CREATE TRIGGER tr_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS tr_pacientes_updated_at ON pacientes;
CREATE TRIGGER tr_pacientes_updated_at
  BEFORE UPDATE ON pacientes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS tr_consultas_updated_at ON consultas;
CREATE TRIGGER tr_consultas_updated_at
  BEFORE UPDATE ON consultas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS tr_evolucoes_updated_at ON evolucoes;
CREATE TRIGGER tr_evolucoes_updated_at
  BEFORE UPDATE ON evolucoes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS tr_documentos_updated_at ON documentos;
CREATE TRIGGER tr_documentos_updated_at
  BEFORE UPDATE ON documentos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS tr_pacotes_updated_at ON pacotes_psicologia;
CREATE TRIGGER tr_pacotes_updated_at
  BEFORE UPDATE ON pacotes_psicologia
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TRIGGER: criar profile automaticamente ao cadastrar usuário
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, nome_completo, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'secretaria')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE anamnese ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultas ENABLE ROW LEVEL SECURITY;
ALTER TABLE evolucoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE financeiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacotes_psicologia ENABLE ROW LEVEL SECURITY;
ALTER TABLE cid_codigos ENABLE ROW LEVEL SECURITY;
ALTER TABLE lembretes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

-- Helper: retorna o role do usuário autenticado
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- POLICIES: profiles
-- ============================================================

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
CREATE POLICY "profiles_select_admin" ON profiles
  FOR SELECT USING (get_user_role() = 'admin');

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;
CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL USING (get_user_role() = 'admin');

-- ============================================================
-- POLICIES: pacientes
-- ============================================================

DROP POLICY IF EXISTS "pacientes_select" ON pacientes;
CREATE POLICY "pacientes_select" ON pacientes
  FOR SELECT USING (
    deleted_at IS NULL AND
    get_user_role() IN ('medica', 'psicologa', 'secretaria', 'admin')
  );

DROP POLICY IF EXISTS "pacientes_insert" ON pacientes;
CREATE POLICY "pacientes_insert" ON pacientes
  FOR INSERT WITH CHECK (
    get_user_role() IN ('medica', 'psicologa', 'secretaria', 'admin')
  );

DROP POLICY IF EXISTS "pacientes_update" ON pacientes;
CREATE POLICY "pacientes_update" ON pacientes
  FOR UPDATE USING (
    get_user_role() IN ('medica', 'psicologa', 'secretaria', 'admin')
  );

-- Soft-delete: exclusão é implementada como UPDATE em deleted_at, restrita a admin
DROP POLICY IF EXISTS "pacientes_delete" ON pacientes;
CREATE POLICY "pacientes_delete" ON pacientes
  FOR UPDATE USING (get_user_role() = 'admin');

-- ============================================================
-- POLICIES: anamnese
-- ============================================================

DROP POLICY IF EXISTS "anamnese_select" ON anamnese;
CREATE POLICY "anamnese_select" ON anamnese
  FOR SELECT USING (
    get_user_role() IN ('medica', 'psicologa', 'admin')
  );

DROP POLICY IF EXISTS "anamnese_insert" ON anamnese;
CREATE POLICY "anamnese_insert" ON anamnese
  FOR INSERT WITH CHECK (
    get_user_role() IN ('medica', 'psicologa', 'admin')
  );

DROP POLICY IF EXISTS "anamnese_update" ON anamnese;
CREATE POLICY "anamnese_update" ON anamnese
  FOR UPDATE USING (
    get_user_role() IN ('medica', 'psicologa', 'admin')
  );

-- ============================================================
-- POLICIES: consultas
-- ============================================================

DROP POLICY IF EXISTS "consultas_select" ON consultas;
CREATE POLICY "consultas_select" ON consultas
  FOR SELECT USING (
    get_user_role() IN ('medica', 'psicologa', 'secretaria', 'admin')
  );

DROP POLICY IF EXISTS "consultas_insert" ON consultas;
CREATE POLICY "consultas_insert" ON consultas
  FOR INSERT WITH CHECK (
    get_user_role() IN ('medica', 'psicologa', 'secretaria', 'admin')
  );

DROP POLICY IF EXISTS "consultas_update" ON consultas;
CREATE POLICY "consultas_update" ON consultas
  FOR UPDATE USING (
    get_user_role() IN ('medica', 'psicologa', 'secretaria', 'admin')
  );

-- ============================================================
-- POLICIES: evolucoes
-- ============================================================

DROP POLICY IF EXISTS "evolucoes_select" ON evolucoes;
CREATE POLICY "evolucoes_select" ON evolucoes
  FOR SELECT USING (
    get_user_role() IN ('medica', 'psicologa', 'admin')
  );

DROP POLICY IF EXISTS "evolucoes_insert" ON evolucoes;
CREATE POLICY "evolucoes_insert" ON evolucoes
  FOR INSERT WITH CHECK (
    get_user_role() IN ('medica', 'psicologa', 'admin')
  );

DROP POLICY IF EXISTS "evolucoes_update" ON evolucoes;
CREATE POLICY "evolucoes_update" ON evolucoes
  FOR UPDATE USING (
    get_user_role() IN ('medica', 'psicologa', 'admin')
  );

-- ============================================================
-- POLICIES: documentos
-- ============================================================

DROP POLICY IF EXISTS "documentos_select" ON documentos;
CREATE POLICY "documentos_select" ON documentos
  FOR SELECT USING (
    get_user_role() IN ('medica', 'psicologa', 'secretaria', 'admin')
  );

DROP POLICY IF EXISTS "documentos_insert" ON documentos;
CREATE POLICY "documentos_insert" ON documentos
  FOR INSERT WITH CHECK (
    get_user_role() IN ('medica', 'psicologa', 'admin')
  );

DROP POLICY IF EXISTS "documentos_update" ON documentos;
CREATE POLICY "documentos_update" ON documentos
  FOR UPDATE USING (
    get_user_role() IN ('medica', 'psicologa', 'admin')
  );

-- ============================================================
-- POLICIES: financeiro
-- ============================================================

DROP POLICY IF EXISTS "financeiro_select" ON financeiro;
CREATE POLICY "financeiro_select" ON financeiro
  FOR SELECT USING (
    get_user_role() IN ('medica', 'psicologa', 'secretaria', 'admin')
  );

DROP POLICY IF EXISTS "financeiro_insert" ON financeiro;
CREATE POLICY "financeiro_insert" ON financeiro
  FOR INSERT WITH CHECK (
    get_user_role() IN ('medica', 'psicologa', 'secretaria', 'admin')
  );

DROP POLICY IF EXISTS "financeiro_update" ON financeiro;
CREATE POLICY "financeiro_update" ON financeiro
  FOR UPDATE USING (
    get_user_role() IN ('medica', 'psicologa', 'secretaria', 'admin')
  );

-- ============================================================
-- POLICIES: pacotes_psicologia
-- ============================================================

DROP POLICY IF EXISTS "pacotes_select" ON pacotes_psicologia;
CREATE POLICY "pacotes_select" ON pacotes_psicologia
  FOR SELECT USING (
    get_user_role() IN ('medica', 'psicologa', 'secretaria', 'admin')
  );

DROP POLICY IF EXISTS "pacotes_insert" ON pacotes_psicologia;
CREATE POLICY "pacotes_insert" ON pacotes_psicologia
  FOR INSERT WITH CHECK (
    get_user_role() IN ('psicologa', 'secretaria', 'admin')
  );

DROP POLICY IF EXISTS "pacotes_update" ON pacotes_psicologia;
CREATE POLICY "pacotes_update" ON pacotes_psicologia
  FOR UPDATE USING (
    get_user_role() IN ('psicologa', 'secretaria', 'admin')
  );

-- ============================================================
-- POLICIES: cid_codigos
-- ============================================================

DROP POLICY IF EXISTS "cid_select" ON cid_codigos;
CREATE POLICY "cid_select" ON cid_codigos
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============================================================
-- POLICIES: lembretes
-- ============================================================

DROP POLICY IF EXISTS "lembretes_select" ON lembretes;
CREATE POLICY "lembretes_select" ON lembretes
  FOR SELECT USING (
    get_user_role() IN ('medica', 'psicologa', 'secretaria', 'admin')
  );

DROP POLICY IF EXISTS "lembretes_insert" ON lembretes;
CREATE POLICY "lembretes_insert" ON lembretes
  FOR INSERT WITH CHECK (
    get_user_role() IN ('medica', 'psicologa', 'secretaria', 'admin')
  );

-- ============================================================
-- POLICIES: audit_log
-- ============================================================

DROP POLICY IF EXISTS "audit_own" ON audit_log;
CREATE POLICY "audit_own" ON audit_log
  FOR SELECT USING (
    usuario_id = auth.uid() OR get_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "audit_insert" ON audit_log;
CREATE POLICY "audit_insert" ON audit_log
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- POLICIES: configuracoes
-- ============================================================

DROP POLICY IF EXISTS "config_select" ON configuracoes;
CREATE POLICY "config_select" ON configuracoes
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "config_update" ON configuracoes;
CREATE POLICY "config_update" ON configuracoes
  FOR UPDATE USING (get_user_role() = 'admin');
