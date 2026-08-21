export function formatCurrency(value) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(value) || 0)
}

export function formatDate(value) {
  const date = value?.toDate?.() ?? (value ? new Date(value) : null)
  if (!date || Number.isNaN(date.getTime())) return 'Sin fecha'
  return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

export function dateInputToDate(value) {
  return new Date(`${value}T12:00:00`)
}

export function timestampToInput(value) {
  const date = value?.toDate?.() ?? new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
