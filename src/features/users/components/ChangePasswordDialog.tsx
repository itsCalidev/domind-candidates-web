import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { changePasswordSchema, type ChangePasswordFormValues } from '../types/changePassword.schema';
import { useUserMutations } from '../hooks/useUserMutations';
import type { User } from '../types/user.types';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { extractApiErrorMessage } from '@/shared/utils/apiError';

interface ChangePasswordDialogProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
}

/**
 * Diálogo independiente de UserFormDialog (responsabilidad distinta:
 * cambiar contraseña, no editar datos generales). El formulario en sí
 * no llama a la API directamente: al enviarlo, abre un ConfirmDialog
 * y solo al confirmar se ejecuta la mutación real.
 */
export function ChangePasswordDialog({ open, user, onClose }: ChangePasswordDialogProps) {
  if (!open || !user) return null;
  return <ChangePasswordDialogContent key={user.id} user={user} onClose={onClose} />;
}

function ChangePasswordDialogContent({ user, onClose }: { user: User; onClose: () => void }) {
  const { updatePassword } = useUserMutations();
  const [serverError, setServerError] = useState<string | null>(null);
  const [pendingValues, setPendingValues] = useState<ChangePasswordFormValues | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  // El submit del formulario solo valida y abre la confirmación;
  // la llamada real a la API ocurre en handleConfirm.
  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    setPendingValues(values);
  });

  async function handleConfirm() {
    if (!pendingValues) return;
    try {
      await updatePassword.mutateAsync({
        id: user.id,
        payload: { password: pendingValues.password },
      });
      setPendingValues(null);
      onClose();
    } catch (error) {
      setPendingValues(null);
      setServerError(extractApiErrorMessage(error, 'No se pudo cambiar la contraseña.'));
    }
  }

  return (
    <>
      <Dialog open onClose={updatePassword.isPending ? undefined : onClose} maxWidth="xs" fullWidth>
        <DialogTitle>Cambiar contraseña</DialogTitle>
        <Box component="form" onSubmit={onSubmit} noValidate>
          <DialogContent>
            <Stack spacing={2.5}>
              {serverError && <Alert severity="error">{serverError}</Alert>}

              <Alert severity="info" variant="outlined">
                Nueva contraseña para {user.firstName} {user.lastName}. No se solicita la
                contraseña actual: es un cambio administrativo.
              </Alert>

              <TextField
                label="Nueva contraseña"
                type="password"
                fullWidth
                autoFocus
                error={!!errors.password}
                helperText={errors.password?.message}
                {...register('password')}
              />
              <TextField
                label="Confirmar contraseña"
                type="password"
                fullWidth
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={onClose} color="inherit">
              Cancelar
            </Button>
            <Button type="submit" variant="contained">
              Guardar
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <ConfirmDialog
        open={pendingValues !== null}
        title="Cambiar contraseña"
        description={`¿Confirmas que deseas actualizar la contraseña de ${user.firstName} ${user.lastName}? Este cambio aplica de inmediato.`}
        confirmText="Sí, cambiar contraseña"
        severity="warning"
        loading={updatePassword.isPending}
        onConfirm={handleConfirm}
        onClose={() => setPendingValues(null)}
      />
    </>
  );
}
