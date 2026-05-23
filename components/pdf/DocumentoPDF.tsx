import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'

const TEAL = '#0f766e'
const TEAL_LIGHT = '#f0fdfa'
const GRAY_50 = '#f8fafc'
const GRAY_400 = '#94a3b8'
const GRAY_500 = '#64748b'
const GRAY_900 = '#0f172a'
const SLATE_800 = '#1e293b'
const SLATE_300 = '#cbd5e1'

const TIPO_LABELS: Record<string, string> = {
  receita: 'RECEITA MÉDICA',
  laudo: 'LAUDO',
  atestado: 'ATESTADO MÉDICO',
  caso_clinico: 'CASO CLÍNICO',
  solicitacao_exame: 'SOLICITAÇÃO DE EXAME',
  relatorio: 'RELATÓRIO',
}

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: SLATE_800,
    paddingTop: 45,
    paddingBottom: 90,
    paddingHorizontal: 55,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: 6,
    marginRight: 14,
  },
  headerTexts: {
    flex: 1,
    justifyContent: 'center',
  },
  nomePrincipal: {
    fontSize: 16,
    fontFamily: 'Helvetica',
    fontWeight: 700,
    color: TEAL,
    marginBottom: 4,
  },
  headerLine: {
    fontSize: 8.5,
    fontFamily: 'Helvetica',
    color: GRAY_500,
    marginBottom: 2,
  },
  divider: {
    borderBottomWidth: 2,
    borderBottomColor: TEAL,
    marginBottom: 22,
  },
  tipoStrip: {
    backgroundColor: TEAL_LIGHT,
    borderLeftWidth: 3,
    borderLeftColor: TEAL,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  tipoText: {
    fontSize: 9,
    fontFamily: 'Helvetica',
    fontWeight: 700,
    color: TEAL,
    marginBottom: 2,
  },
  tituloText: {
    fontSize: 13,
    fontFamily: 'Helvetica',
    fontWeight: 700,
    color: GRAY_900,
  },
  metaBox: {
    backgroundColor: GRAY_50,
    borderRadius: 4,
    padding: 10,
    marginTop: 12,
    marginBottom: 20,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  metaLabel: {
    fontSize: 8.5,
    fontFamily: 'Helvetica',
    fontWeight: 700,
    color: GRAY_500,
    width: 65,
  },
  metaValue: {
    fontSize: 8.5,
    fontFamily: 'Helvetica',
    color: SLATE_800,
    flex: 1,
  },
  sectionLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica',
    fontWeight: 700,
    color: GRAY_400,
    marginBottom: 8,
  },
  content: {
    fontSize: 10.5,
    fontFamily: 'Helvetica',
    lineHeight: 1.65,
    color: SLATE_800,
  },
  signatureWrap: {
    position: 'absolute',
    bottom: 45,
    right: 55,
    width: 190,
    alignItems: 'center',
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: SLATE_300,
    width: '100%',
    marginBottom: 6,
  },
  signatureName: {
    fontSize: 10,
    fontFamily: 'Helvetica',
    fontWeight: 700,
    color: SLATE_800,
    textAlign: 'center',
  },
  signatureCred: {
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: GRAY_400,
    textAlign: 'center',
    marginTop: 2,
  },
  pageNum: {
    position: 'absolute',
    bottom: 20,
    right: 55,
    fontSize: 8,
    fontFamily: 'Helvetica',
    color: GRAY_400,
  },
})

export interface DocumentoPDFProps {
  doc: {
    titulo: string
    tipo: string
    conteudo: string | null
    data_emissao: string
  }
  paciente: { nome_completo: string } | null
  prof: { nome_completo: string; role: string; crm: string | null; crp: string | null } | null
  config: {
    consultorio_nome: string
    consultorio_endereco: string | null
    consultorio_telefones: string[] | null
    consultorio_celular: string | null
    consultorio_email: string | null
    consultorio_logo_url: string | null
  } | null
  dataFormatada: string
}

export function DocumentoPDF({ doc, paciente, prof, config, dataFormatada }: DocumentoPDFProps) {
  const tipoLabel = TIPO_LABELS[doc.tipo] ?? doc.tipo.toUpperCase()
  const nomeConsultorio = config?.consultorio_nome ?? 'Pronto'

  const infos: string[] = []
  if (config?.consultorio_endereco) infos.push(config.consultorio_endereco)
  const fones: string[] = []
  if (config?.consultorio_telefones?.length) fones.push(...config.consultorio_telefones)
  if (config?.consultorio_celular) fones.push(config.consultorio_celular)
  if (fones.length) infos.push(fones.join(' · '))
  if (config?.consultorio_email) infos.push(config.consultorio_email)

  const credencial = prof
    ? [prof.crm ? `CRM ${prof.crm}` : null, prof.crp ? `CRP ${prof.crp}` : null]
        .filter(Boolean)
        .join(' · ')
    : null

  return (
    <Document
      title={doc.titulo}
      author={prof?.nome_completo ?? nomeConsultorio}
      creator={nomeConsultorio}
    >
      <Page size="A4" style={s.page}>
        <View style={s.headerRow}>
          {config?.consultorio_logo_url && (
            <Image src={config.consultorio_logo_url} style={s.logo} />
          )}
          <View style={s.headerTexts}>
            <Text style={s.nomePrincipal}>{nomeConsultorio}</Text>
            {infos.map((line, i) => (
              <Text key={i} style={s.headerLine}>{line}</Text>
            ))}
          </View>
        </View>

        <View style={s.divider} />

        <View style={s.tipoStrip}>
          <Text style={s.tipoText}>{tipoLabel}</Text>
          <Text style={s.tituloText}>{doc.titulo}</Text>
        </View>

        <View style={s.metaBox}>
          <View style={s.metaRow}>
            <Text style={s.metaLabel}>Paciente</Text>
            <Text style={s.metaValue}>{paciente?.nome_completo ?? '—'}</Text>
          </View>
          <View style={[s.metaRow, { marginBottom: 0 }]}>
            <Text style={s.metaLabel}>Data</Text>
            <Text style={s.metaValue}>{dataFormatada}</Text>
          </View>
        </View>

        <Text style={s.sectionLabel}>CONTEÚDO</Text>
        <Text style={s.content}>{doc.conteudo ?? ''}</Text>

        {prof && (
          <View style={s.signatureWrap}>
            <View style={s.signatureLine} />
            <Text style={s.signatureName}>{prof.nome_completo}</Text>
            {credencial && <Text style={s.signatureCred}>{credencial}</Text>}
          </View>
        )}

        <Text
          style={s.pageNum}
          render={({ pageNumber, totalPages }) =>
            totalPages > 1 ? `${pageNumber} / ${totalPages}` : ''
          }
          fixed
        />
      </Page>
    </Document>
  )
}
