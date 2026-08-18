import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import LockResetOutlinedIcon from '@mui/icons-material/LockResetOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import {
  changePasswordSchema,
  type ChangePasswordFormValues,
} from '@/features/users/types/changePassword.schema';
import { usersService } from '@/features/users/services/usersService';
import { useProfileMutations } from '../hooks/useProfileMutations';
import { nameFormSchema, type NameFormValues } from '../types/nameForm.schema';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useToast } from '@/shared/context/ToastContext';
import { extractApiErrorMessage } from '@/shared/utils/apiError';

/**
 * GET /users/:id (usado para precargar nombre/apellido) responde 403
 * para RECRUITER incluso sobre su propio id — confirmado en vivo. Esta
 * sección debe seguir siendo usable de todos modos: si la carga falla,
 * los campos arrancan vacíos en vez de romper la pantalla.
 */
function PersonalInfoSection({ userId, email }: { userId: string; email: string }) {
  const { updateProfile } = useProfileMutations();
  const [serverError, setServerError] = useState<string | null>(null);

  const profileQuery = useQuery({
    queryKey: ['users', 'me', userId],
    queryFn: () => usersService.getById(userId),
    retry: false,
  });

  if (profileQuery.isLoading) {
    return <Skeleton variant="rounded" height={280} sx={{ borderRadius: 3, mb: 3 }} />;
  }

  return (
    <PersonalInfoForm
      email={email}
      initialFirstName={profileQuery.data?.firstName ?? ''}
      initialLastName={profileQuery.data?.lastName ?? ''}
      couldPreload={profileQuery.isSuccess}
      isPending={updateProfile.isPending}
      serverError={serverError}
      onSubmit={async (values) => {
        setServerError(null);
        try {
          await updateProfile.mutateAsync(values);
        } catch (error) {
          setServerError(extractApiErrorMessage(error, 'No se pudo actualizar el perfil.'));
        }
      }}
    />
  );
}

function PersonalInfoForm({
  email,
  initialFirstName,
  initialLastName,
  couldPreload,
  isPending,
  serverError,
  onSubmit,
}: {
  email: string;
  initialFirstName: string;
  initialLastName: string;
  couldPreload: boolean;
  isPending: boolean;
  serverError: string | null;
  onSubmit: (values: NameFormValues) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NameFormValues>({
    resolver: zodResolver(nameFormSchema),
    defaultValues: { firstName: initialFirstName, lastName: initialLastName },
  });

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2 }}>
        <PersonOutlineOutlinedIcon fontSize="small" color="action" />
        <Typography variant="subtitle1">Información personal</Typography>
      </Stack>

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={2.5}>
          {serverError && <Alert severity="error">{serverError}</Alert>}
          {!couldPreload && (
            <Alert severity="info">
              No pudimos precargar tu nombre actual. Escríbelo de nuevo para continuar.
            </Alert>
          )}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Nombre"
              fullWidth
              error={!!errors.firstName}
              helperText={errors.firstName?.message}
              {...register('firstName')}
            />
            <TextField
              label="Apellido"
              fullWidth
              error={!!errors.lastName}
              helperText={errors.lastName?.message}
              {...register('lastName')}
            />
          </Stack>

          <TextField
            label="Correo electrónico"
            fullWidth
            value={email}
            disabled
            helperText="Este campo no es editable. Contacta a un administrador para actualizarlo."
          />

          <Box>
            <Button type="submit" variant="contained" disabled={isPending}>
              {isPending ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </Box>
        </Stack>
      </Box>
    </Paper>
  );
}

function PasswordSection() {
  const { updatePassword } = useProfileMutations();
  const { showToast } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await updatePassword.mutateAsync({ password: values.password });
      showToast('Contraseña actualizada exitosamente.');
      reset();
    } catch (error) {
      setServerError(extractApiErrorMessage(error, 'No se pudo actualizar la contraseña.'));
    }
  });

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2 }}>
        <LockResetOutlinedIcon fontSize="small" color="action" />
        <Typography variant="subtitle1">Cambiar contraseña</Typography>
      </Stack>

      <Box component="form" onSubmit={onSubmit} noValidate sx={{ maxWidth: 420 }}>
        <Stack spacing={2.5}>
          {serverError && <Alert severity="error">{serverError}</Alert>}

          <TextField
            label="Nueva contraseña"
            type={showPassword ? 'text' : 'password'}
            fullWidth
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

          <Box>
            <Button type="submit" variant="contained" disabled={updatePassword.isPending}>
              {updatePassword.isPending ? 'Actualizando…' : 'Actualizar contraseña'}
            </Button>
          </Box>
        </Stack>
      </Box>
    </Paper>
  );
}

export function ProfilePage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        Mi perfil
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Administra tu información personal y tu contraseña.
      </Typography>

      <PersonalInfoSection userId={user.id} email={user.email} />
      <PasswordSection />
    </Box>
  );
}
