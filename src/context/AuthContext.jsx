import { useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db, isFirebaseConfigured } from '../firebase/firebaseConfig'
import { AuthContext } from './auth-context'

async function getUserProfile(firebaseUser) {
  const snapshot = await getDoc(doc(db, 'Usuarios', firebaseUser.uid))
  if (!snapshot.exists()) throw new Error('Tu cuenta no tiene un perfil en la colección Usuarios.')
  const profile = snapshot.data()
  if (profile.Activo !== true) throw new Error('Tu cuenta se encuentra desactivada.')
  if (profile.Rol !== 'Administrador') throw new Error('Tu cuenta no tiene permisos de administrador.')
  return { id: snapshot.id, ...profile }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(isFirebaseConfigured)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    if (!auth) return undefined
    return onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true)
      setAuthError('')
      if (!firebaseUser) {
        setUser(null); setProfile(null); setLoading(false); return
      }
      try {
        setProfile(await getUserProfile(firebaseUser))
        setUser(firebaseUser)
      } catch (error) {
        setAuthError(error.message)
        setUser(null); setProfile(null)
        await signOut(auth)
      } finally { setLoading(false) }
    })
  }, [])

  const login = async (email, password) => {
    if (!auth) throw new Error('Firebase no está configurado. Revisa el archivo .env.local.')
    setAuthError('')
    return (await signInWithEmailAndPassword(auth, email, password)).user
  }
  const logout = async () => { if (auth) await signOut(auth) }
  const value = useMemo(() => ({ user, profile, loading, authError, login, logout }), [user, profile, loading, authError])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
