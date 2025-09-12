import { Box, Grid, Card, CardContent, Typography, List, ListItem, ListItemText, Divider, Alert } from '@mui/material'
import { useTranslation } from 'react-i18next'

export default function More() {
  const { t } = useTranslation('translation', { keyPrefix: 'more' })

  return (
    <Box sx={{ display:'grid', gap:3, pb:6 }}>
      {/* HERO */}
      <Card>
        <CardContent>
          <Typography variant="h3" sx={{ mb: 1 }}>{t('hero.title')}</Typography>
          <Typography variant="body1" sx={{ opacity:.9 }}>{t('hero.subtitle')}</Typography>
        </CardContent>
      </Card>

      {/* HOW IT WORKS */}
      <Card>
        <CardContent>
          <Typography variant="h5" sx={{ mb:2 }}>{t('hiw.title')}</Typography>
          <Grid container spacing={2}>
            {[1,2,3,4].map((i)=>(
              <Grid key={i} item xs={12} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ opacity:.7, mb: .5 }}>{t(`hiw.step${i}.label`)}</Typography>
                    <Typography variant="body2">{t(`hiw.step${i}.text`)}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* BENEFITS */}
      <Card>
        <CardContent>
          <Typography variant="h5" sx={{ mb:2 }}>{t('benefits.title')}</Typography>
          <Grid container spacing={2}>
            {['b1','b2','b3','b4'].map(k=>(
              <Grid key={k} item xs={12} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ mb: .5 }}>{t(`benefits.${k}.title`)}</Typography>
                    <Typography variant="body2" sx={{ opacity:.85 }}>{t(`benefits.${k}.text`)}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* SECURITY */}
      <Card>
        <CardContent>
          <Typography variant="h5" sx={{ mb:2 }}>{t('security.title')}</Typography>
          <List dense>
            {['s1','s2','s3','s4'].map(k=>(
              <ListItem key={k} disableGutters>
                <ListItemText
                  primaryTypographyProps={{ variant:'subtitle2' }}
                  primary={t(`security.${k}.title`)}
                  secondary={t(`security.${k}.text`)}
                />
              </ListItem>
            ))}
          </List>
          <Alert severity="info" sx={{ mt:2 }}>{t('security.note')}</Alert>
        </CardContent>
      </Card>

      {/* DEPOSIT & FEES */}
      <Card>
        <CardContent>
          <Typography variant="h5" sx={{ mb:2 }}>{t('fees.title')}</Typography>
          <Typography variant="body2" sx={{ mb: 1.5 }}>{t('fees.p1')}</Typography>
          <Typography variant="body2" sx={{ mb: 1.5 }}>{t('fees.p2')}</Typography>
          <Typography variant="body2">{t('fees.p3')}</Typography>
        </CardContent>
      </Card>

      {/* REFERRAL */}
      <Card>
        <CardContent>
          <Typography variant="h5" sx={{ mb:2 }}>{t('ref.title')}</Typography>
          <Typography variant="body2">{t('ref.text')}</Typography>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardContent>
          <Typography variant="h5" sx={{ mb:2 }}>{t('faq.title')}</Typography>
          <List>
            {['q1','q2','q3','q4','q5'].map(k=>(
              <Box key={k}>
                <Typography variant="subtitle1">{t(`faq.${k}.q`)}</Typography>
                <Typography variant="body2" sx={{ opacity:.9, mb:1.5 }}>{t(`faq.${k}.a`)}</Typography>
                <Divider sx={{ my:1 }} />
              </Box>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* CONTACTS */}
      <Card>
        <CardContent>
          <Typography variant="h5" sx={{ mb:1 }}>{t('contacts.title')}</Typography>
          <Typography variant="body2">{t('contacts.text')}</Typography>
        </CardContent>
      </Card>
    </Box>
  )
}
