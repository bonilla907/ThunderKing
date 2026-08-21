import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase/firebaseConfig'

export async function generateSalesNote(orderId) {
  const callable = httpsCallable(functions, 'generarNotaVenta')
  return (await callable({ pedidoId: orderId })).data
}

export async function getSalesNoteUrl(orderId, download = false) {
  const callable = httpsCallable(functions, 'obtenerNotaVentaUrl')
  return (await callable({ pedidoId: orderId, download })).data
}
