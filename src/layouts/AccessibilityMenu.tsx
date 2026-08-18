import { useState, type MouseEvent } from 'react';
import {
  Button,
  Divider,
  FormControlLabel,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Popover,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from '@mui/material';
import AccessibleOutlinedIcon from '@mui/icons-material/AccessibleOutlined';
import { useAccessibility } from '@/shared/context/AccessibilityContext';

interface AccessibilityMenuProps {
  /** Mismo criterio visual que cada NavItem del Sidebar: icono solo vs. icono + etiqueta. */
  isSidebarCollapsed: boolean;
}

/**
 * Reemplaza al antiguo ítem "Configuración" del Sidebar, que navegaba a
 * una ruta (/settings) sin página registrada en AppRouter — un enlace
 * muerto. En su lugar, este botón abre un Popover con controles de
 * accesibilidad; no navega a ningún lado.
 */
export function AccessibilityMenu({ isSidebarCollapsed }: AccessibilityMenuProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const {
    fontSize,
    highContrast,
    canIncreaseFontSize,
    canDecreaseFontSize,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    toggleHighContrast,
    resetAll,
  } = useAccessibility();

  function openMenu(event: MouseEvent<HTMLElement>) {
    setAnchorEl(event.currentTarget);
  }

  function closeMenu() {
    setAnchorEl(null);
  }

  const trigger = (
    <ListItemButton
      onClick={openMenu}
      sx={{
        borderRadius: 2,
        mb: 0.5,
        justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
        px: isSidebarCollapsed ? 1.5 : 2,
        '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
      }}
    >
      <ListItemIcon
        sx={{
          minWidth: 0,
          mr: isSidebarCollapsed ? 0 : 1.5,
          color: 'rgba(255,255,255,0.7)',
          justifyContent: 'center',
        }}
      >
        <AccessibleOutlinedIcon fontSize="small" />
      </ListItemIcon>
      {!isSidebarCollapsed && (
        <ListItemText primary="Accesibilidad" slotProps={{ primary: { fontSize: 14 } }} />
      )}
    </ListItemButton>
  );

  return (
    <>
      {isSidebarCollapsed ? (
        <Tooltip title="Accesibilidad" placement="right">
          {trigger}
        </Tooltip>
      ) : (
        trigger
      )}

      <Popover
        open={!!anchorEl}
        anchorEl={anchorEl}
        onClose={closeMenu}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{ paper: { sx: { borderRadius: 3, p: 2.5, width: 260 } } }}
      >
        <Typography variant="subtitle2" sx={{ mb: 2 }}>
          Accesibilidad
        </Typography>

        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Tamaño de texto
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {fontSize}px
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ mb: 2.5 }}>
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            onClick={decreaseFontSize}
            disabled={!canDecreaseFontSize}
            aria-label="Reducir tamaño de texto"
            sx={{ minWidth: 44 }}
          >
            A-
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            onClick={resetFontSize}
            aria-label="Restablecer tamaño de texto"
            sx={{ minWidth: 44 }}
          >
            A
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            onClick={increaseFontSize}
            disabled={!canIncreaseFontSize}
            aria-label="Aumentar tamaño de texto"
            sx={{ minWidth: 44 }}
          >
            A+
          </Button>
        </Stack>

        <Divider sx={{ mb: 1.5 }} />

        <FormControlLabel
          control={<Switch checked={highContrast} onChange={toggleHighContrast} />}
          label={<Typography variant="body2">Alto contraste</Typography>}
          sx={{ ml: 0, mb: 2 }}
        />

        <Divider sx={{ mb: 1.5 }} />

        <Button
          size="small"
          variant="text"
          color="inherit"
          fullWidth
          onClick={resetAll}
          aria-label="Restablecer preferencias de accesibilidad a los valores de fábrica"
        >
          Restablecer preferencias
        </Button>
      </Popover>
    </>
  );
}
