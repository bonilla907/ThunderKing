import { FieldValue } from 'firebase-admin/firestore'

const GRAPH_BASE_URL = 'https://graph.facebook.com'

function digits(value = '') {
  return String(value).replace(/\D/g, '')
}

export function normalizeMexicanPhone(value = '') {
  const phone = digits(value)
  if (phone.length === 10) return `52${phone}`
  if (phone.length === 12 && phone.startsWith('52')) return phone
  throw new Error('El cliente no tiene un teléfono válido de 10 dígitos.')
}

function money(value) {
  return Number(value || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function date(value) {
  const parsed = value?.toDate ? value.toDate() : new Date(value)
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'long', timeZone: 'America/Mexico_City' }).format(parsed)
}

async function graphRequest(path, accessToken, options = {}) {
  const response = await fetch(`${GRAPH_BASE_URL}/${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${accessToken}`, ...options.headers },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(payload.error?.message || 'WhatsApp rechazó la solicitud.')
    error.code = payload.error?.code
    error.details = payload.error?.error_data?.details
    throw error
  }
  return payload
}

async function uploadPdf({ accessToken, apiVersion, phoneNumberId, pdfBuffer, fileName }) {
  const body = new FormData()
  body.append('messaging_product', 'whatsapp')
  body.append('type', 'application/pdf')
  body.append('file', new Blob([pdfBuffer], { type: 'application/pdf' }), fileName)
  const result = await graphRequest(`${apiVersion}/${phoneNumberId}/media`, accessToken, { method: 'POST', body })
  if (!result.id) throw new Error('Meta no devolvió el identificador del documento.')
  return result.id
}

export async function sendSalesNoteWhatsApp({ order, pdfBuffer, config }) {
  const telephone = normalizeMexicanPhone(order.Cliente?.TelefonoWhatsApp || order.Cliente?.Telefono)
  const fileName = `nota-venta-${order.NumeroPedido}.pdf`
  const mediaId = await uploadPdf({ ...config, pdfBuffer, fileName })
  const body = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: telephone,
    type: 'template',
    template: {
      name: config.templateName,
      language: { code: config.templateLanguage },
      components: [
        { type: 'header', parameters: [{ type: 'document', document: { id: mediaId, filename: fileName } }] },
        { type: 'body', parameters: [
          { type: 'text', text: String(order.Cliente?.Nombre || 'Cliente') },
          { type: 'text', text: String(order.NumeroPedido) },
          { type: 'text', text: date(order.FechaEntrega) },
          { type: 'text', text: money(order.Total) },
          { type: 'text', text: money(order.TotalPagado) },
          { type: 'text', text: money(order.Saldo) },
        ] },
      ],
    },
  }
  const result = await graphRequest(`${config.apiVersion}/${config.phoneNumberId}/messages`, config.accessToken, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
  const messageId = result.messages?.[0]?.id
  if (!messageId) throw new Error('Meta no devolvió el identificador del mensaje.')
  return { messageId, telephone, mediaId }
}

export function successWhatsAppState(messageId) {
  return { Enviado: true, FechaEnvio: FieldValue.serverTimestamp(), MessageId: messageId, Error: null }
}
