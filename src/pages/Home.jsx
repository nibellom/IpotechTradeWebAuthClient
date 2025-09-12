import { Grid } from '@mui/material'
import LandingContent from '../components/LandingContent.jsx'
import Dashboard from '../components/Dashboard.jsx'
import ConnectKeysForm from '../components/ConnectKeysForm.jsx'

export default function Home({ me }) {
  const connected = Boolean(me?.status?.connected)

  // Если счёт НЕ подключён — показываем только лендинг,
  // без дублирования формы и кабинета.
  if (!connected) {
    return (
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <LandingContent />
        </Grid>
      </Grid>
    )
  }

  // Если счёт подключён — показываем кабинет + форму обновления ключей.
  return (
    <Grid container spacing={1}>
      <Grid item xs={12} md={12}>
        <Dashboard me={me} />
      </Grid>
      {/* <Grid item xs={12} md={6}>
        <ConnectKeysForm me={me} onSaved={() => window.location.reload()} />
      </Grid> */}
    </Grid>
  )
}
