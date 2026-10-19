import { Resend } from 'resend'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { TELEFONES_CLINICA } from '@/lib/agendamento/contato'

function escaparHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function enviarEmailRecusaAgendamento(params: {
  para: string
  nome: string
  data: string
  hora: string
  protocolo: string | null
  nomeClinica: string
}): Promise<{ enviado: boolean; motivo?: string }> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  if (!apiKey || !from) {
    return { enviado: false, motivo: 'RESEND_API_KEY ou RESEND_FROM_EMAIL não configurados' }
  }

  const dataTexto = format(parseISO(params.data), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
  const hora = params.hora.slice(0, 5)
  const telefones = TELEFONES_CLINICA.join(' ou ')
  const primeiroNome = params.nome.split(' ')[0]
  const protocolo = params.protocolo ? ` (protocolo ${params.protocolo})` : ''

  const texto = [
    `Olá, ${primeiroNome}.`,
    '',
    `Infelizmente não conseguimos confirmar o seu agendamento online para ${dataTexto} às ${hora}${protocolo}.`,
    '',
    `Para encontrarmos juntos um novo horário, entre em contato pelos telefones ${telefones}.`,
    '',
    `Atenciosamente,`,
    params.nomeClinica,
  ].join('\n')

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#0f172a;max-width:520px">
      <p>Olá, ${escaparHtml(primeiroNome)}.</p>
      <p>Infelizmente não conseguimos confirmar o seu agendamento online para
        <strong>${escaparHtml(dataTexto)} às ${escaparHtml(hora)}</strong>${escaparHtml(protocolo)}.</p>
      <p>Para encontrarmos juntos um novo horário, entre em contato pelos telefones
        <strong>${escaparHtml(telefones)}</strong>.</p>
      <p>Atenciosamente,<br>${escaparHtml(params.nomeClinica)}</p>
    </div>`

  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from,
    to: params.para,
    subject: `Seu agendamento não pôde ser confirmado — ${params.nomeClinica}`,
    text: texto,
    html,
  })

  if (error) {
    console.error('[email] falha ao enviar recusa de agendamento:', error)
    return { enviado: false, motivo: error.message }
  }
  return { enviado: true }
}
