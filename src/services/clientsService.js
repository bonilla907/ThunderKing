import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase/firebaseConfig'

export async function listClients(maxResults = 200) {
  const snapshot = await getDocs(query(collection(db, 'Clientes'), orderBy('Nombre'), limit(maxResults)))
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
}
