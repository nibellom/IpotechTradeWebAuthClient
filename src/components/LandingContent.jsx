import { Box, Typography, Grid, Card, CardContent, Stack, Button } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import PublicYieldChart from '../components/PublicYieldChart'

export default function LandingContent() {
  const { t } = useTranslation('translation', { keyPrefix: 'landing' })

  return (
    <Box sx={{ display:'grid', gap:4 }}>
      {/* HERO */}
      <Card>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h3" sx={{ mb: 1 }}>{t('hero.title')}</Typography>
              <Typography variant="body1" sx={{ opacity:.85, mb: 2 }}>
                {t('hero.subtitle')}
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button variant="contained" component={Link} to="/settings">
                  {t('hero.ctaConnect')}
                </Button>
                <Button
                  variant="outlined"
                  component={Link}
                  to="/more"
                  target="_blank"
                  rel="noopener"
                >
                  {t('hero.ctaMore')}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <PublicYieldChart />
        </CardContent>
      </Card>

      {/* BENEFITS */}
      <Grid container spacing={2} alignItems="stretch">
        {['benefit1','benefit2','benefit3'].map((k) => (
          <Grid item xs={12} md={4} key={k} sx={{ display: 'flex' }}>
            <Card sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1, flexGrow: 1 }}>
                <Typography variant="h6">
                  {t(`benefits.${k}.title`)}
                </Typography>
                <Typography variant="body2" sx={{ opacity:.8 }}>
                  {t(`benefits.${k}.desc`)}
                </Typography>
                {/* если добавишь кнопку/ссылку, она прижмётся вниз: */}
                {/* <Box sx={{ mt: 'auto' }}><Button size="small">Подробнее</Button></Box> */}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* HOW IT WORKS */}
      <Card>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 2 }}>{t('hiw.title')}</Typography>
          <Grid container spacing={2} alignItems="stretch">
            {[1,2,3,4].map((i)=> (
              <Grid item xs={12} md={3} key={i} sx={{ display: 'flex' }}>
                <Card variant="outlined" sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1, flexGrow: 1 }}>
                    <Typography variant="subtitle2" sx={{ opacity:.7 }}>
                      {t(`hiw.step${i}.label`)}
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 'auto' }}>
                      {t(`hiw.step${i}.text`)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* NOTE */}
      <Card>
        <CardContent>
          <Typography variant="subtitle2" sx={{ opacity:.8, mb: 1 }}>
            {t('note')}
          </Typography>
          <Button
            variant="outlined"
            href="https://t.me/ipotechTrade"
            target="_blank"
            rel="noopener"
          >
            Telegram
          </Button>
        </CardContent>
      </Card>
    </Box>
  )
}
