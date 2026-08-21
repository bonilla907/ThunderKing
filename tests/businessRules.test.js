import test from 'node:test'
import assert from 'node:assert/strict'
import { cleanPhone, normalizePhoneForWhatsApp } from '../src/utils/phone.js'
import { getOrderTiming } from '../src/utils/orderCategories.js'

test('normaliza teléfonos mexicanos sin duplicar el prefijo', () => {
  assert.equal(cleanPhone('(735) 123-4567'), '7351234567')
  assert.equal(normalizePhoneForWhatsApp('7351234567'), '527351234567')
  assert.equal(normalizePhoneForWhatsApp('52 735 123 4567'), '527351234567')
  assert.equal(normalizePhoneForWhatsApp('123'), '')
})

test('clasifica pedidos usando días locales completos', () => {
  const now = new Date(2026, 7, 20, 18, 30)
  const orderAt = (day) => ({ Estado: 'pendiente', FechaEntrega: new Date(2026, 7, day, 12) })
  assert.equal(getOrderTiming(orderAt(19), now).category, 'atrasado')
  assert.equal(getOrderTiming(orderAt(20), now).category, 'hoy')
  assert.equal(getOrderTiming(orderAt(21), now).category, 'manana')
  assert.equal(getOrderTiming(orderAt(23), now).category, 'proximo')
  assert.equal(getOrderTiming(orderAt(24), now).category, 'en_proceso')
})

test('no clasifica como pendientes los pedidos entregados', () => {
  assert.equal(getOrderTiming({ Estado: 'entregado', FechaEntrega: new Date() }).category, null)
})
