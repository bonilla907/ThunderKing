export const ORDER_CATEGORIES = [
  { id: 'en_proceso', label: 'En proceso' },
  { id: 'proximo', label: 'Próximos' },
  { id: 'manana', label: 'Mañana' },
  { id: 'hoy', label: 'Hoy' },
  { id: 'atrasado', label: 'Atrasados' },
]

function startOfLocalDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function getOrderTiming(order, now = new Date()) {
  if (order?.Estado !== 'pendiente') return { category: null, days: null, label: 'Sin clasificación' }
  const delivery = order.FechaEntrega?.toDate?.() ?? new Date(order.FechaEntrega)
  if (Number.isNaN(delivery.getTime())) return { category: null, days: null, label: 'Sin fecha válida' }
  const difference = Math.round((startOfLocalDay(delivery) - startOfLocalDay(now)) / 86400000)
  let category = 'en_proceso'
  if (difference < 0) category = 'atrasado'
  else if (difference === 0) category = 'hoy'
  else if (difference === 1) category = 'manana'
  else if (difference <= 3) category = 'proximo'
  return { category, days: difference, label: ORDER_CATEGORIES.find((item) => item.id === category)?.label }
}

export function getTimingMessage(timing) {
  if (timing.days === null) return timing.label
  if (timing.days < 0) return `${Math.abs(timing.days)} día${Math.abs(timing.days) === 1 ? '' : 's'} de atraso`
  if (timing.days === 0) return 'Entrega hoy'
  if (timing.days === 1) return 'Entrega mañana'
  return `Faltan ${timing.days} días`
}
