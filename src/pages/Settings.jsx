import { Grid } from '@mui/material'
import ConnectKeysForm from '../components/ConnectKeysForm.jsx'

export default function Settings({ me }) {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={8}>
        <ConnectKeysForm me={me} onSaved={() => window.location.reload()} />
      </Grid>
    </Grid>
  )
}
