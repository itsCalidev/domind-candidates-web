import { Avatar, Box, Breadcrumbs, ButtonBase, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import { useLocation, useNavigate } from 'react-router-dom';
import { navItems } from './navItems';
import { useLayout } from './LayoutContext';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useAccessibility } from '@/shared/context/AccessibilityContext';
import { paths } from '@/routes/paths';

export const HEADER_HEIGHT = 72;

export function Header() {
  const { setMobileSidebarOpen } = useLayout();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { darkMode, toggleDarkMode } = useAccessibility();

  const activeItem = navItems.find((item) => location.pathname.startsWith(item.path));

  return (
    <Box
      component="header"
      sx={{
        height: HEADER_HEIGHT,
        px: { xs: 2, md: 3 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        gap: 2,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}>
        <IconButton
          onClick={() => setMobileSidebarOpen(true)}
          aria-label="Abrir menú de navegación"
          sx={{ display: { xs: 'inline-flex', md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ minWidth: 0 }}>
          <Breadcrumbs sx={{ fontSize: 13 }}>
            <Typography variant="caption" color="text.secondary">
              Panel administrativo
            </Typography>
            {activeItem && (
              <Typography variant="caption" color="text.primary" fontWeight={600}>
                {activeItem.label}
              </Typography>
            )}
          </Breadcrumbs>
          <Typography variant="h6" noWrap sx={{ mt: 0.25 }}>
            {activeItem?.label ?? 'Panel administrativo'}
          </Typography>
        </Box>
      </Stack>

      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Tooltip title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}>
          <IconButton onClick={toggleDarkMode} aria-label={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}>
            {darkMode ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
          </IconButton>
        </Tooltip>

        <ButtonBase
          onClick={() => navigate(paths.profile)}
          sx={{
            borderRadius: 2,
            px: 1,
            py: 0.5,
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 38, height: 38, fontSize: 14 }}>
              {user?.email.slice(0, 2).toUpperCase()}
            </Avatar>
            <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'left' }}>
              <Typography variant="body2" fontWeight={600} lineHeight={1.2} noWrap sx={{ maxWidth: 180 }}>
                {user?.email}
              </Typography>
              {/* Rol sin traducir: mismo valor exacto que expone el backend */}
              <Typography variant="caption" color="text.secondary">
                {user?.role}
              </Typography>
            </Box>
          </Stack>
        </ButtonBase>
      </Stack>
    </Box>
  );
}
