import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUserMutations } from '../hooks/useUserMutations';
import {
  buildUserFormSchema,
  type UserFormMode,
  type UserFormValues,
} from '../types/userForm.schema';
import type { User } from '../types/user.types';
import { UserRole } from '@/features/auth/types/role.enum';
import { extractApiErrorMessage } from '@/shared/utils/apiError';

interface UserFormDialogProps {
  open: boolean;
  mode: UserFormMode;
  /** Requerido cuando mode === 'edit'. */
  user?: User | null;
  onClose: () => void;
}

/**
 * `open` controla el montaje, no solo la visibilidad: al desmontar entre
 * usos, react-hook-form siempre arranca con `defaultValues` frescos, sin
 * arrastrar el estado del usuario editado anteriormente.
 */
export function UserFormDialog({ open, mode, user, onClose }: UserFormDialogProps) {
  if (!open) return null;
  return (
    <UserFormDialogContent
      key={mode === 'edit' ? user?.id : 'create'}
      mode={mode}
      user={user ?? null}
      onClose={onClose}
    />
  );
}

function UserFormDialogContent({
  mode,
  user,
  onClose,
}: {
  mode: UserFormMode;
  user: User | null;
  onClose: () => void;
}) {
  const { createUser, updateUser } = useUserMutations();
  const [serverError, setServerError] = useState<string | null>(null);
  const schema = useMemo(() => buildUserFormSchema(mode), [mode]);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      email: user?.email ?? '',
      password: '',
      role: user?.role ?? '',
    },
  });

  const isPending = mode === 'create' ? createUser.isPending : updateUser.isPending;

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      if (mode === 'create') {
        await createUser.mutateAsync({
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          password: values.password as string,
          role: values.role as UserRole,
        });
      } else if (user) {
        await updateUser.mutateAsync({
          id: user.id,
          payload: {
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
          },
        });
      }
      onClose();
    } catch (error) {
      setServerError(extractApiErrorMessage(error, 'No se pudo guardar el usuario.'));
    }
  });

  return (
    <Dialog open onClose={isPending ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{mode === 'create' ? 'Nuevo usuario' : 'Editar usuario'}</DialogTitle>
      <Box component="form" onSubmit={onSubmit} noValidate>
        <DialogContent>
          <Stack spacing={2.5}>
            {serverError && <Alert severity="error">{serverError}</Alert>}

            <TextField
              label="Nombre"
              fullWidth
              autoFocus
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
            <TextField
              label="Correo electrónico"
              type="email"
              fullWidth
              error={!!errors.email}
              helperText={errors.email?.message}
              {...register('email')}
            />

            {mode === 'create' && (
              <>
                <TextField
                  label="Contraseña"
                  type="password"
                  fullWidth
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  {...register('password')}
                />

                <Controller
                  control={control}
                  name="role"
                  render={({ field }) => (
                    <TextField
                      select
                      label="Rol"
                      fullWidth
                      error={!!errors.role}
                      helperText={errors.role?.message}
                      {...field}
                    >
                      {Object.values(UserRole).map((role) => (
                        <MenuItem key={role} value={role}>
                          {role}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} disabled={isPending} color="inherit">
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={isPending}>
            {isPending ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
