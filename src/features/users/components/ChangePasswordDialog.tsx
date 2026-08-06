import { useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, Stack, TextField } from '@mui/material';
import LockResetOutlinedIcon from '@mui/icons-material/LockResetOutlined';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { changePasswordSchema, type ChangePasswordFormValues } from '../types/changePassword.schema';
import { useUserMutations } from '../hooks/useUserMutations';
import type { User } from '../types/user.types';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { DialogHeader, dialogPaperSx } from '@/shared/components/DialogHeader';
import { extractApiErrorMessage } from '@/shared/utils/apiError';

/**
 * NOTA (regla de negocio, iteración de calidad de Users): el cambio de
 * contraseña dejó de ser una acción administrativa — el backend genera
 * una contraseña temporal al crear el usuario y la envía por correo
 * (ver mustChangePassword). Por eso este componente ya NO se invoca
 * desde UsersPage/UsersTable.
 *
 * Se conserva el archivo (y la mutación `updatePassword` en
 * useUserMutations) sin borrar porque sigue mapeando un endpoint real
 * del backend (PATCH /users/:id/password) que podría reutilizarse para
 * otro flujo futuro (ej. soporte). Si se confirma que ya no hace falta
 * en absoluto, se puede eliminar junto con cortar esa mutación.
 */
interface ChangePasswordDialogProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
}

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
      <Dialog
        open
        onClose={updatePassword.isPending ? undefined : onClose}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: dialogPaperSx } }}
      >
        <DialogHeader
          icon={<LockResetOutlinedIcon fontSize="small" />}
          title="Cambiar contraseña"
          description={`Nueva contraseña para ${user.firstName} ${user.lastName}.`}
          color="warning"
          onClose={updatePassword.isPending ? undefined : onClose}
        />
        <Box component="form" onSubmit={onSubmit} noValidate>
          <DialogContent sx={{ px: 4, pt: 1, pb: 1 }}>
            <Stack spacing={2.5}>
              {serverError && <Alert severity="error">{serverError}</Alert>}

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
          <DialogActions
            sx={{ px: 4, pb: 3, pt: 2.5, gap: 1, mt: 1, borderTop: '1px solid', borderColor: 'divider' }}
          >
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
