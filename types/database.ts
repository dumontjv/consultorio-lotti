// ============================================================
// Tipos gerados para o banco de dados Supabase
// Pronto — Sistema de Gestão para Clínicas
// ============================================================

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// ============================================================
// ENUMS
// ============================================================

export type UserRole = 'medica' | 'psicologa' | 'secretaria' | 'admin'
export type GeneroType = 'feminino' | 'masculino' | 'outro' | 'nao_informado'
export type ConsultaTipo = 'presencial' | 'teleconsulta'
export type ConsultaStatus = 'agendada' | 'confirmada' | 'compareceu' | 'faltou' | 'cancelada'
export type DocumentoTipo = 'receita' | 'laudo' | 'atestado' | 'caso_clinico' | 'solicitacao_exame' | 'relatorio'
export type DocumentoStatus = 'rascunho' | 'assinado' | 'entregue' | 'cancelado'
export type FinanceiroTipo = 'consulta' | 'pacote' | 'outro' | 'despesa'
export type FormaPagamento = 'pix' | 'dinheiro' | 'credito' | 'debito' | 'convenio' | 'transferencia' | 'boleto'
export type FinanceiroStatus = 'pago' | 'pendente' | 'cancelado' | 'estornado'
export type PacoteStatus = 'ativo' | 'concluido' | 'cancelado'
export type LembreteCanal = 'whatsapp' | 'sms' | 'email'
export type LembreteStatus = 'pendente' | 'enviado' | 'entregue' | 'erro'
export type AuditAcao = 'view' | 'create' | 'update' | 'delete' | 'export' | 'print' | 'login' | 'logout'
export type CidVersao = 'cid10' | 'cid11'

// ============================================================
// DATABASE TYPE PRINCIPAL
// ============================================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          nome_completo: string
          role: UserRole
          crm: string | null
          crp: string | null
          email: string
          telefone: string | null
          foto_url: string | null
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          nome_completo: string
          role?: UserRole
          crm?: string | null
          crp?: string | null
          email: string
          telefone?: string | null
          foto_url?: string | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome_completo?: string
          role?: UserRole
          crm?: string | null
          crp?: string | null
          email?: string
          telefone?: string | null
          foto_url?: string | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      pacientes: {
        Row: {
          id: string
          nome_completo: string
          cpf: string | null
          rg: string | null
          data_nascimento: string | null
          genero: GeneroType
          estado_civil: string | null
          profissao: string | null
          naturalidade: string | null
          nacionalidade: string
          telefone_principal: string | null
          telefone_secundario: string | null
          email: string | null
          endereco_logradouro: string | null
          endereco_numero: string | null
          endereco_complemento: string | null
          endereco_bairro: string | null
          endereco_cidade: string | null
          endereco_uf: string | null
          endereco_cep: string | null
          convenio_nome: string | null
          convenio_codigo: string | null
          convenio_validade: string | null
          atendido_por_medica: boolean
          atendido_por_psicologa: boolean
          primeira_consulta_em: string | null
          grupo_sanguineo: string | null
          alergias_medicamentosas: string[] | null
          observacoes_gerais: string | null
          consentimento_lgpd_aceito: boolean
          consentimento_lgpd_data: string | null
          consentimento_lgpd_ip: string | null
          criado_por: string | null
          atualizado_por: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
          idade_calculada: number | null
        }
        Insert: {
          id?: string
          nome_completo: string
          cpf?: string | null
          rg?: string | null
          data_nascimento?: string | null
          genero?: GeneroType
          estado_civil?: string | null
          profissao?: string | null
          naturalidade?: string | null
          nacionalidade?: string
          telefone_principal?: string | null
          telefone_secundario?: string | null
          email?: string | null
          endereco_logradouro?: string | null
          endereco_numero?: string | null
          endereco_complemento?: string | null
          endereco_bairro?: string | null
          endereco_cidade?: string | null
          endereco_uf?: string | null
          endereco_cep?: string | null
          convenio_nome?: string | null
          convenio_codigo?: string | null
          convenio_validade?: string | null
          atendido_por_medica?: boolean
          atendido_por_psicologa?: boolean
          primeira_consulta_em?: string | null
          grupo_sanguineo?: string | null
          alergias_medicamentosas?: string[] | null
          observacoes_gerais?: string | null
          consentimento_lgpd_aceito?: boolean
          consentimento_lgpd_data?: string | null
          consentimento_lgpd_ip?: string | null
          criado_por?: string | null
          atualizado_por?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          nome_completo?: string
          cpf?: string | null
          rg?: string | null
          data_nascimento?: string | null
          genero?: GeneroType
          estado_civil?: string | null
          profissao?: string | null
          naturalidade?: string | null
          nacionalidade?: string
          telefone_principal?: string | null
          telefone_secundario?: string | null
          email?: string | null
          endereco_logradouro?: string | null
          endereco_numero?: string | null
          endereco_complemento?: string | null
          endereco_bairro?: string | null
          endereco_cidade?: string | null
          endereco_uf?: string | null
          endereco_cep?: string | null
          convenio_nome?: string | null
          convenio_codigo?: string | null
          convenio_validade?: string | null
          atendido_por_medica?: boolean
          atendido_por_psicologa?: boolean
          primeira_consulta_em?: string | null
          grupo_sanguineo?: string | null
          alergias_medicamentosas?: string[] | null
          observacoes_gerais?: string | null
          consentimento_lgpd_aceito?: boolean
          consentimento_lgpd_data?: string | null
          consentimento_lgpd_ip?: string | null
          criado_por?: string | null
          atualizado_por?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }

      anamnese: {
        Row: {
          id: string
          paciente_id: string
          hda: string | null
          has: Json | null
          dm: Json | null
          dpoc: Json | null
          asma: Json | null
          hepatite: Json | null
          transfusao: Json | null
          cirurgias: Json | null
          outras_patologias: Json | null
          alergia_medicamentosa: Json | null
          medicacao_regular: Json | null
          tabagismo: Json | null
          etilismo: Json | null
          atividade_fisica: boolean | null
          sedentario: boolean | null
          menarca: string | null
          menopausa: string | null
          gesta: Json | null
          historico_familiar: Json | null
          atualizado_por: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          paciente_id: string
          hda?: string | null
          has?: Json | null
          dm?: Json | null
          dpoc?: Json | null
          asma?: Json | null
          hepatite?: Json | null
          transfusao?: Json | null
          cirurgias?: Json | null
          outras_patologias?: Json | null
          alergia_medicamentosa?: Json | null
          medicacao_regular?: Json | null
          tabagismo?: Json | null
          etilismo?: Json | null
          atividade_fisica?: boolean | null
          sedentario?: boolean | null
          menarca?: string | null
          menopausa?: string | null
          gesta?: Json | null
          historico_familiar?: Json | null
          atualizado_por?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          paciente_id?: string
          hda?: string | null
          has?: Json | null
          dm?: Json | null
          dpoc?: Json | null
          asma?: Json | null
          hepatite?: Json | null
          transfusao?: Json | null
          cirurgias?: Json | null
          outras_patologias?: Json | null
          alergia_medicamentosa?: Json | null
          medicacao_regular?: Json | null
          tabagismo?: Json | null
          etilismo?: Json | null
          atividade_fisica?: boolean | null
          sedentario?: boolean | null
          menarca?: string | null
          menopausa?: string | null
          gesta?: Json | null
          historico_familiar?: Json | null
          atualizado_por?: string | null
          updated_at?: string
        }
        Relationships: []
      }

      consultas: {
        Row: {
          id: string
          paciente_id: string
          profissional_id: string
          tipo: ConsultaTipo
          data: string
          hora_inicio: string
          hora_fim: string
          status: ConsultaStatus
          valor_cobrado: number | null
          observacoes: string | null
          link_teleconsulta: string | null
          criado_por: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          paciente_id: string
          profissional_id: string
          tipo?: ConsultaTipo
          data: string
          hora_inicio: string
          hora_fim: string
          status?: ConsultaStatus
          valor_cobrado?: number | null
          observacoes?: string | null
          link_teleconsulta?: string | null
          criado_por?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          paciente_id?: string
          profissional_id?: string
          tipo?: ConsultaTipo
          data?: string
          hora_inicio?: string
          hora_fim?: string
          status?: ConsultaStatus
          valor_cobrado?: number | null
          observacoes?: string | null
          link_teleconsulta?: string | null
          criado_por?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      evolucoes: {
        Row: {
          id: string
          paciente_id: string
          profissional_id: string
          consulta_id: string | null
          data: string
          conteudo: string
          sinais_vitais: Json | null
          exame_fisico: Json | null
          conduta: string | null
          hipotese_diagnostica: string | null
          cids: string[] | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          paciente_id: string
          profissional_id: string
          consulta_id?: string | null
          data?: string
          conteudo: string
          sinais_vitais?: Json | null
          exame_fisico?: Json | null
          conduta?: string | null
          hipotese_diagnostica?: string | null
          cids?: string[] | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          paciente_id?: string
          profissional_id?: string
          consulta_id?: string | null
          data?: string
          conteudo?: string
          sinais_vitais?: Json | null
          exame_fisico?: Json | null
          conduta?: string | null
          hipotese_diagnostica?: string | null
          cids?: string[] | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }

      documentos: {
        Row: {
          id: string
          paciente_id: string
          profissional_id: string
          tipo: DocumentoTipo
          titulo: string
          conteudo: string | null
          data_emissao: string
          assinatura_digital: string | null
          link_memed: string | null
          pdf_url: string | null
          status: DocumentoStatus
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          paciente_id: string
          profissional_id: string
          tipo: DocumentoTipo
          titulo: string
          conteudo?: string | null
          data_emissao?: string
          assinatura_digital?: string | null
          link_memed?: string | null
          pdf_url?: string | null
          status?: DocumentoStatus
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          paciente_id?: string
          profissional_id?: string
          tipo?: DocumentoTipo
          titulo?: string
          conteudo?: string | null
          data_emissao?: string
          assinatura_digital?: string | null
          link_memed?: string | null
          pdf_url?: string | null
          status?: DocumentoStatus
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }

      financeiro: {
        Row: {
          id: string
          paciente_id: string | null
          profissional_id: string
          consulta_id: string | null
          tipo: FinanceiroTipo
          descricao: string
          valor: number
          forma_pagamento: FormaPagamento
          status: FinanceiroStatus
          data_vencimento: string | null
          data_pagamento: string | null
          observacoes: string | null
          registrado_por: string | null
          created_at: string
        }
        Insert: {
          id?: string
          paciente_id?: string | null
          profissional_id: string
          consulta_id?: string | null
          tipo?: FinanceiroTipo
          descricao: string
          valor: number
          forma_pagamento?: FormaPagamento
          status?: FinanceiroStatus
          data_vencimento?: string | null
          data_pagamento?: string | null
          observacoes?: string | null
          registrado_por?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          paciente_id?: string | null
          profissional_id?: string
          consulta_id?: string | null
          tipo?: FinanceiroTipo
          descricao?: string
          valor?: number
          forma_pagamento?: FormaPagamento
          status?: FinanceiroStatus
          data_vencimento?: string | null
          data_pagamento?: string | null
          observacoes?: string | null
          registrado_por?: string | null
          created_at?: string
        }
        Relationships: []
      }

      pacotes_psicologia: {
        Row: {
          id: string
          paciente_id: string
          sessoes_total: number
          sessoes_usadas: number
          valor_total: number
          desconto_percentual: number
          data_inicio: string
          data_fim: string | null
          status: PacoteStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          paciente_id: string
          sessoes_total?: number
          sessoes_usadas?: number
          valor_total: number
          desconto_percentual?: number
          data_inicio: string
          data_fim?: string | null
          status?: PacoteStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          paciente_id?: string
          sessoes_total?: number
          sessoes_usadas?: number
          valor_total?: number
          desconto_percentual?: number
          data_inicio?: string
          data_fim?: string | null
          status?: PacoteStatus
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      cid_codigos: {
        Row: {
          id: string
          versao: CidVersao
          codigo: string
          descricao: string
          categoria: string | null
          capitulo: string | null
        }
        Insert: {
          id?: string
          versao?: CidVersao
          codigo: string
          descricao: string
          categoria?: string | null
          capitulo?: string | null
        }
        Update: {
          id?: string
          versao?: CidVersao
          codigo?: string
          descricao?: string
          categoria?: string | null
          capitulo?: string | null
        }
        Relationships: []
      }

      lembretes: {
        Row: {
          id: string
          consulta_id: string
          paciente_id: string
          canal: LembreteCanal
          enviado_em: string | null
          status: LembreteStatus
          mensagem: string
          created_at: string
        }
        Insert: {
          id?: string
          consulta_id: string
          paciente_id: string
          canal?: LembreteCanal
          enviado_em?: string | null
          status?: LembreteStatus
          mensagem: string
          created_at?: string
        }
        Update: {
          id?: string
          consulta_id?: string
          paciente_id?: string
          canal?: LembreteCanal
          enviado_em?: string | null
          status?: LembreteStatus
          mensagem?: string
          created_at?: string
        }
        Relationships: []
      }

      audit_log: {
        Row: {
          id: string
          usuario_id: string
          acao: AuditAcao
          entidade: string
          entidade_id: string | null
          dados_anteriores: Json | null
          dados_novos: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          usuario_id: string
          acao: AuditAcao
          entidade: string
          entidade_id?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          usuario_id?: string
          acao?: AuditAcao
          entidade?: string
          entidade_id?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Relationships: []
      }

      configuracoes: {
        Row: {
          id: number
          consultorio_nome: string
          consultorio_endereco: string | null
          consultorio_telefones: string[] | null
          consultorio_celular: string | null
          consultorio_email: string | null
          consultorio_cnpj: string | null
          consultorio_logo_url: string | null
          horario_atendimento: Json | null
        }
        Insert: {
          id?: number
          consultorio_nome?: string
          consultorio_endereco?: string | null
          consultorio_telefones?: string[] | null
          consultorio_celular?: string | null
          consultorio_email?: string | null
          consultorio_cnpj?: string | null
          consultorio_logo_url?: string | null
          horario_atendimento?: Json | null
        }
        Update: {
          id?: number
          consultorio_nome?: string
          consultorio_endereco?: string | null
          consultorio_telefones?: string[] | null
          consultorio_celular?: string | null
          consultorio_email?: string | null
          consultorio_cnpj?: string | null
          consultorio_logo_url?: string | null
          horario_atendimento?: Json | null
        }
        Relationships: []
      }
    }

    Views: {
      [_ in never]: never
    }

    Functions: {
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: UserRole
      }
      update_updated_at: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }

    Enums: {
      user_role: UserRole
      genero_type: GeneroType
      consulta_tipo: ConsultaTipo
      consulta_status: ConsultaStatus
      documento_tipo: DocumentoTipo
      documento_status: DocumentoStatus
      financeiro_tipo: FinanceiroTipo
      forma_pagamento: FormaPagamento
      financeiro_status: FinanceiroStatus
      pacote_status: PacoteStatus
      lembrete_canal: LembreteCanal
      lembrete_status: LembreteStatus
      audit_acao: AuditAcao
      cid_versao: CidVersao
    }

    CompositeTypes: {
      [_ in never]: never
    }
  }

  storage: {
    Tables: {
      buckets: {
        Row: {
          id: string
          name: string
          public: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          name: string
          public?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          public?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      objects: {
        Row: {
          id: string
          bucket_id: string | null
          name: string | null
          owner: string | null
          created_at: string | null
          updated_at: string | null
          last_accessed_at: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          bucket_id?: string | null
          name?: string | null
          owner?: string | null
          created_at?: string | null
          updated_at?: string | null
          last_accessed_at?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          bucket_id?: string | null
          name?: string | null
          owner?: string | null
          created_at?: string | null
          updated_at?: string | null
          last_accessed_at?: string | null
          metadata?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      foldername: {
        Args: { name: string }
        Returns: string[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// ============================================================
// HELPER TYPES (atalhos convenientes)
// ============================================================

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]
