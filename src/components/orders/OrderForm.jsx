import { Banknote, Plus, Save, Trash2, UserRound } from 'lucide-react'
import { useMemo, useState } from 'react'
import { PAYMENT_METHODS } from '../../config/payments'
import { formatCurrency } from '../../utils/formatters'
import { cleanPhone, formatPhone } from '../../utils/phone'

const emptyConcept = () => ({ Cantidad: 1, Descripcion: '', PrecioUnitario: '' })

export function OrderForm({ initialData, clients = [], onSubmit, submitLabel = 'Guardar pedido', allowInitialPayment = false }) {
  const [client, setClient] = useState(initialData?.client ?? { Nombre: '', Telefono: '' })
  const [deliveryDate, setDeliveryDate] = useState(initialData?.deliveryDate ?? '')
  const [concepts, setConcepts] = useState(initialData?.concepts?.length ? initialData.concepts : [emptyConcept()])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [clientResultsOpen, setClientResultsOpen] = useState(false)
  const [initialPayment, setInitialPayment] = useState({ Cantidad: '', MetodoPago: 'Efectivo', Observaciones: '' })

  const total = useMemo(() => concepts.reduce((sum, item) => sum + (Number(item.Cantidad) || 0) * (Number(item.PrecioUnitario) || 0), 0), [concepts])
  const matchingClients = useMemo(() => {
    const term = client.Nombre.trim().toLocaleLowerCase('es-MX')
    const phone = cleanPhone(client.Telefono)
    if ((!term || term.length < 2) && phone.length < 3) return []
    return clients.filter((item) => item.Nombre?.toLocaleLowerCase('es-MX').includes(term) || item.Telefono?.includes(phone)).slice(0, 6)
  }, [client, clients])

  const updateConcept = (index, field, value) => setConcepts((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item))
  const removeConcept = (index) => setConcepts((current) => current.length === 1 ? current : current.filter((_, itemIndex) => itemIndex !== index))
  const selectClient = (item) => { setClient({ Nombre: item.Nombre, Telefono: item.Telefono }); setClientResultsOpen(false) }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (saving) return
    setError(''); setSaving(true)
    try { await onSubmit({ client, concepts, deliveryDate, total, initialPayment }) }
    catch (submitError) { setError(submitError.message || 'No fue posible guardar el pedido.') }
    finally { setSaving(false) }
  }

  return <form className="order-form" onSubmit={handleSubmit}>
    {error && <div className="alert alert--error" role="alert">{error}</div>}
    <section className="content-card"><div className="card-heading"><span><UserRound size={21} /></span><div><h2>Cliente</h2><p>Busca un cliente existente o registra uno nuevo.</p></div></div>
      <div className="form-grid client-fields">
        <label className="field client-search"><span>Nombre completo</span><input value={client.Nombre} onChange={(e) => { setClient((value) => ({ ...value, Nombre: e.target.value })); setClientResultsOpen(true) }} onFocus={() => setClientResultsOpen(true)} placeholder="Nombre del cliente" autoComplete="off" required />
          {clientResultsOpen && matchingClients.length > 0 && <div className="search-results">{matchingClients.map((item) => <button type="button" key={item.id} onClick={() => selectClient(item)}><strong>{item.Nombre}</strong><span>{formatPhone(item.Telefono)}</span></button>)}</div>}
        </label>
        <label className="field"><span>Teléfono</span><input value={client.Telefono} onChange={(e) => setClient((value) => ({ ...value, Telefono: cleanPhone(e.target.value) }))} placeholder="10 dígitos" inputMode="numeric" maxLength="10" required /></label>
      </div>
    </section>

    <section className="content-card"><div className="card-heading card-heading--action"><div><h2>Conceptos</h2><p>Agrega los productos o servicios del pedido.</p></div><button className="secondary-button" type="button" onClick={() => setConcepts((current) => [...current, emptyConcept()])}><Plus size={18} />Agregar concepto</button></div>
      <div className="concept-list"><div className="concept-row concept-row--head"><span>Piezas</span><span>Descripción</span><span>Precio unitario</span><span>Total</span><span /></div>
        {concepts.map((concept, index) => <div className="concept-row" key={index}>
          <label><span className="mobile-label">Piezas</span><input type="number" min="1" step="1" value={concept.Cantidad} onChange={(e) => updateConcept(index, 'Cantidad', e.target.value)} required /></label>
          <label><span className="mobile-label">Descripción</span><input value={concept.Descripcion} onChange={(e) => updateConcept(index, 'Descripcion', e.target.value)} placeholder="Ej. Playera estampada" required /></label>
          <label><span className="mobile-label">Precio unitario</span><input type="number" min="0" step="0.01" value={concept.PrecioUnitario} onChange={(e) => updateConcept(index, 'PrecioUnitario', e.target.value)} placeholder="0.00" required /></label>
          <span className="concept-total"><span className="mobile-label">Total</span>{formatCurrency((Number(concept.Cantidad) || 0) * (Number(concept.PrecioUnitario) || 0))}</span>
          <button type="button" className="danger-icon-button" onClick={() => removeConcept(index)} disabled={concepts.length === 1} aria-label="Eliminar concepto"><Trash2 size={18} /></button>
        </div>)}
      </div>
    </section>

    {allowInitialPayment && <section className="content-card"><div className="card-heading"><span><Banknote size={21} /></span><div><h2>Pago inicial</h2><p>Registra lo que el cliente deja a cuenta. Puedes dejarlo en cero.</p></div></div><div className="form-grid payment-initial-grid"><label className="field"><span>Cantidad</span><input type="number" min="0" max={total} step="0.01" value={initialPayment.Cantidad} onChange={(e) => setInitialPayment((value) => ({ ...value, Cantidad: e.target.value }))} placeholder="0.00" /></label><label className="field"><span>Método de pago</span><select value={initialPayment.MetodoPago} onChange={(e) => setInitialPayment((value) => ({ ...value, MetodoPago: e.target.value }))}>{PAYMENT_METHODS.map((method) => <option key={method}>{method}</option>)}</select></label><label className="field field--full"><span>Observaciones <small>(opcional)</small></span><input value={initialPayment.Observaciones} onChange={(e) => setInitialPayment((value) => ({ ...value, Observaciones: e.target.value }))} placeholder="Referencia o nota del pago" /></label></div></section>}
    <div className="order-bottom-grid"><section className="content-card"><div className="card-heading"><div><h2>Entrega</h2><p>Define la fecha comprometida.</p></div></div><label className="field"><span>Fecha de entrega</span><input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} required /></label></section>
      <section className="summary-card"><span className="eyebrow">Resumen</span><div><span>Total del pedido</span><strong>{formatCurrency(total)}</strong></div><div><span>Total pagado</span><strong>{formatCurrency((initialData?.totalPaid ?? 0) + (allowInitialPayment ? Number(initialPayment.Cantidad) || 0 : 0))}</strong></div><div className="summary-card__balance"><span>Saldo pendiente</span><strong>{formatCurrency(total - (initialData?.totalPaid ?? 0) - (allowInitialPayment ? Number(initialPayment.Cantidad) || 0 : 0))}</strong></div></section></div>
    <div className="sticky-actions"><button className="primary-button primary-button--inline" type="submit" disabled={saving}>{saving ? <><span className="spinner spinner--button" />Guardando...</> : <><Save size={18} />{submitLabel}</>}</button></div>
  </form>
}
