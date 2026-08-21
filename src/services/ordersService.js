import {
  collection, doc, getDoc, getDocs, limit, orderBy, query, runTransaction,
  serverTimestamp, Timestamp, writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase/firebaseConfig'
import { cleanPhone, normalizePhoneForWhatsApp } from '../utils/phone'
import { dateInputToDate } from '../utils/formatters'

function sanitizeConcepts(concepts) {
  return concepts.map((concept, index) => {
    const Cantidad = Number(concept.Cantidad)
    const PrecioUnitario = Number(concept.PrecioUnitario)
    const Total = Math.round(Cantidad * PrecioUnitario * 100) / 100
    return { Cantidad, Descripcion: concept.Descripcion.trim(), PrecioUnitario, Total, Orden: index }
  })
}

function validateOrder({ client, concepts, deliveryDate }) {
  const phone = cleanPhone(client.Telefono)
  if (!client.Nombre.trim()) throw new Error('Escribe el nombre del cliente.')
  if (phone.length !== 10) throw new Error('El teléfono debe contener 10 dígitos.')
  if (!deliveryDate) throw new Error('Selecciona una fecha de entrega.')
  if (!concepts.length) throw new Error('Agrega por lo menos un concepto.')
  if (concepts.some((item) => Number(item.Cantidad) <= 0 || !item.Descripcion.trim() || Number(item.PrecioUnitario) < 0)) {
    throw new Error('Revisa la cantidad, descripción y precio de todos los conceptos.')
  }
}

function clientData(client) {
  const Telefono = cleanPhone(client.Telefono)
  return {
    Nombre: client.Nombre.trim(), NombreNormalizado: client.Nombre.trim().toLocaleLowerCase('es-MX'),
    Telefono, TelefonoWhatsApp: normalizePhoneForWhatsApp(Telefono), Activo: true,
  }
}

export async function createOrder({ client, concepts, deliveryDate, initialPayment, userId, userName }) {
  validateOrder({ client, concepts, deliveryDate })
  const cleanConcepts = sanitizeConcepts(concepts)
  const customer = clientData(client)
  const total = Math.round(cleanConcepts.reduce((sum, item) => sum + item.Total, 0) * 100) / 100
  const initialAmount = Math.round((Number(initialPayment?.Cantidad) || 0) * 100) / 100
  if (initialAmount < 0 || initialAmount > total) throw new Error('El pago inicial no puede superar el total del pedido.')
  if (initialAmount > 0 && !initialPayment?.MetodoPago) throw new Error('Selecciona el método del pago inicial.')
  const clientRef = doc(db, 'Clientes', `tel_${customer.Telefono}`)
  const orderRef = doc(collection(db, 'Pedidos'))
  const counterRef = doc(db, 'Contadores', 'Pedidos')

  const orderNumber = await runTransaction(db, async (transaction) => {
    const [counterSnapshot, clientSnapshot] = await Promise.all([transaction.get(counterRef), transaction.get(clientRef)])
    const current = counterSnapshot.exists() ? Number(counterSnapshot.data().UltimoNumero) || 1000 : 1000
    const next = current + 1
    transaction.set(counterRef, { UltimoNumero: next, FechaActualizacion: serverTimestamp() }, { merge: true })
    transaction.set(clientRef, { ...customer, FechaActualizacion: serverTimestamp(), ...(!clientSnapshot.exists() ? { FechaCreacion: serverTimestamp() } : {}) }, { merge: true })
    transaction.set(orderRef, {
      NumeroPedido: next, ClienteId: clientRef.id,
      Cliente: { Nombre: customer.Nombre, Telefono: customer.Telefono, TelefonoWhatsApp: customer.TelefonoWhatsApp },
      FechaPedido: serverTimestamp(), FechaEntrega: Timestamp.fromDate(dateInputToDate(deliveryDate)),
      Estado: 'pendiente', Total: total, TotalPagado: initialAmount, Saldo: Math.round((total - initialAmount) * 100) / 100, Entregado: false,
      FechaEntregaReal: null, PDF: { Generado: false, StoragePath: null },
      WhatsApp: { Enviado: false, FechaEnvio: null, MessageId: null, Error: null },
      CreadoPor: userId, FechaCreacion: serverTimestamp(), FechaActualizacion: serverTimestamp(),
    })
    cleanConcepts.forEach((concept) => transaction.set(doc(collection(orderRef, 'Conceptos')), concept))
    if (initialAmount > 0) transaction.set(doc(collection(orderRef, 'Pagos')), {
      Cantidad: initialAmount, MetodoPago: initialPayment.MetodoPago,
      Observaciones: initialPayment.Observaciones?.trim() || 'Pago inicial', FechaPago: serverTimestamp(),
      UsuarioId: userId, UsuarioNombre: userName || 'Administrador',
    })
    return next
  })

  return { id: orderRef.id, NumeroPedido: orderNumber }
}

export async function listOrders(maxResults = 100) {
  const snapshot = await getDocs(query(collection(db, 'Pedidos'), orderBy('FechaCreacion', 'desc'), limit(maxResults)))
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
}

export async function getOrder(orderId) {
  const orderSnapshot = await getDoc(doc(db, 'Pedidos', orderId))
  if (!orderSnapshot.exists()) throw new Error('El pedido no existe.')
  const conceptsSnapshot = await getDocs(query(collection(db, 'Pedidos', orderId, 'Conceptos'), orderBy('Orden')))
  const paymentsSnapshot = await getDocs(query(collection(db, 'Pedidos', orderId, 'Pagos'), orderBy('FechaPago', 'desc')))
  return { id: orderSnapshot.id, ...orderSnapshot.data(), Conceptos: conceptsSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })), Pagos: paymentsSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })) }
}

export async function updateOrder(orderId, { client, concepts, deliveryDate }) {
  validateOrder({ client, concepts, deliveryDate })
  const cleanConcepts = sanitizeConcepts(concepts)
  const customer = clientData(client)
  const total = Math.round(cleanConcepts.reduce((sum, item) => sum + item.Total, 0) * 100) / 100
  const orderRef = doc(db, 'Pedidos', orderId)
  const current = await getDoc(orderRef)
  if (!current.exists()) throw new Error('El pedido no existe.')
  const totalPaid = Number(current.data().TotalPagado) || 0
  if (total < totalPaid) throw new Error('El total no puede ser menor que lo ya pagado.')
  const oldConcepts = await getDocs(collection(orderRef, 'Conceptos'))
  const clientRef = doc(db, 'Clientes', `tel_${customer.Telefono}`)
  const batch = writeBatch(db)
  const clientSnapshot = await getDoc(clientRef)
  batch.set(clientRef, { ...customer, FechaActualizacion: serverTimestamp(), ...(!clientSnapshot.exists() ? { FechaCreacion: serverTimestamp() } : {}) }, { merge: true })
  batch.update(orderRef, {
    ClienteId: clientRef.id, Cliente: { Nombre: customer.Nombre, Telefono: customer.Telefono, TelefonoWhatsApp: customer.TelefonoWhatsApp },
    FechaEntrega: Timestamp.fromDate(dateInputToDate(deliveryDate)), Total: total, Saldo: total - totalPaid, FechaActualizacion: serverTimestamp(),
  })
  oldConcepts.docs.forEach((item) => batch.delete(item.ref))
  cleanConcepts.forEach((concept) => batch.set(doc(collection(orderRef, 'Conceptos')), concept))
  await batch.commit()
}

export async function finishOrder(orderId) {
  const orderRef = doc(db, 'Pedidos', orderId)
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(orderRef)
    if (!snapshot.exists()) throw new Error('El pedido no existe.')
    if (snapshot.data().Estado === 'entregado') throw new Error('Este pedido ya fue entregado.')
    if (snapshot.data().Estado !== 'pendiente') throw new Error('Solo los pedidos pendientes pueden terminarse.')
    transaction.update(orderRef, {
      Estado: 'entregado', Entregado: true,
      FechaEntregaReal: serverTimestamp(), FechaActualizacion: serverTimestamp(),
    })
  })
}
