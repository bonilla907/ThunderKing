import { useState } from 'react'
import { Banknote, X } from 'lucide-react'
import { PAYMENT_METHODS } from '../../config/payments'
import { formatCurrency } from '../../utils/formatters'

export function PaymentForm({ balance, onSubmit, onCancel, title = 'Registrar pago' }) {
  const [payment, setPayment] = useState({ Cantidad: '', MetodoPago: 'Efectivo', Observaciones: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const handleSubmit = async (event) => {
    event.preventDefault()
    if (saving) return
    setError(''); setSaving(true)
    try { await onSubmit(payment) }
    catch (submitError) { setError(submitError.message || 'No fue posible registrar el pago.'); setSaving(false) }
  }
  return <form className="payment-form" onSubmit={handleSubmit}>
    <div className="payment-form__heading"><span><Banknote size={21} /></span><div><h2>{title}</h2><p>Saldo actual: <strong>{formatCurrency(balance)}</strong></p></div>{onCancel && <button type="button" className="icon-button" onClick={onCancel} aria-label="Cerrar"><X size={20} /></button>}</div>
    {error && <div className="alert alert--error" role="alert">{error}</div>}
    <div className="payment-fields"><label className="field"><span>Cantidad</span><input type="number" min="0.01" max={balance} step="0.01" value={payment.Cantidad} onChange={(e) => setPayment((value) => ({ ...value, Cantidad: e.target.value }))} placeholder="0.00" required /></label><label className="field"><span>Método de pago</span><select value={payment.MetodoPago} onChange={(e) => setPayment((value) => ({ ...value, MetodoPago: e.target.value }))}>{PAYMENT_METHODS.map((method) => <option key={method}>{method}</option>)}</select></label></div>
    <label className="field"><span>Observaciones <small>(opcional)</small></span><textarea rows="3" value={payment.Observaciones} onChange={(e) => setPayment((value) => ({ ...value, Observaciones: e.target.value }))} placeholder="Referencia o nota del pago" /></label>
    <button className="primary-button" type="submit" disabled={saving || balance <= 0}>{saving ? <><span className="spinner spinner--button" />Registrando...</> : 'Confirmar pago'}</button>
  </form>
}
