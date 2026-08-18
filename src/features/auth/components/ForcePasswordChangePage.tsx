import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
} from '@mui/material';
import LockResetOutlinedIcon from '@mui/icons-material/LockResetOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import {
  changePasswordSchema,
  type ChangePasswordFormValues,
} from '@/features/users/types/changePassword.schema';
import { useProfileMutations } from '@/features/profile/hooks/useProfileMutations';
import { useAuth } from '../context/AuthContext';
import { useToast } from '@/shared/context/ToastContext';
import { DialogHeader, dialogPaperSx } from '@/shared/components/DialogHeader';
import { extractApiErrorMessage } from '@/shared/utils/apiError';
import { paths } from '@/routes/paths';

/**
 * Pantalla de bloqueo cuando el backend marcó `mustChangePassword` en el
 * login (ver AuthContext). Se renderiza fuera de AdminLayout a propósito
 * — sin sidebar, sin forma de navegar a otra pantalla del panel; la
 * única salida además de cambiar la contraseña es cerrar sesión.
 *
 * Usa PATCH /users/me/password (useProfileMutations), NO
 * /users/:id/password: ese endpoint devuelve 403 para RECRUITER incluso
 * sobre su propio id — justo el caso que este flujo obligatorio necesita
 * cubrir para los tres roles.
 */
export function ForcePasswordChangePage() {
  const { markPasswordChanged, logout } = useAuth();
  const { updatePassword } = useProfileMutations();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await updatePassword.mutateAsync({ password: values.password });
      markPasswordChanged();
      showToast('Contraseña actualizada correctamente.');
      navigate(paths.dashboard, { replace: true });
    } catch (error) {
      setServerError(extractApiErrorMessage(error, 'No se pudo actualizar la contraseña.'));
    }
  });

  async function handleLogout() {
    await logout();
    navigate(paths.login, { replace: true });
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 3,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 420, bgcolor: 'background.paper', ...dialogPaperSx }}>
        <DialogHeader
          icon={<LockResetOutlinedIcon fontSize="small" />}
          title="Actualiza tu contraseña"
          description="Por seguridad, debes establecer una nueva contraseña antes de continuar."
          color="warning"
        />
        <Box component="form" onSubmit={onSubmit} noValidate sx={{ px: 4, pb: 4 }}>
          <Stack spacing={2.5}>
            {serverError && <Alert severity="error">{serverError}</Alert>}

            <TextField
              label="Nueva contraseña"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              autoFocus
              autoComplete="new-password"
              error={!!errors.password}
              helperText={errors.password?.message}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((prev) => !prev)}
                        edge="end"
                        size="small"
                        aria-label="Mostrar u ocultar contraseña"
                      >
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              {...register('password')}
            />
            <TextField
              label="Confirmar contraseña"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              autoComplete="new-password"
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={updatePassword.isPending}
              sx={{ py: 1.3, mt: 1 }}
            >
              {updatePassword.isPending ? 'Actualizando…' : 'Actualizar contraseña'}
            </Button>

            <Button
              variant="text"
              color="inherit"
              size="small"
              onClick={handleLogout}
              sx={{ alignSelf: 'center' }}
            >
              Cerrar sesión
            </Button>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
