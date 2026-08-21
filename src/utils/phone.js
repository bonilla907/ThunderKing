export function cleanPhone(value = '') {
  return value.replace(/\D/g, '').replace(/^52(?=\d{10}$)/, '').slice(0, 10)
}

export function normalizePhoneForWhatsApp(value = '') {
  const phone = cleanPhone(value)
  return phone.length === 10 ? `52${phone}` : ''
}

export function formatPhone(value = '') {
  const phone = cleanPhone(value)
  if (phone.length !== 10) return value
  return `${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}`
}
