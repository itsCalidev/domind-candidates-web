import { Button, Dialog, DialogActions, DialogContent, Typography } from '@mui/material';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { DialogHeader, dialogPaperSx, type DialogHeaderColor } from './DialogHeader';

export type ConfirmSeverity = 'info' | 'warning' | 'error';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  severity?: ConfirmSeverity;
  /** Deshabilita ambos botones y muestra estado de carga en el de confirmar. */
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const colorBySeverity: Record<ConfirmSeverity, 'primary' | 'warning' | 'error'> = {
  info: 'primary',
  warning: 'warning',
  error: 'error',
};

const iconBySeverity: Record<ConfirmSeverity, typeof WarningAmberOutlinedIcon> = {
  info: InfoOutlinedIcon,
  warning: WarningAmberOutlinedIcon,
  error: ErrorOutlineOutlinedIcon,
};

/**
 * Diálogo de confirmación completamente genérico: no conoce Users,
 * Candidates ni ningún otro dominio. Cualquier feature lo reutiliza
 * pasándole texto y un callback.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  severity = 'info',
  loading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const Icon = iconBySeverity[severity];
  const color = colorBySeverity[severity];

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{ paper: { sx: dialogPaperSx } }}
    >
      <DialogHeader
        icon={<Icon fontSize="small" />}
        title={title}
        color={color as DialogHeaderColor}
        onClose={loading ? undefined : onClose}
      />
      <DialogContent sx={{ px: 4, pb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 4, pb: 3, pt: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={loading} color="inherit">
          {cancelText}
        </Button>
        <Button onClick={onConfirm} disabled={loading} variant="contained" color={color}>
          {loading ? 'Procesando…' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
