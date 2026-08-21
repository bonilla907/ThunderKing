import { ArrowLeft, Banknote, CalendarDays, Download, Edit3, FileText, MessageCircle, PackageCheck, Phone, ReceiptText, RefreshCw, TriangleAlert, UserRound, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { PaymentForm } from '../../components/payments/PaymentForm'
import { useAuth } from '../../hooks/useAuth'
import { finishOrder, getOrder } from '../../services/ordersService'
import { registerPayment } from '../../services/paymentsService'
import { generateSalesNote, getSalesNoteUrl } from '../../services/pdfService'
import { sendSalesNoteWhatsApp } from '../../services/whatsappService'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { getOrderTiming, getTimingMessage } from '../../utils/orderCategories'
import { formatPhone } from '../../utils/phone'

const WHATSAPP_ENABLED = import.meta.env.VITE_WHATSAPP_ENABLED === 'true'

export function OrderDetailPage() {
  const { orderId } = useParams()
  const location = useLocation()
  const { user, profile } = useAuth()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [message, setMessage] = useState(location.state?.success || '')
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [finishOpen, setFinishOpen] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [pdfBusy, setPdfBusy] = useState('')
  const [pdfError, setPdfError] = useState('')
  const [whatsAppBusy, setWhatsAppBusy] = useState(false)
  const [whatsAppError, setWhatsAppError] = useState('')

  useEffect(() => {
    let active = true
    getOrder(orderId)
      .then((data) => { if (active) { setOrder(data); setError('') } })
      .catch((loadError) => { if (active) setError(loadError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [orderId])

  const handlePayment = async (payment) => {
    await registerPayment(orderId, payment, { uid: user.uid, name: profile?.Nombre, email: user.email })
    setOrder(await getOrder(orderId))
    setPaymentOpen(false)
    setMessage('El pago se registró correctamente.')
  }

  const handleFinish = async () => {
    if (finishing) return
    setFinishing(true); setActionError('')
    try {
      await finishOrder(orderId)
      setOrder(await getOrder(orderId))
      setFinishOpen(false)
      setMessage('El pedido se marcó como entregado correctamente.')
    } catch (finishError) { setActionError(finishError.message); setFinishOpen(false) }
    finally { setFinishing(false) }
  }

  const handleGeneratePdf = async () => {
    if (pdfBusy) return
    setPdfBusy('generate'); setPdfError('')
    try {
      await generateSalesNote(orderId)
      setOrder(await getOrder(orderId))
      setMessage(order.PDF?.Generado ? 'La nota de venta se regeneró correctamente.' : 'La nota de venta se generó correctamente.')
    } catch (pdfGenerationError) { setPdfError(pdfGenerationError.message || 'No fue posible generar la nota.') }
    finally { setPdfBusy('') }
  }

  const handleOpenPdf = async (download = false) => {
    if (pdfBusy) return
    const newTab = window.open('', '_blank')
    setPdfBusy(download ? 'download' : 'view'); setPdfError('')
    try {
      const { url } = await getSalesNoteUrl(orderId, download)
      if (newTab) newTab.location.href = url
      else window.location.href = url
    } catch (pdfUrlError) { if (newTab) newTab.close(); setPdfError(pdfUrlError.message || 'No fue posible abrir la nota.') }
    finally { setPdfBusy('') }
  }

  const handleSendWhatsApp = async () => {
    if (whatsAppBusy) return
    setWhatsAppBusy(true); setWhatsAppError('')
    try {
      await sendSalesNoteWhatsApp(orderId)
      setOrder(await getOrder(orderId))
      setMessage(order.WhatsApp?.Enviado ? 'La nota se envió nuevamente por WhatsApp.' : 'La nota se envió por WhatsApp correctamente.')
    } catch (sendError) {
      setOrder(await getOrder(orderId).catch(() => order))
      setWhatsAppError(sendError.message || 'No fue posible enviar la nota por WhatsApp.')
    } finally { setWhatsAppBusy(false) }
  }

  if (loading) return <div className="inline-loader"><span className="spinner" />Cargando pedido...</div>
  if (error) return <div className="alert alert--error">{error}</div>
  const timing = getOrderTiming(order)
  return <div className="page-stack">{message && <div className="alert alert--success">{message}</div>}{actionError && <div className="alert alert--error">{actionError}</div>}{pdfError && <div className="alert alert--error">{pdfError}</div>}{whatsAppError && <div className="alert alert--error">El pedido permanece guardado. {whatsAppError}</div>}
    {timing.category === 'atrasado' && <div className="overdue-notice"><TriangleAlert size={21} /><div><strong>Pedido atrasado</strong><span>{getTimingMessage(timing)}. Fecha comprometida: {formatDate(order.FechaEntrega)}.</span></div></div>}
    <header className="page-header page-header--action"><div><Link className="back-link" to={order.Estado === 'entregado' ? '/entregados' : '/pedidos'}><ArrowLeft size={17} />Volver a {order.Estado === 'entregado' ? 'entregados' : 'pedidos'}</Link><span className="eyebrow">Detalle del pedido</span><h1>Pedido #{order.NumeroPedido}</h1><p>Registrado el {formatDate(order.FechaPedido || order.FechaCreacion)}</p></div><div className="header-actions"><Link className="secondary-button" to={`/pedidos/${order.id}/editar`}><Edit3 size={18} />Editar pedido</Link><button className="secondary-button" type="button" onClick={() => setPaymentOpen(true)} disabled={order.Saldo <= 0}><Banknote size={18} />Registrar pago</button>{order.Estado === 'pendiente' && <button className="primary-button primary-button--inline" type="button" onClick={() => setFinishOpen(true)}><PackageCheck size={18} />Terminar pedido</button>}</div></header>
    <div className="detail-grid"><section className="content-card"><div className="card-heading"><span><UserRound size={21} /></span><div><h2>Cliente</h2><p>Información de contacto</p></div></div><dl className="info-list"><div><dt>Nombre</dt><dd>{order.Cliente?.Nombre}</dd></div><div><dt><Phone size={15} />Teléfono</dt><dd>{formatPhone(order.Cliente?.Telefono)}</dd></div></dl></section>
      <section className="content-card"><div className="card-heading"><span><CalendarDays size={21} /></span><div><h2>Entrega</h2><p>{order.Estado === 'entregado' ? 'Información de entrega' : 'Fecha comprometida'}</p></div></div><dl className="info-list"><div><dt>Fecha comprometida</dt><dd>{formatDate(order.FechaEntrega)}</dd></div><div><dt>Estado real</dt><dd><span className={`status-badge ${order.Estado === 'entregado' ? 'status-badge--delivered' : ''}`}>{order.Estado}</span></dd></div>{order.Estado === 'entregado' ? <><div><dt>Fecha real de entrega</dt><dd>{formatDate(order.FechaEntregaReal)}</dd></div><div><dt>Situación de pago</dt><dd><span className={`delivery-badge ${order.Saldo > 0 ? 'delivery-badge--balance' : ''}`}>{order.Saldo > 0 ? 'Con saldo pendiente' : 'Pagado'}</span></dd></div></> : <><div><dt>Categoría actual</dt><dd><span className={`category-badge category-badge--${timing.category}`}>{timing.label}</span></dd></div><div><dt>Seguimiento</dt><dd>{getTimingMessage(timing)}</dd></div></>}</dl></section></div>
    <section className="content-card"><div className="card-heading"><div><h2>Conceptos</h2><p>Productos y servicios registrados.</p></div></div><div className="responsive-table"><table><thead><tr><th>Cantidad</th><th>Descripción</th><th>Precio unitario</th><th>Total</th></tr></thead><tbody>{order.Conceptos.map((item) => <tr key={item.id}><td data-label="Cantidad">{item.Cantidad}</td><td data-label="Descripción"><strong>{item.Descripcion}</strong></td><td data-label="Precio unitario">{formatCurrency(item.PrecioUnitario)}</td><td data-label="Total"><strong>{formatCurrency(item.Total)}</strong></td></tr>)}</tbody></table></div></section>
    <section className="financial-strip"><div><span>Total</span><strong>{formatCurrency(order.Total)}</strong></div><div><span>Pagado</span><strong>{formatCurrency(order.TotalPagado)}</strong></div><div className="financial-strip__balance"><span>Saldo pendiente</span><strong>{formatCurrency(order.Saldo)}</strong></div></section>
    <section className="content-card pdf-card"><div className="card-heading"><span><FileText size={21} /></span><div><h2>Nota de venta</h2><p>Documento PDF privado generado desde el servidor.</p></div></div><div className="pdf-card__content"><div><span className={`pdf-state ${order.PDF?.Generado ? 'pdf-state--ready' : ''}`}>{order.PDF?.Generado ? 'PDF disponible' : 'Sin generar'}</span><p>{order.PDF?.Generado ? `Última generación: ${formatDate(order.PDF.FechaGeneracion)}` : 'Genera la nota con los datos actuales del pedido.'}</p></div><div className="pdf-actions">{order.PDF?.Generado && <><button className="secondary-button" type="button" onClick={() => handleOpenPdf(false)} disabled={Boolean(pdfBusy)}><FileText size={17} />{pdfBusy === 'view' ? 'Abriendo...' : 'Ver nota'}</button><button className="secondary-button" type="button" onClick={() => handleOpenPdf(true)} disabled={Boolean(pdfBusy)}><Download size={17} />{pdfBusy === 'download' ? 'Preparando...' : 'Descargar'}</button></>}<button className="primary-button primary-button--inline" type="button" onClick={handleGeneratePdf} disabled={Boolean(pdfBusy)}>{pdfBusy === 'generate' ? <><span className="spinner spinner--button" />Generando...</> : order.PDF?.Generado ? <><RefreshCw size={17} />Regenerar</> : <><FileText size={17} />Generar nota</>}</button></div></div></section>
    {WHATSAPP_ENABLED && <section className="content-card whatsapp-card"><div className="card-heading"><span><MessageCircle size={21} /></span><div><h2>WhatsApp</h2><p>Envío oficial mediante WhatsApp Business Platform.</p></div></div><div className="whatsapp-card__content"><div><span className={`whatsapp-state ${order.WhatsApp?.Enviado ? 'whatsapp-state--sent' : order.WhatsApp?.Error ? 'whatsapp-state--error' : ''}`}>{order.WhatsApp?.Enviado ? 'Nota enviada' : order.WhatsApp?.Error ? 'Último intento fallido' : 'Sin enviar'}</span><p>{order.WhatsApp?.Enviado ? `Último envío: ${formatDate(order.WhatsApp.FechaEnvio)}` : order.WhatsApp?.Error || 'Genera primero el PDF para poder enviarlo.'}</p></div><button className="whatsapp-button" type="button" onClick={handleSendWhatsApp} disabled={whatsAppBusy || !order.PDF?.Generado}><MessageCircle size={18} />{whatsAppBusy ? 'Enviando...' : order.WhatsApp?.Enviado ? 'Enviar nuevamente' : order.WhatsApp?.Error ? 'Reintentar envío' : 'Enviar por WhatsApp'}</button></div></section>}
    <section className="content-card"><div className="card-heading"><span><ReceiptText size={21} /></span><div><h2>Historial de pagos</h2><p>Los abonos registrados no se eliminan al editar el pedido.</p></div></div>{order.Pagos.length === 0 ? <div className="empty-payments"><Banknote size={26} /><p>Aún no hay pagos registrados.</p></div> : <div className="responsive-table"><table><thead><tr><th>Fecha</th><th>Cantidad</th><th>Método</th><th>Registró</th><th>Observaciones</th></tr></thead><tbody>{order.Pagos.map((payment) => <tr key={payment.id}><td data-label="Fecha">{formatDate(payment.FechaPago)}</td><td data-label="Cantidad"><strong>{formatCurrency(payment.Cantidad)}</strong></td><td data-label="Método"><span className="payment-method">{payment.MetodoPago}</span></td><td data-label="Registró">{payment.UsuarioNombre}</td><td data-label="Observaciones">{payment.Observaciones || '—'}</td></tr>)}</tbody></table></div>}</section>
    {paymentOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPaymentOpen(false) }}><div className="modal-card" role="dialog" aria-modal="true" aria-label="Registrar pago"><PaymentForm balance={order.Saldo} onSubmit={handlePayment} onCancel={() => setPaymentOpen(false)} /></div></div>}
    {finishOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setFinishOpen(false) }}><div className="modal-card confirmation-card" role="dialog" aria-modal="true" aria-label="Confirmar entrega"><button className="icon-button confirmation-card__close" type="button" onClick={() => setFinishOpen(false)}><X size={20} /></button><span className="confirmation-card__icon"><PackageCheck size={28} /></span><h2>¿Terminar pedido #{order.NumeroPedido}?</h2><p>Se registrará la fecha real de entrega. {order.Saldo > 0 && <>El pedido aún tiene un saldo de <strong>{formatCurrency(order.Saldo)}</strong>, pero podrá seguir recibiendo pagos.</>}</p><div className="confirmation-card__actions"><button className="secondary-button" type="button" onClick={() => setFinishOpen(false)} disabled={finishing}>Cancelar</button><button className="primary-button primary-button--inline" type="button" onClick={handleFinish} disabled={finishing}>{finishing ? <><span className="spinner spinner--button" />Terminando...</> : 'Confirmar entrega'}</button></div></div></div>}
  </div>
}
