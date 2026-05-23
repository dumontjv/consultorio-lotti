// ============================================================
// Tipos de Domínio da Aplicação
// Pronto — Sistema de Gestão para Clínicas
// ============================================================

import type {
  UserRole,
  GeneroType,
  ConsultaTipo,
  ConsultaStatus,
  DocumentoTipo,
  DocumentoStatus,
  FinanceiroTipo,
  FormaPagamento,
  FinanceiroStatus,
  PacoteStatus,
  LembreteCanal,
  LembreteStatus,
  AuditAcao,
  CidVersao,
} from './database'

// Re-exportar enums para uso no domínio
export type {
  UserRole,
  GeneroType,
  ConsultaTipo,
  ConsultaStatus,
  DocumentoTipo,
  DocumentoStatus,
  FinanceiroTipo,
  FormaPagamento,
  FinanceiroStatus,
  PacoteStatus,
  LembreteCanal,
  LembreteStatus,
  AuditAcao,
  CidVersao,
}

// ============================================================
// INTERFACES JSONB - Campos de Anamnese
// ============================================================

/** Campo JSONB genérico para comorbidade com presença booleana */
export interface ComorbidadeData {
  tem: boolean
  descricao?: string
}

/** Hipertensão arterial sistêmica */
export interface HasData extends ComorbidadeData {
  tipo?: 'essencial' | 'secundaria'
  medicacao?: string
  pa_controlada?: boolean
}

/** Diabetes mellitus */
export interface DmData extends ComorbidadeData {
  tipo?: 'tipo1' | 'tipo2' | 'gestacional' | 'outro'
  medicacao?: string
  hba1c?: number
  insulina?: boolean
}

/** DPOC */
export interface DpocData extends ComorbidadeData {
  estadio?: 'leve' | 'moderado' | 'grave' | 'muito_grave'
  medicacao?: string
  oxigenioterapia?: boolean
}

/** Asma */
export interface AsmaData extends ComorbidadeData {
  gravidade?: 'intermitente' | 'leve_persistente' | 'moderada_persistente' | 'grave_persistente'
  medicacao?: string
  internacoes_previas?: boolean
}

/** Hepatite */
export interface HepatiteData extends ComorbidadeData {
  tipo?: 'A' | 'B' | 'C' | 'outro'
  fase?: 'aguda' | 'cronica' | 'curada'
  tratamento?: string
}

/** Transfusão sanguínea prévia */
export interface TransfusaoData extends ComorbidadeData {
  motivo?: string
  ano?: number
  reacao_adversa?: boolean
}

/** Cirurgias prévias */
export interface CirurgiasData extends ComorbidadeData {
  lista?: Array<{
    descricao: string
    ano?: number
    complicacoes?: string
  }>
}

/** Outras patologias */
export interface OutrasPatologiasData extends ComorbidadeData {
  lista?: string[]
}

/** Alergia medicamentosa */
export interface AlergiaMedicamentosaData extends ComorbidadeData {
  medicamentos?: Array<{
    nome: string
    reacao: string
    gravidade?: 'leve' | 'moderada' | 'grave'
  }>
}

/** Medicação regular em uso */
export interface MedicacaoRegularData extends ComorbidadeData {
  lista?: Array<{
    nome: string
    dose?: string
    frequencia?: string
    indicacao?: string
  }>
}

/** Tabagismo */
export interface TabagismoData extends ComorbidadeData {
  cigarros_dia?: number
  anos_fumando?: number
  carga_tabagica?: number
  ex_fumante?: boolean
  anos_sem_fumar?: number
}

/** Etilismo */
export interface EtilismoData extends ComorbidadeData {
  frequencia?: 'social' | 'semanal' | 'diario' | 'ex_etilista'
  doses_semana?: number
  cage_score?: number
}

/** Gestação */
export interface GestaData extends ComorbidadeData {
  gesta?: number
  para?: number
  aborto?: number
  cesarea?: number
  ectopica?: number
  nascidos_vivos?: number
  filhos_vivos?: number
}

/** Histórico familiar */
export interface HistoricoFamiliarData {
  has?: boolean
  dm?: boolean
  cardiopatia?: boolean
  avc?: boolean
  cancer?: string[]
  doenca_mental?: boolean
  outras?: string
}

// ============================================================
// INTERFACES JSONB - Evolução
// ============================================================

/** Sinais vitais registrados na evolução */
export interface SinaisVitais {
  pa_sistolica?: number
  pa_diastolica?: number
  fc?: number
  fr?: number
  temperatura?: number
  spo2?: number
  peso?: number
  altura?: number
  imc?: number
  glicemia?: number
  dor_escala?: number
}

/** Exame físico estruturado */
export interface ExameFisico {
  geral?: string
  cabeca_pescoco?: string
  torax?: string
  abdome?: string
  membros?: string
  neurologico?: string
  pele?: string
  outros?: string
}

// ============================================================
// INTERFACES JSONB - Configurações
// ============================================================

export interface HorarioAtendimento {
  seg_sex?: string
  sab?: string
  dom?: string
  [key: string]: string | undefined
}

// ============================================================
// ENTIDADES DE DOMÍNIO
// ============================================================

/** Perfil de usuário do sistema */
export interface Profile {
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

/** Paciente com todos os campos */
export interface Paciente {
  id: string

  // Identificação
  nome_completo: string
  cpf: string | null
  rg: string | null
  data_nascimento: string | null
  genero: GeneroType
  estado_civil: string | null
  profissao: string | null
  naturalidade: string | null
  nacionalidade: string

  // Contato
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

  // Convênio
  convenio_nome: string | null
  convenio_codigo: string | null
  convenio_validade: string | null

  // Profissionais que atendem
  atendido_por_medica: boolean
  atendido_por_psicologa: boolean
  primeira_consulta_em: string | null

  // Dados clínicos
  grupo_sanguineo: string | null
  alergias_medicamentosas: string[] | null
  observacoes_gerais: string | null

  // LGPD
  consentimento_lgpd_aceito: boolean
  consentimento_lgpd_data: string | null
  consentimento_lgpd_ip: string | null

  // Auditoria
  criado_por: string | null
  atualizado_por: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null

  // Campo calculado (read-only)
  idade_calculada: number | null
}

/** Paciente com dados de perfil relacionados (join) */
export interface PacienteComProfissional extends Paciente {
  criado_por_profile?: Profile
  atualizado_por_profile?: Profile
}

/** Anamnese do paciente com campos JSONB tipados */
export interface Anamnese {
  id: string
  paciente_id: string

  // História da Doença Atual
  hda: string | null

  // Comorbidades
  has: HasData | null
  dm: DmData | null
  dpoc: DpocData | null
  asma: AsmaData | null
  hepatite: HepatiteData | null
  transfusao: TransfusaoData | null
  cirurgias: CirurgiasData | null
  outras_patologias: OutrasPatologiasData | null
  alergia_medicamentosa: AlergiaMedicamentosaData | null
  medicacao_regular: MedicacaoRegularData | null

  // Hábitos
  tabagismo: TabagismoData | null
  etilismo: EtilismoData | null
  atividade_fisica: boolean | null
  sedentario: boolean | null

  // Ginecológico
  menarca: string | null
  menopausa: string | null
  gesta: GestaData | null

  // Histórico familiar
  historico_familiar: HistoricoFamiliarData | null

  // Auditoria
  atualizado_por: string | null
  updated_at: string
}

/** Consulta agendada */
export interface Consulta {
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

/** Consulta com dados de paciente e profissional (join) */
export interface ConsultaDetalhada extends Consulta {
  paciente: Pick<Paciente, 'id' | 'nome_completo' | 'telefone_principal' | 'email'>
  profissional: Pick<Profile, 'id' | 'nome_completo' | 'role' | 'crm' | 'crp'>
}

/** Evolução / prontuário clínico */
export interface Evolucao {
  id: string
  paciente_id: string
  profissional_id: string
  consulta_id: string | null
  data: string
  conteudo: string
  sinais_vitais: SinaisVitais | null
  exame_fisico: ExameFisico | null
  conduta: string | null
  hipotese_diagnostica: string | null
  cids: string[] | null
  created_at: string
  updated_at: string
}

/** Evolução com dados relacionados (join) */
export interface EvolucaoDetalhada extends Evolucao {
  profissional: Pick<Profile, 'id' | 'nome_completo' | 'role' | 'crm' | 'crp'>
  consulta?: Consulta | null
}

/** Documento clínico (receita, laudo, atestado, etc.) */
export interface Documento {
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
}

/** Documento com dados de profissional (join) */
export interface DocumentoDetalhado extends Documento {
  profissional: Pick<Profile, 'id' | 'nome_completo' | 'role' | 'crm' | 'crp'>
}

/** Registro financeiro */
export interface Financeiro {
  id: string
  paciente_id: string
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

/** Registro financeiro com dados relacionados (join) */
export interface FinanceiroDetalhado extends Financeiro {
  paciente: Pick<Paciente, 'id' | 'nome_completo'>
  profissional: Pick<Profile, 'id' | 'nome_completo' | 'role'>
}

/** Pacote de sessões de psicologia */
export interface PacotePsicologia {
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
  // Campo calculado
  sessoes_restantes?: number
  valor_por_sessao?: number
}

/** Código CID-10 / CID-11 */
export interface CidCodigo {
  id: string
  versao: CidVersao
  codigo: string
  descricao: string
  categoria: string | null
  capitulo: string | null
}

/** Lembrete de consulta */
export interface Lembrete {
  id: string
  consulta_id: string
  paciente_id: string
  canal: LembreteCanal
  enviado_em: string | null
  status: LembreteStatus
  mensagem: string
  created_at: string
}

/** Entrada do log de auditoria */
export interface AuditLog {
  id: string
  usuario_id: string
  acao: AuditAcao
  entidade: string
  entidade_id: string | null
  dados_anteriores: Record<string, unknown> | null
  dados_novos: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

/** Entrada do log de auditoria com dados do usuário (join) */
export interface AuditLogDetalhado extends AuditLog {
  usuario: Pick<Profile, 'id' | 'nome_completo' | 'email' | 'role'>
}

/** Configurações do consultório (singleton) */
export interface Configuracoes {
  id: 1
  consultorio_nome: string
  consultorio_endereco: string | null
  consultorio_telefones: string[] | null
  consultorio_celular: string | null
  consultorio_email: string | null
  consultorio_cnpj: string | null
  consultorio_logo_url: string | null
  horario_atendimento: HorarioAtendimento | null
}

// ============================================================
// TIPOS AUXILIARES E UTILITÁRIOS
// ============================================================

/** Dados do usuário autenticado (Supabase Auth + Profile) */
export interface UsuarioAutenticado {
  id: string
  email: string
  profile: Profile
}

/** Filtros para listagem de pacientes */
export interface FiltrosPacientes {
  busca?: string
  atendido_por_medica?: boolean
  atendido_por_psicologa?: boolean
  genero?: GeneroType
  cidade?: string
  convenio?: boolean
  com_deleted?: boolean
  page?: number
  per_page?: number
}

/** Filtros para listagem de consultas */
export interface FiltrosConsultas {
  paciente_id?: string
  profissional_id?: string
  data_inicio?: string
  data_fim?: string
  status?: ConsultaStatus | ConsultaStatus[]
  tipo?: ConsultaTipo
  page?: number
  per_page?: number
}

/** Filtros para relatório financeiro */
export interface FiltrosFinanceiro {
  paciente_id?: string
  profissional_id?: string
  status?: FinanceiroStatus
  forma_pagamento?: FormaPagamento
  data_inicio?: string
  data_fim?: string
  page?: number
  per_page?: number
}

/** Resposta paginada genérica */
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

/** Resumo financeiro para dashboard */
export interface ResumoFinanceiro {
  total_recebido: number
  total_pendente: number
  total_cancelado: number
  consultas_mes: number
  ticket_medio: number
  por_forma_pagamento: Record<FormaPagamento, number>
  por_profissional: Array<{
    profissional_id: string
    nome: string
    total: number
    consultas: number
  }>
}

/** Resumo da agenda para dashboard */
export interface ResumoAgenda {
  hoje: ConsultaDetalhada[]
  semana: ConsultaDetalhada[]
  proximas: ConsultaDetalhada[]
  total_confirmadas: number
  total_pendentes: number
}

/** Dados para geração de documento PDF */
export interface DadosDocumentoPdf {
  documento: Documento
  paciente: Paciente
  profissional: Profile
  consultorio: Configuracoes
}

/** Dados mínimos de paciente para busca/autocomplete */
export type PacienteResumo = Pick<
  Paciente,
  'id' | 'nome_completo' | 'cpf' | 'data_nascimento' | 'telefone_principal' | 'email' | 'idade_calculada'
>
