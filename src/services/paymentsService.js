import { collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/firebaseConfig'

const roundMoney = (value) => Math.round(Number(value) * 100) / 100

export async function registerPayment(orderId, payment, user) {
  const amount = roundMoney(payment.Cantidad)
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('La cantidad del pago debe ser mayor a cero.')
  if (!payment.MetodoPago) throw new Error('Selecciona un método de pago.')

  const orderRef = doc(db, 'Pedidos', orderId)
  const paymentRef = doc(collection(orderRef, 'Pagos'))
  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(orderRef)
    if (!snapshot.exists()) throw new Error('El pedido no existe.')
    const order = snapshot.data()
    const currentPaid = roundMoney(order.TotalPagado || 0)
    const total = roundMoney(order.Total)
    const newPaid = roundMoney(currentPaid + amount)
    if (newPaid > total) throw new Error(`El pago supera el saldo pendiente de $${roundMoney(total - currentPaid).toFixed(2)}.`)
    const balance = roundMoney(total - newPaid)
    transaction.set(paymentRef, {
      Cantidad: amount,
      MetodoPago: payment.MetodoPago,
      Observaciones: payment.Observaciones?.trim() || '',
      FechaPago: serverTimestamp(),
      UsuarioId: user.uid,
      UsuarioNombre: user.name || user.email || 'Administrador',
    })
    transaction.update(orderRef, { TotalPagado: newPaid, Saldo: balance, FechaActualizacion: serverTimestamp() })
    return { id: paymentRef.id, TotalPagado: newPaid, Saldo: balance }
  })
}
