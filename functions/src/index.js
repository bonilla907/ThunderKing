import { unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { setGlobalOptions } from 'firebase-functions/v2'
import { generateSalesNotePdf } from './pdf/generateSalesNote.js'

setGlobalOptions({ region: 'us-central1', maxInstances: 10 })
const app = initializeApp()
const db = getFirestore(app, 'thunder')
const bucket = getStorage(app).bucket('thunder-king1.firebasestorage.app')
const localLogo = fileURLToPath(new URL('../assets/thunderking-logo.png', import.meta.url))

async function assertAdmin(auth) {
  if (!auth?.uid) throw new HttpsError('unauthenticated', 'Debes iniciar sesión.')
  const snapshot = await db.collection('Usuarios').doc(auth.uid).get()
  if (!snapshot.exists || snapshot.data().Activo !== true || snapshot.data().Rol !== 'Administrador') throw new HttpsError('permission-denied', 'No tienes permisos para realizar esta operación.')
}

async function loadLogo(company) {
  if (!company.LogoPath) return { path: localLogo, cleanup: false }
  const tempPath = join(tmpdir(), `thunderking-logo-${Date.now()}`)
  try { await bucket.file(company.LogoPath).download({ destination: tempPath }); return { path: tempPath, cleanup: true } }
  catch { return { path: localLogo, cleanup: false } }
}

export const generarNotaVenta = onCall({ timeoutSeconds: 120, memory: '512MiB' }, async (request) => {
  await assertAdmin(request.auth)
  const pedidoId = String(request.data?.pedidoId || '').trim()
  if (!pedidoId) throw new HttpsError('invalid-argument', 'Falta el identificador del pedido.')
  const orderRef = db.collection('Pedidos').doc(pedidoId)
  const [orderSnapshot, conceptsSnapshot, paymentsSnapshot, companySnapshot] = await Promise.all([
    orderRef.get(), orderRef.collection('Conceptos').orderBy('Orden').get(),
    orderRef.collection('Pagos').orderBy('FechaPago', 'desc').get(), db.collection('Configuracion').doc('Empresa').get(),
  ])
  if (!orderSnapshot.exists) throw new HttpsError('not-found', 'El pedido no existe.')
  const order = orderSnapshot.data()
  const company = companySnapshot.exists ? companySnapshot.data() : {}
  const logo = await loadLogo(company)
  try {
    const buffer = await generateSalesNotePdf({ order, company, logoPath: logo.path, concepts: conceptsSnapshot.docs.map((item) => item.data()), payments: paymentsSnapshot.docs.map((item) => item.data()) })
    const storagePath = `pedidos/${pedidoId}/nota-venta-${order.NumeroPedido}.pdf`
    await bucket.file(storagePath).save(buffer, { resumable: false, metadata: { contentType: 'application/pdf', cacheControl: 'private, max-age=0, no-store', contentDisposition: `inline; filename="nota-venta-${order.NumeroPedido}.pdf"` } })
    await orderRef.update({ 'PDF.Generado': true, 'PDF.StoragePath': storagePath, 'PDF.FechaGeneracion': FieldValue.serverTimestamp(), FechaActualizacion: FieldValue.serverTimestamp() })
    return { storagePath, fileName: `nota-venta-${order.NumeroPedido}.pdf` }
  } catch (error) {
    console.error('Error generando nota', { pedidoId, message: error.message })
    throw new HttpsError('internal', 'No fue posible generar la nota de venta.')
  } finally { if (logo.cleanup) await unlink(logo.path).catch(() => undefined) }
})

export const obtenerNotaVentaUrl = onCall(async (request) => {
  await assertAdmin(request.auth)
  const pedidoId = String(request.data?.pedidoId || '').trim()
  if (!pedidoId) throw new HttpsError('invalid-argument', 'Falta el identificador del pedido.')
  const snapshot = await db.collection('Pedidos').doc(pedidoId).get()
  if (!snapshot.exists) throw new HttpsError('not-found', 'El pedido no existe.')
  const order = snapshot.data()
  if (!order.PDF?.Generado || !order.PDF?.StoragePath) throw new HttpsError('failed-precondition', 'La nota todavía no ha sido generada.')
  const disposition = request.data?.download ? 'attachment' : 'inline'
  const [url] = await bucket.file(order.PDF.StoragePath).getSignedUrl({ action: 'read', expires: Date.now() + 10 * 60 * 1000, responseDisposition: `${disposition}; filename="nota-venta-${order.NumeroPedido}.pdf"` })
  return { url, expiresInSeconds: 600 }
})
