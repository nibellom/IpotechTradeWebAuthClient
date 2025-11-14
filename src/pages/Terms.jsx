import { Box, Card, CardContent, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

export default function Terms() {
  const { t } = useTranslation('translation', { keyPrefix: 'terms' })

  return (
    <Box sx={{ display: 'grid', gap: 4, maxWidth: 900, mx: 'auto', my: 4 }}>
      <Card>
        <CardContent>
          <Typography variant="h4" sx={{ mb: 3 }}>
            {t('title')}
          </Typography>

          <Typography
            variant="body1"
            sx={{
              whiteSpace: 'pre-line',
              lineHeight: 1.7,
              opacity: 0.9
            }}
          >
            {t('content')}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}
