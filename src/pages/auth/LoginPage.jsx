import { useState } from 'react'
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Brand } from '../../components/ui/Brand'
import { useAuth } from '../../hooks/useAuth'
import { isFirebaseConfigured } from '../../firebase/firebaseConfig'

const authMessages = {
  'auth/invalid-credential': 'El correo o la contraseña son incorrectos.',
  'auth/too-many-requests': 'Demasiados intentos. Espera un momento e inténtalo nuevamente.',
  'auth/network-request-failed': 'No fue posible conectar con Firebase. Revisa tu conexión.',
  'auth/invalid-email': 'Escribe un correo electrónico válido.',
}

export function LoginPage() {
  const { login, authError } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (submitting) return
    setError(''); setSubmitting(true)
    try {
      await login(email.trim(), password)
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true })
    } catch (loginError) {
      setError(authMessages[loginError.code] || loginError.message || 'No fue posible iniciar sesión.')
    } finally { setSubmitting(false) }
  }

  return (
    <main className="login-page">
      <section className="login-visual" aria-label="ThunderKing">
        <div className="login-visual__glow" /><Brand />
        <div className="login-visual__content"><span className="eyebrow">Tu operación, en orden</span><h1>Controla cada pedido desde un solo lugar.</h1><p>Una base clara y profesional para acompañar el trabajo de tu taller.</p></div>
        <span className="login-visual__footer">Serigrafía · Bordado · Impresión</span>
      </section>
      <section className="login-panel">
        <form className="login-card" onSubmit={handleSubmit}>
          <div className="login-card__mobile-brand"><Brand /></div>
          <div className="login-card__heading"><span className="eyebrow">Bienvenido</span><h2>Inicia sesión</h2><p>Ingresa con tu cuenta de administrador.</p></div>
          {!isFirebaseConfigured && <div className="alert alert--warning">Falta configurar Firebase en <code>.env.local</code>.</div>}
          {(error || authError) && <div className="alert alert--error" role="alert">{error || authError}</div>}
          <label className="field"><span>Correo electrónico</span><div className="input-with-icon"><Mail size={19} /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@empresa.com" autoComplete="email" required /></div></label>
          <label className="field"><span>Contraseña</span><div className="input-with-icon"><LockKeyhole size={19} /><input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Tu contraseña" autoComplete="current-password" minLength={6} required /><button type="button" className="password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button></div></label>
          <button className="primary-button" type="submit" disabled={submitting || !isFirebaseConfigured}>{submitting ? <><span className="spinner spinner--button" />Ingresando...</> : 'Ingresar al sistema'}</button>
          <p className="login-card__help">El administrador se gestiona desde Firebase Authentication.</p>
        </form>
      </section>
    </main>
  )
}
