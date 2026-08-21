export function FullPageLoader({ message = 'Cargando...' }) {
  return <main className="full-page-state" aria-live="polite"><span className="spinner" aria-hidden="true" /><p>{message}</p></main>
}
