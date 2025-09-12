import { Navigate, useLocation } from 'react-router-dom'

export default function RequireAuth({ me, children }) {
  // "Авторизован" = мы смогли получить объект me (по JWT или initData)
  const isAuthed = Boolean(me && Object.keys(me).length > 0)
  const location = useLocation()

  if (!isAuthed) {
    // запомним, куда хотели пройти (на случай возврата)
    const to = '/signin'
    return <Navigate to={to} replace state={{ from: location }} />
  }
  return children
}
