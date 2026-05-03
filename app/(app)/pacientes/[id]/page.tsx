import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ChevronRight,
  Pencil,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Shield,
  User,
  Stethoscope,
  FileText,
  ClipboardList,
  Package,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ExcluirPacienteButton } from '@/components/pacientes/ExcluirPacienteButton'

interface PageProps {
  params: Promise<{ id: string }>
}

const STATUS_LABELS: Record<string, { label: string; class: string }> = {
  agendada: { label: 'Agendada', class: 'border-slate-200 text-slate-600' },
  confirmada: { label: 'Confirmada', class: 'border-teal-200 text-teal-700 bg-teal-50' },
  compareceu: { label: 'Compareceu', class: 'border-green-200 text-green-700 bg-green-50' },
  faltou: { label: 'Faltou', class: 'border-rose-200 text-rose-700 bg-rose-50' },
  cancelada: { label: 'Cancelada', class: 'border-slate-200 text-slate-400' },
}

export default async function PacienteDetalhePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const { data: paciente } = await supabase
    .from('pacientes')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (!paciente) notFound()

  const { data: consultas } = await supabase
    .from('consultas')
    .select('id, data, hora_inicio, hora_fim, status, tipo, profissional_id')
    .eq('paciente_id', id)
    .order('data', { ascending: false })
    .order('hora_inicio', { ascending: false })
    .limit(5)

  const cpfFormatado = paciente.cpf
    ? paciente.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    : null

  const cepFormatado = paciente.endereco_cep
    ? paciente.endereco_cep.replace(/(\d{5})(\d{3})/, '$1-$2')
    : null

  const enderecoCompleto = [
    paciente.endereco_logradouro,
    paciente.endereco_numero && `nº ${paciente.endereco_numero}`,
    paciente.endereco_complemento,
    paciente.endereco_bairro,
    paciente.endereco_cidade && paciente.endereco_uf
      ? `${paciente.endereco_cidade} - ${paciente.endereco_uf}`
      : paciente.endereco_cidade || paciente.endereco_uf,
    cepFormatado && `CEP ${cepFormatado}`,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-400">
        <Link href="/pacientes" className="hover:text-slate-600 transition-colors">
          Pacientes
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-slate-600 truncate max-w-[200px]">{paciente.nome_completo}</span>
      </nav>

      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
            <span className="text-xl font-medium text-slate-400">
              {paciente.nome_completo.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{paciente.nome_completo}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {paciente.idade_calculada != null && (
                <span className="text-sm text-slate-500">{paciente.idade_calculada} anos</span>
              )}
              {cpfFormatado && (
                <span className="text-sm text-slate-400">CPF: {cpfFormatado}</span>
              )}
              {paciente.atendido_por_medica && (
                <Badge className="text-xs bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-50">
                  Médica
                </Badge>
              )}
              {paciente.atendido_por_psicologa && (
                <Badge className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-50">
                  Psicóloga
                </Badge>
              )}
              {paciente.convenio_nome && (
                <Badge variant="secondary" className="text-xs">
                  {paciente.convenio_nome}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {profile?.role === 'admin' && (
            <ExcluirPacienteButton pacienteId={id} nomePaciente={paciente.nome_completo} />
          )}
          <Link href={`/pacientes/${id}/editar`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
            <Pencil className="h-4 w-4 mr-1.5" />
            Editar
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Coluna principal */}
        <div className="lg:col-span-2 space-y-5">
          {/* Dados pessoais */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400" />
                Dados Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <InfoItem label="Nome completo" value={paciente.nome_completo} />
                <InfoItem label="CPF" value={cpfFormatado} />
                <InfoItem label="RG" value={paciente.rg} />
                <InfoItem
                  label="Data de nascimento"
                  value={
                    paciente.data_nascimento
                      ? format(
                          new Date(paciente.data_nascimento + 'T00:00:00'),
                          "dd 'de' MMMM 'de' yyyy",
                          { locale: ptBR }
                        )
                      : null
                  }
                />
                <InfoItem
                  label="Gênero"
                  value={
                    {
                      feminino: 'Feminino',
                      masculino: 'Masculino',
                      outro: 'Outro',
                      nao_informado: 'Não informado',
                    }[paciente.genero] ?? paciente.genero
                  }
                />
                <InfoItem label="Estado civil" value={paciente.estado_civil} />
                <InfoItem label="Profissão" value={paciente.profissao} />
                <InfoItem label="Naturalidade" value={paciente.naturalidade} />
                <InfoItem label="Nacionalidade" value={paciente.nacionalidade} />
                <InfoItem label="Grupo sanguíneo" value={paciente.grupo_sanguineo} />
              </div>
              {paciente.observacoes_gerais && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Observações gerais</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                      {paciente.observacoes_gerais}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Contato */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Phone className="h-4 w-4 text-slate-400" />
                Contato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {paciente.telefone_principal && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span>{paciente.telefone_principal}</span>
                  <Badge variant="secondary" className="text-xs ml-1">principal</Badge>
                </div>
              )}
              {paciente.telefone_secundario && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span>{paciente.telefone_secundario}</span>
                </div>
              )}
              {paciente.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <a href={`mailto:${paciente.email}`} className="text-teal-600 hover:underline">
                    {paciente.email}
                  </a>
                </div>
              )}
              {enderecoCompleto && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <span className="text-slate-600">{enderecoCompleto}</span>
                </div>
              )}
              {!paciente.telefone_principal && !paciente.email && !enderecoCompleto && (
                <p className="text-slate-400">Nenhum contato cadastrado</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna lateral */}
        <div className="space-y-5">
          {/* Convênio */}
          {paciente.convenio_nome && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Convênio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <InfoItem label="Convênio" value={paciente.convenio_nome} />
                <InfoItem label="Nº carteirinha" value={paciente.convenio_codigo} />
                <InfoItem
                  label="Validade"
                  value={
                    paciente.convenio_validade
                      ? format(
                          new Date(paciente.convenio_validade + 'T00:00:00'),
                          'dd/MM/yyyy',
                          { locale: ptBR }
                        )
                      : null
                  }
                />
              </CardContent>
            </Card>
          )}

          {/* LGPD */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-slate-400" />
                LGPD
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {paciente.consentimento_lgpd_aceito ? (
                <div className="space-y-1">
                  <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-50">
                    Consentimento aceito
                  </Badge>
                  {paciente.consentimento_lgpd_data && (
                    <p className="text-xs text-slate-400 mt-2">
                      Em{' '}
                      {format(new Date(paciente.consentimento_lgpd_data), 'dd/MM/yyyy HH:mm', {
                        locale: ptBR,
                      })}
                    </p>
                  )}
                </div>
              ) : (
                <Badge variant="outline" className="border-rose-200 text-rose-600">
                  Consentimento pendente
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Próximas consultas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                Consultas recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!consultas || consultas.length === 0 ? (
                <p className="text-xs text-slate-400">Nenhuma consulta registrada</p>
              ) : (
                <div className="space-y-2">
                  {consultas.map((c) => {
                    const st = STATUS_LABELS[c.status] ?? { label: c.status, class: '' }
                    return (
                      <div key={c.id} className="flex items-center justify-between text-xs">
                        <div>
                          <p className="font-medium text-slate-700">
                            {format(new Date(c.data + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                          <p className="text-slate-400">
                            {c.hora_inicio} — {c.hora_fim}
                          </p>
                        </div>
                        <Badge variant="outline" className={`text-xs ${st.class}`}>
                          {st.label}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              )}
              <Link
                href={`/agenda?paciente=${id}`}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-3 w-full justify-center')}
              >
                Ver na agenda
              </Link>
            </CardContent>
          </Card>

          {/* Atalhos */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-500">Prontuário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link
                href={`/pacientes/${id}/anamnese`}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-full justify-start gap-2')}
              >
                <ClipboardList className="h-4 w-4" />
                Anamnese
              </Link>
              <Link
                href={`/pacientes/${id}/evolucoes`}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-full justify-start gap-2')}
              >
                <Stethoscope className="h-4 w-4" />
                Evoluções Clínicas
              </Link>
              <Link
                href={`/pacientes/${id}/documentos`}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-full justify-start gap-2')}
              >
                <FileText className="h-4 w-4" />
                Documentos
              </Link>
              <Link
                href={`/pacientes/${id}/pacotes`}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-full justify-start gap-2')}
              >
                <Package className="h-4 w-4" />
                Pacotes de Psicologia
              </Link>
            </CardContent>
          </Card>

          {/* Metadados */}
          <p className="text-xs text-slate-400 text-center">
            Cadastrado em{' '}
            {format(new Date(paciente.created_at), 'dd/MM/yyyy', { locale: ptBR })}
          </p>
        </div>
      </div>
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-slate-700">{value}</p>
    </div>
  )
}
