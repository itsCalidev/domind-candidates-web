import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUserMutations } from '../hooks/useUserMutations';
import {
  buildUserFormSchema,
  type UserFormMode,
  type UserFormValues,
} from '../types/userForm.schema';
import { VISIBLE_USER_ROLES, type User } from '../types/user.types';
import { roleIcon } from './UserRoleChip';
import { UserRole } from '@/features/auth/types/role.enum';
import { extractApiErrorMessage } from '@/shared/utils/apiError';
import { DialogHeader, dialogPaperSx } from '@/shared/components/DialogHeader';

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
      role: user?.role ?? '',
    },
  });

  const isPending = mode === 'create' ? createUser.isPending : updateUser.isPending;

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      if (mode === 'create') {
        // Ya no se envía `password`: el backend genera una contraseña
        // temporal y la envía por correo (ver mustChangePassword).
        await createUser.mutateAsync({
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
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
    <Dialog
      open
      onClose={isPending ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{ paper: { sx: dialogPaperSx } }}
    >
      <DialogHeader
        icon={
          mode === 'create' ? (
            <PersonAddAltOutlinedIcon fontSize="small" />
          ) : (
            <EditOutlinedIcon fontSize="small" />
          )
        }
        title={mode === 'create' ? 'Nuevo usuario' : 'Editar usuario'}
        description={
          mode === 'create'
            ? 'El sistema generará una contraseña temporal para este usuario.'
            : undefined
        }
        onClose={isPending ? undefined : onClose}
      />
      <Box component="form" onSubmit={onSubmit} noValidate>
        <DialogContent sx={{ px: 4, pt: 1, pb: 1 }}>
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
                    {VISIBLE_USER_ROLES.map((role) => {
                      const Icon = roleIcon[role];
                      return (
                        <MenuItem key={role} value={role} sx={{ gap: 1.25 }}>
                          <Icon fontSize="small" sx={{ color: 'text.secondary' }} />
                          {role}
                        </MenuItem>
                      );
                    })}
                  </TextField>
                )}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions
          sx={{ px: 4, pb: 3, pt: 2.5, gap: 1, mt: 1, borderTop: '1px solid', borderColor: 'divider' }}
        >
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
