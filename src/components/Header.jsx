import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Tooltip
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { Link, Link as RouterLink, useNavigate } from 'react-router-dom'
import { setToken } from '../api'
import MenuIcon from '@mui/icons-material/Menu'
import TranslateIcon from '@mui/icons-material/Translate'
import logo from '../assets/brand/itrade-logo.png';

export default function Header({ authed, me, onLogout }) {
  const { i18n, t } = useTranslation()
  const [langAnchor, setLangAnchor] = useState(null) // меню языков (общая кнопка)
  const [navAnchor, setNavAnchor] = useState(null)   // мобильный бургер
  const navigate = useNavigate()

  const changeLang = (lng) => {
    i18n.changeLanguage(lng)
    setLangAnchor(null)
  }

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout()
    } else {
      localStorage.removeItem('token')
      setToken(null)
      window.dispatchEvent(new Event('auth:logout'))
    }
    navigate('/signin', { replace: true })
  }

  return (
    <AppBar
      position="sticky"
      color="transparent"
      elevation={0}
      sx={{ borderBottom: '1px solid #22262b', backdropFilter: 'blur(4px)' }}
    >
      <Toolbar sx={{ display: 'flex', gap: 2 }}>
      <Typography
        variant="h6"
        component={RouterLink}
        to="/"
        sx={{
          flexGrow: 1,
          cursor: 'pointer',
          textDecoration: 'none',
          color: 'inherit',
          display: 'flex',
          alignItems: 'center',
          gap: 1.25
        }}
      >
        <Box component="img" src={logo} alt="iTrade" sx={{ height: 28, display: 'block' }} />
      </Typography>

        {/* ДЕСКТОП (md+) */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
          {authed && (
            <>
              <Button color="inherit" component={Link} to="/">
                {t('nav.home')}
              </Button>

              {/* НОВЫЙ ПУНКТ: РЕФЕРАЛЫ */}
              {/* <Button
                color="inherit"
                component={RouterLink}
                to="/referrals"
                startIcon={<PeopleIcon />}
              >
                {t('nav.referrals')}
              </Button> */}

              {/* <Button color="inherit" component={Link} to="/dashboard">{t('nav.dashboard')}</Button> */}
              <Button color="inherit" component={Link} to="/settings">
                {t('nav.settings')}
              </Button>

              {/* РЕФЕРАЛЬНАЯ СИСТЕМА */}
              <Button color="inherit" component={RouterLink} to="/referrals">
                {t('nav.referralsFull')}
              </Button>
            </>
          )}

          {!authed ? (
            <Button color="primary" variant="contained" component={Link} to="/signin">
              {t('auth.signIn')}
            </Button>
          ) : (
            <Button color="inherit" variant="outlined" onClick={handleLogoutClick}>
              {t('auth.signOut')}
            </Button>
          )}

          {/* Кнопка выбора языка (общая) */}
          <Tooltip title={t('nav.lang')}>
            <IconButton color="inherit" aria-label="language" onClick={(e) => setLangAnchor(e.currentTarget)}>
              <TranslateIcon />
            </IconButton>
          </Tooltip>
          <Menu anchorEl={langAnchor} open={Boolean(langAnchor)} onClose={() => setLangAnchor(null)}>
            <MenuItem onClick={() => changeLang('ru')}>Русский</MenuItem>
            <MenuItem onClick={() => changeLang('en')}>English</MenuItem>
          </Menu>
        </Box>

        {/* МОБИЛЬНАЯ ВЕРСИЯ (xs/sm) */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1 }}>
          {/* Бургер — ТОЛЬКО навигация и вход/выход (без языков) */}
          <IconButton color="inherit" aria-label="menu" onClick={(e) => setNavAnchor(e.currentTarget)}>
            <MenuIcon />
          </IconButton>
          <Menu anchorEl={navAnchor} open={Boolean(navAnchor)} onClose={() => setNavAnchor(null)}>
            {authed && (
              <>
                <MenuItem component={Link} to="/" onClick={() => setNavAnchor(null)}>
                  {t('nav.home')}
                </MenuItem>

                {/* РЕФЕРАЛЫ В МОБИЛЬНОМ МЕНЮ */}
                {/* <MenuItem
                  component={RouterLink}
                  to="/referrals"
                  onClick={() => setNavAnchor(null)}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <PeopleIcon fontSize="small" />
                  {t('nav.referrals')}
                </MenuItem> */}

                {/* <MenuItem component={Link} to="/dashboard" onClick={() => setNavAnchor(null)}>
                  {t('nav.dashboard')}
                </MenuItem> */}
                <MenuItem component={Link} to="/settings" onClick={() => setNavAnchor(null)}>
                  {t('nav.settings')}
                </MenuItem>

                {/* РЕФЕРАЛЬНАЯ СИСТЕМА — ТОЛЬКО ТЕКСТ */}
                <MenuItem
                  component={RouterLink}
                  to="/referrals"
                  onClick={() => setNavAnchor(null)}
                >
                  {t('nav.referralsFull')}
                </MenuItem>
              </>
            )}
            {!authed ? (
              <MenuItem component={Link} to="/signin" onClick={() => setNavAnchor(null)}>
                {t('auth.signIn')}
              </MenuItem>
            ) : (
              <MenuItem
                onClick={() => {
                  setNavAnchor(null)
                  handleLogoutClick()
                }}
              >
                {t('auth.signOut')}
              </MenuItem>
            )}
          </Menu>

          {/* Отдельная кнопка языка — остаётся и на мобилке */}
          <IconButton color="inherit" aria-label="language" onClick={(e) => setLangAnchor(e.currentTarget)}>
            <TranslateIcon />
          </IconButton>
          <Menu anchorEl={langAnchor} open={Boolean(langAnchor)} onClose={() => setLangAnchor(null)}>
            <MenuItem onClick={() => changeLang('ru')}>Русский</MenuItem>
            <MenuItem onClick={() => changeLang('en')}>English</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  )
}
