import { collection, count, getAggregateFromServer, query, sum, Timestamp, where } from 'firebase/firestore'
import { db } from '../firebase/firebaseConfig'

function localDay(offset = 0) {
  const value = new Date()
  value.setHours(0, 0, 0, 0)
  value.setDate(value.getDate() + offset)
  return Timestamp.fromDate(value)
}

async function aggregate(constraints, fields = { total: count() }) {
  const snapshot = await getAggregateFromServer(query(collection(db, 'Pedidos'), ...constraints), fields)
  return snapshot.data()
}

export async function getDashboardSummary() {
  const today = localDay(0)
  const tomorrow = localDay(1)
  const dayAfterTomorrow = localDay(2)
  const fourthDay = localDay(4)
  const pending = where('Estado', '==', 'pendiente')

  const [inProcess, upcoming, tomorrowCount, todayCount, overdue, delivered, pendingBalance, deliveredBalance] = await Promise.all([
    aggregate([pending, where('FechaEntrega', '>=', fourthDay)]),
    aggregate([pending, where('FechaEntrega', '>=', dayAfterTomorrow), where('FechaEntrega', '<', fourthDay)]),
    aggregate([pending, where('FechaEntrega', '>=', tomorrow), where('FechaEntrega', '<', dayAfterTomorrow)]),
    aggregate([pending, where('FechaEntrega', '>=', today), where('FechaEntrega', '<', tomorrow)]),
    aggregate([pending, where('FechaEntrega', '<', today)]),
    aggregate([where('Estado', '==', 'entregado')]),
    aggregate([where('Estado', '==', 'pendiente'), where('Saldo', '>', 0)], { total: count(), amount: sum('Saldo') }),
    aggregate([where('Estado', '==', 'entregado'), where('Saldo', '>', 0)], { total: count(), amount: sum('Saldo') }),
  ])
  return { en_proceso: inProcess.total, proximo: upcoming.total, manana: tomorrowCount.total, hoy: todayCount.total, atrasado: overdue.total, entregados: delivered.total, con_saldo: pendingBalance.total + deliveredBalance.total, saldo_pendiente: (pendingBalance.amount || 0) + (deliveredBalance.amount || 0) }
}
