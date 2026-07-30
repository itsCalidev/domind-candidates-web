import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';

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
  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{description}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} disabled={loading} color="inherit">
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          variant="contained"
          color={colorBySeverity[severity]}
        >
          {loading ? 'Procesando…' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
