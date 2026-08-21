import { useEffect, useState } from 'react'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { Building2, Save } from 'lucide-react'
import { db } from '../../firebase/firebaseConfig'

const initialValues = { Nombre: '', Telefono: '', Direccion: '', Facebook: '', Instagram: '', MensajeNota: '', Moneda: 'MXN', LogoPath: '' }

export function CompanySettingsPage() {
  const [form, setForm] = useState(initialValues)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    let active = true
    async function loadCompany() {
      try {
        const snapshot = await getDoc(doc(db, 'Configuracion', 'Empresa'))
        if (active && snapshot.exists()) setForm((current) => ({ ...current, ...snapshot.data() }))
      } catch { if (active) setMessage({ type: 'error', text: 'No fue posible cargar la configuración.' }) }
      finally { if (active) setLoading(false) }
    }
    loadCompany()
    return () => { active = false }
  }, [])

  const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  const handleSubmit = async (event) => {
    event.preventDefault()
    if (saving) return
    setSaving(true); setMessage(null)
    try {
      await setDoc(doc(db, 'Configuracion', 'Empresa'), { ...form, FechaActualizacion: serverTimestamp() }, { merge: true })
      setMessage({ type: 'success', text: 'La configuración se guardó correctamente.' })
    } catch { setMessage({ type: 'error', text: 'No fue posible guardar. Revisa tus permisos de Firestore.' }) }
    finally { setSaving(false) }
  }

  return <div className="page-stack"><header className="page-header"><span className="eyebrow">Datos generales</span><h1>Configuración</h1><p>Centraliza la información que utilizarán los documentos y módulos futuros.</p></header>
    <form className="settings-card" onSubmit={handleSubmit}>
      <div className="settings-card__title"><span><Building2 size={23} /></span><div><h2>Información de la empresa</h2><p>Completa únicamente los datos reales de ThunderKing.</p></div></div>
      {message && <div className={`alert alert--${message.type}`} role="status">{message.text}</div>}
      {loading ? <div className="inline-loader"><span className="spinner" />Cargando configuración...</div> : <div className="form-grid">
        <label className="field"><span>Nombre de la empresa</span><input name="Nombre" value={form.Nombre} onChange={updateField} placeholder="Nombre comercial" /></label>
        <label className="field"><span>Teléfono</span><input name="Telefono" value={form.Telefono} onChange={updateField} placeholder="Teléfono de contacto" inputMode="tel" /></label>
        <label className="field field--full"><span>Dirección</span><input name="Direccion" value={form.Direccion} onChange={updateField} placeholder="Dirección de la empresa" /></label>
        <label className="field"><span>Facebook</span><input name="Facebook" value={form.Facebook} onChange={updateField} placeholder="Perfil o página" /></label>
        <label className="field"><span>Instagram</span><input name="Instagram" value={form.Instagram} onChange={updateField} placeholder="Usuario de Instagram" /></label>
        <label className="field field--full"><span>Mensaje para nota</span><textarea name="MensajeNota" value={form.MensajeNota} onChange={updateField} placeholder="Mensaje de agradecimiento o condiciones" rows="4" /></label>
        <label className="field"><span>Moneda</span><input name="Moneda" value={form.Moneda} readOnly /></label>
        <div className="field"><span>Logo</span><div className="logo-placeholder">Logo Thunder King configurado en <code>src/assets/logo/</code></div></div>
      </div>}
      <div className="form-actions"><button className="primary-button primary-button--inline" type="submit" disabled={loading || saving}>{saving ? <><span className="spinner spinner--button" />Guardando...</> : <><Save size={18} />Guardar configuración</>}</button></div>
    </form></div>
}
