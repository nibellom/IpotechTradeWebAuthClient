import { Box } from '@mui/material'

export default function LandingShell() {
  // You can either iframe an external landing or serve static files from /public/landing
  const external = import.meta.env.VITE_LANDING_IFRAME_SRC
  const src = external || '/landing/index.html'
  return (
    <Box sx={{ height: '75vh', borderRadius: 2, overflow: 'hidden', border: '1px solid #22262b' }}>
      <iframe title="landing" src={src} style={{ width:'100%', height:'100%', border:'none' }} />
    </Box>
  )
}
