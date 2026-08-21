import { existsSync } from 'node:fs'
import { Buffer } from 'node:buffer'
import PDFDocument from 'pdfkit'

const ORANGE = '#f04a22'
const DARK = '#17212b'
const MUTED = '#66717d'
const LINE = '#e4e7ea'

const money = (value) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(value) || 0)
const date = (value) => {
  const current = value?.toDate?.() ?? new Date(value)
  return new Intl.DateTimeFormat('es-MX', { timeZone: 'America/Mexico_City', day: '2-digit', month: 'long', year: 'numeric' }).format(current)
}

function textOrFallback(value, fallback = 'No especificado') { return String(value || '').trim() || fallback }

export function generateSalesNotePdf({ order, concepts, payments, company, logoPath }) {
  return new Promise((resolve, reject) => {
    const pdf = new PDFDocument({ size: 'LETTER', margin: 44, info: { Title: `Nota de venta ${order.NumeroPedido}`, Author: textOrFallback(company.Nombre, 'Thunder King') } })
    const chunks = []
    pdf.on('data', (chunk) => chunks.push(chunk))
    pdf.on('end', () => resolve(Buffer.concat(chunks)))
    pdf.on('error', reject)

    const pageWidth = pdf.page.width - 88
    pdf.roundedRect(44, 38, pageWidth, 104, 14).fill(DARK)
    if (logoPath && existsSync(logoPath)) pdf.image(logoPath, 55, 48, { fit: [78, 78], align: 'center', valign: 'center' })
    pdf.fillColor('#ffffff').font('Helvetica-Bold').fontSize(20).text(textOrFallback(company.Nombre, 'Thunder King'), 148, 54, { width: 250 })
    pdf.fillColor('#c5cbd0').font('Helvetica').fontSize(9).text([company.Telefono, company.Direccion].filter(Boolean).join('  •  ') || 'Datos de contacto pendientes', 148, 84, { width: 360 })
    pdf.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10).text('NOTA DE VENTA', 410, 54, { width: 130, align: 'right' })
    pdf.fillColor('#ff8060').fontSize(18).text(`#${order.NumeroPedido}`, 410, 74, { width: 130, align: 'right' })

    let y = 166
    sectionLabel(pdf, 'INFORMACIÓN DEL PEDIDO', y); y += 24
    infoBlock(pdf, 44, y, 248, 'Cliente', textOrFallback(order.Cliente?.Nombre), [textOrFallback(order.Cliente?.Telefono)])
    infoBlock(pdf, 304, y, 248, 'Pedido', `Fecha: ${date(order.FechaPedido || order.FechaCreacion)}`, [`Entrega: ${date(order.FechaEntrega)}`])
    y += 78

    sectionLabel(pdf, 'PRODUCTOS Y SERVICIOS', y); y += 22
    y = tableHeader(pdf, y)
    for (const concept of concepts) {
      const rowHeight = Math.max(30, pdf.heightOfString(concept.Descripcion, { width: 245 }) + 14)
      if (y + rowHeight > 650) { pdf.addPage(); y = 48; sectionLabel(pdf, 'PRODUCTOS Y SERVICIOS (CONTINUACIÓN)', y); y = tableHeader(pdf, y + 22) }
      pdf.fillColor(DARK).font('Helvetica').fontSize(9)
      pdf.text(String(concept.Cantidad), 48, y + 9, { width: 55, align: 'center' })
      pdf.text(concept.Descripcion, 112, y + 9, { width: 245 })
      pdf.text(money(concept.PrecioUnitario), 365, y + 9, { width: 82, align: 'right' })
      pdf.font('Helvetica-Bold').text(money(concept.Total), 455, y + 9, { width: 91, align: 'right' })
      pdf.moveTo(44, y + rowHeight).lineTo(552, y + rowHeight).strokeColor(LINE).stroke()
      y += rowHeight
    }

    if (y > 570) { pdf.addPage(); y = 48 }
    y += 18
    const summaryX = 332
    summaryRow(pdf, summaryX, y, 'Total', money(order.Total)); y += 25
    summaryRow(pdf, summaryX, y, 'Pagado', money(order.TotalPagado)); y += 25
    pdf.roundedRect(summaryX, y, 220, 40, 8).fill(ORANGE)
    pdf.fillColor('#fff').font('Helvetica-Bold').fontSize(10).text('SALDO PENDIENTE', summaryX + 12, y + 14)
    pdf.fontSize(13).text(money(order.Saldo), summaryX + 112, y + 12, { width: 96, align: 'right' })
    y += 60

    if (payments.length) {
      pdf.fillColor(MUTED).font('Helvetica-Bold').fontSize(8).text(`PAGOS REGISTRADOS: ${payments.length}`, 44, y)
      pdf.font('Helvetica').fontSize(8).text(payments.slice(0, 4).map((payment) => `${date(payment.FechaPago)} · ${payment.MetodoPago} · ${money(payment.Cantidad)}`).join('\n'), 44, y + 14, { width: 270, lineGap: 3 })
    }

    const footerY = pdf.page.height - 70
    pdf.moveTo(44, footerY).lineTo(552, footerY).strokeColor(LINE).stroke()
    pdf.fillColor(MUTED).font('Helvetica').fontSize(8).text(textOrFallback(company.MensajeNota, 'Gracias por su preferencia.'), 44, footerY + 13, { width: 350 })
    const social = [company.Facebook && `Facebook: ${company.Facebook}`, company.Instagram && `Instagram: ${company.Instagram}`].filter(Boolean).join('  •  ')
    if (social) pdf.text(social, 390, footerY + 13, { width: 162, align: 'right' })
    pdf.end()
  })
}

function sectionLabel(pdf, label, y) { pdf.fillColor(ORANGE).font('Helvetica-Bold').fontSize(8).text(label, 44, y, { characterSpacing: 1.1 }) }
function infoBlock(pdf, x, y, width, title, main, details) {
  pdf.roundedRect(x, y, width, 60, 9).fill('#f6f7f8')
  pdf.fillColor(MUTED).font('Helvetica-Bold').fontSize(7).text(title.toUpperCase(), x + 12, y + 10)
  pdf.fillColor(DARK).font('Helvetica-Bold').fontSize(10).text(main, x + 12, y + 24, { width: width - 24 })
  pdf.fillColor(MUTED).font('Helvetica').fontSize(8).text(details.join(' · '), x + 12, y + 40, { width: width - 24 })
}
function tableHeader(pdf, y) {
  pdf.rect(44, y, 508, 25).fill(DARK)
  pdf.fillColor('#fff').font('Helvetica-Bold').fontSize(7)
  pdf.text('CANT.', 48, y + 9, { width: 55, align: 'center' }); pdf.text('DESCRIPCIÓN', 112, y + 9)
  pdf.text('PRECIO', 365, y + 9, { width: 82, align: 'right' }); pdf.text('TOTAL', 455, y + 9, { width: 91, align: 'right' })
  return y + 25
}
function summaryRow(pdf, x, y, label, value) {
  pdf.fillColor(MUTED).font('Helvetica').fontSize(9).text(label, x + 8, y + 6)
  pdf.fillColor(DARK).font('Helvetica-Bold').text(value, x + 100, y + 6, { width: 112, align: 'right' })
  pdf.moveTo(x, y + 24).lineTo(x + 220, y + 24).strokeColor(LINE).stroke()
}
