import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase/firebaseConfig'

export async function sendSalesNoteWhatsApp(orderId) {
  const callable = httpsCallable(functions, 'enviarNotaVentaWhatsApp')
  return (await callable({ pedidoId: orderId })).data
}
