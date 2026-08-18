import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
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
import { UserRole, isSystem } from '@/features/auth/types/role.enum';
import { extractApiErrorMessage } from '@/shared/utils/apiError';
import { DialogHeader, dialogPaperSx } from '@/shared/components/DialogHeader';
import { useAuth } from '@/features/auth/context/AuthContext';

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
  const { createUser, updateUser, updateRole, updateStatus } = useUserMutations();
  const { user: currentUser } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const schema = useMemo(() => buildUserFormSchema(mode), [mode]);

  /**
   * Edición de correo y rol restringida a SYSTEM (el backend, verificado
   * en vivo, hoy NO impone esta restricción por rol en PATCH /users/:id
   * ni en PATCH /users/:id/role — es una decisión de producto aplicada
   * aquí, no una medida de seguridad; el backend sigue siendo la
   * autoridad real). Activar/desactivar sí lo puede hacer también ADMIN
   * (backend confirmado: PATCH /users/:id/status no restringe por rol),
   * así que ese campo se muestra a cualquiera que llegue a esta pantalla.
   * En modo `create`, correo y rol siempre se muestran — esa regla no
   * aplica ahí, es una pantalla distinta.
   */
  const isSystemUser = isSystem(currentUser?.role);
  const showEmailField = mode === 'create' || isSystemUser;
  const showRoleField = mode === 'create' || isSystemUser;
  const showStatusField = mode === 'edit';

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
      isActive: user?.isActive ?? true,
    },
  });

  const isPending =
    mode === 'create'
      ? createUser.isPending
      : updateUser.isPending || updateRole.isPending || updateStatus.isPending;

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
        // PATCH /users/:id, /role y /status son endpoints separados en
        // el backend (confirmado: el primero rechaza role/isActive con
        // 400 "property X should not exist"), así que cada campo con
        // permiso viaja por su propia llamada. Solo se dispara rol/status
        // si de verdad cambiaron, para no generar escrituras (ni una
        // eventual entrada de auditoría futura) sin cambio real.
        await updateUser.mutateAsync({
          id: user.id,
          payload: {
            firstName: values.firstName,
            lastName: values.lastName,
            // ADMIN nunca puede cambiar el correo: se omite del payload
            // por completo (no solo se oculta el campo), sin depender de
            // que el formulario nunca haya mostrado el input.
            ...(showEmailField ? { email: values.email } : {}),
          },
        });

        if (showRoleField && values.role && values.role !== user.role) {
          await updateRole.mutateAsync({
            id: user.id,
            payload: { role: values.role as UserRole },
          });
        }

        if (showStatusField && values.isActive !== undefined && values.isActive !== user.isActive) {
          await updateStatus.mutateAsync({
            id: user.id,
            payload: { isActive: values.isActive },
          });
        }
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
            : !showEmailField
              ? 'Puedes editar el nombre, el apellido y el estado de este usuario.'
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
            {showEmailField && (
              <TextField
                label="Correo electrónico"
                type="email"
                fullWidth
                error={!!errors.email}
                helperText={errors.email?.message}
                {...register('email')}
              />
            )}

            {showRoleField && (
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
                    {/*
                      VISIBLE_USER_ROLES ya excluye SYSTEM (definido en
                      user.types.ts) — mismo arreglo que usa el modo
                      `create`, así que "único SYSTEM" nunca aparece como
                      opción aquí tampoco. El backend además lo rechaza
                      con 403 si de todos modos se intentara.
                    */}
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

            {showStatusField && (
              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={!!field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    }
                    label={field.value ? 'Usuario activo' : 'Usuario inactivo'}
                  />
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
