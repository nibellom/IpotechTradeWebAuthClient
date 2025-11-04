// src/pages/Referrals.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
  Grid,
  Input,
  InputAdornment,
  IconButton,
  useTheme,
  CircularProgress
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import api from '../api';

const Referrals = () => {
  const { t } = useTranslation();
  const theme = useTheme();

  const [data, setData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- UID Bybit ---
  const [bybitUID, setBybitUID] = useState('');
  const [uidError, setUidError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Загрузка данных
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/users/referrals');
        setData(res.data);
        setBybitUID(res.data.bybitUID || '');
      } catch (err) {
        console.error('[Referrals] fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Валидация UID
  useEffect(() => {
    if (!bybitUID) {
      setUidError('');
      return;
    }
    if (!/^\d{6,20}$/.test(bybitUID)) {
      setUidError(t('referrals.bybitUID.error'));
    } else {
      setUidError('');
    }
  }, [bybitUID, t]);

  // Сохранение UID
  const handleSaveUID = async () => {
    if (uidError || !bybitUID) return;

    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await api.patch('/users/bybit-uid', { bybitUID });
      setData(prev => ({ ...prev, bybitUID: res.data.bybitUID }));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Копировать ссылку
  const copyLink = () => {
    if (!data?.refLink) return;
    navigator.clipboard.writeText(data.refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography>{t('loading')}...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'grid', gap: 4, maxWidth: 900, mx: 'auto', p: { xs: 2, md: 3 } }}>
      {/* Заголовок */}
      <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
        {t('referrals.title')}
      </Typography>

      {/* Основная карточка: ссылка + копирование */}
      <Card>
        <CardContent>
          <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
            {t('referrals.description', {
              link: `<span style="color: ${theme.palette.primary.main}; font-weight: 500;">${data.refLink}</span>`,
            })}
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <Input
              fullWidth
              readOnly
              value={data.refLink}
              sx={{
                fontFamily: 'monospace',
                fontSize: '0.95rem',
                '& .MuiInput-input': { py: 1.5 }
              }}
              endAdornment={
                <InputAdornment position="end">
                  <IconButton onClick={copyLink} edge="end" color="primary">
                    {copied ? <CheckIcon /> : <ContentCopyIcon />}
                  </IconButton>
                </InputAdornment>
              }
            />
          </Stack>

          {copied && (
            <Typography variant="caption" color="success.main" sx={{ mt: 1, display: 'block' }}>
              {t('referrals.copied')}
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Статистика: две карточки */}
      <Grid container spacing={3}>
        {/* Приглашено */}
        <Grid item xs={12} sm={6}>
            <Card
                sx={{
                height: '100%',
                bgcolor: 'warning.light',           // Светлый оранжевый (как success.light)
                color: 'warning.contrastText',      // Тёмный текст (чёрный/тёмно-серый)
                _dark: { bgcolor: 'warning.dark' }  // В тёмной теме — чуть темнее
                }}
            >
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Typography
                    variant="h3"
                    component="div"
                    sx={{
                    fontWeight: 700,
                    mb: 1
                    }}
                >
                    {data.referralsCount}
                </Typography>
                <Typography variant="body2">
                    {t('referrals.invited')}
                </Typography>
                </CardContent>
            </Card>
        </Grid>

        {/* Заработано */}
        <Grid item xs={12} sm={6}>
          <Card sx={{ height: '100%', bgcolor: 'success.light', color: 'success.contrastText' }}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h3" component="div" sx={{ fontWeight: 700, mb: 1 }}>
                {data.refProfit} USDT
              </Typography>
              <Typography variant="body2">
                {t('referrals.earned')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Блок: UID Bybit */}
      <Card variant="outlined">
        <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
            {t('referrals.bybitUID.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t('referrals.bybitUID.desc')}
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <Input
                fullWidth
                placeholder={t('referrals.bybitUID.placeholder')}
                value={bybitUID}
                onChange={(e) => setBybitUID(e.target.value)}
                inputProps={{ maxLength: 20 }}
                sx={{ fontFamily: 'monospace' }}
                error={!!uidError}
                helperText={uidError}
            />
            <Button
                variant="contained"
                onClick={handleSaveUID}
                disabled={saving || !bybitUID || !!uidError}
                sx={{ minWidth: 120 }}
            >
                {saving ? <CircularProgress size={20} /> : t('referrals.bybitUID.save')}
            </Button>
            </Stack>

            {saveSuccess && (
            <Typography color="success.main" variant="caption" sx={{ mt: 1, display: 'block' }}>
                {t('referrals.bybitUID.saved')}
            </Typography>
            )}
        </CardContent>
      </Card>

      {/* Дополнительная заметка (как в Landing) */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle2" sx={{ opacity: 0.8, mb: 1 }}>
            {t('referrals.note')}
          </Typography>
          <Button
            variant="text"
            href="https://t.me/IpotechTradeSupport"
            target="_blank"
            rel="noopener"
            sx={{ textTransform: 'none' }}
          >
            @IpotechTradeSupport
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Referrals;