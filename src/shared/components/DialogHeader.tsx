import { Box, IconButton, Typography } from '@mui/material';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import type { ReactNode } from 'react';

export type DialogHeaderColor = 'primary' | 'warning' | 'error' | 'info';

interface DialogHeaderProps {
  icon: ReactNode;
  title: string;
  description?: string;
  color?: DialogHeaderColor;
  onClose?: () => void;
}

const badgeColor: Record<DialogHeaderColor, string> = {
  primary: '#004A98',
  warning: '#F39200',
  error: '#D32F2F',
  info: '#0083C1',
};

/**
 * Encabezado consistente para todos los diálogos de la app: ícono en
 * badge de color, título, descripción opcional y botón de cerrar.
 * Se reutiliza en ConfirmDialog, UserFormDialog y ChangePasswordDialog
 * (3+ usos), por eso vive en shared/ y no en features/users/.
 */
export function DialogHeader({
  icon,
  title,
  description,
  color = 'primary',
  onClose,
}: DialogHeaderProps) {
  const accent = badgeColor[color];

  return (
    <Box sx={{ position: 'relative', px: 4, pt: 4, pb: description ? 1 : 2.5 }}>
      {onClose && (
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ position: 'absolute', top: 16, right: 16, color: 'text.secondary' }}
        >
          <CloseOutlinedIcon fontSize="small" />
        </IconButton>
      )}

      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: `${accent}1A`,
          color: accent,
          mb: 1.5,
        }}
      >
        {icon}
      </Box>

      <Typography variant="h6">{title}</Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {description}
        </Typography>
      )}
    </Box>
  );
}

/** Paper compartido de todos los diálogos: más redondeado y con sombra más suave que el default de MUI. */
export const dialogPaperSx = {
  borderRadius: '20px',
  boxShadow: '0px 20px 60px rgba(0,0,0,0.16)',
};
