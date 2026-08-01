import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  InputAdornment,
  MenuItem,
  Pagination,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import PeopleOutlineOutlinedIcon from '@mui/icons-material/PeopleOutlineOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import { Navigate } from 'react-router-dom';
import { useUsersQuery } from '../hooks/useUsersQuery';
import { useUserMutations } from '../hooks/useUserMutations';
import { UsersTable } from './UsersTable';
import { UserFormDialog } from './UserFormDialog';
import { ChangePasswordDialog } from './ChangePasswordDialog';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { extractApiErrorMessage } from '@/shared/utils/apiError';
import { VISIBLE_USER_ROLES, type User } from '../types/user.types';
import type { UserFormMode } from '../types/userForm.schema';
import { useAuth } from '@/features/auth/context/AuthContext';
import { UserRole } from '@/features/auth/types/role.enum';
import { paths } from '@/routes/paths';

interface FormDialogState {
  open: boolean;
  mode: UserFormMode;
  user: User | null;
}

export function UsersPage() {
  // Todos los hooks se llaman siempre, sin condicionar su ejecución al
  // rol — el corte por RECRUITER ocurre únicamente en el JSX que se
  // retorna al final, para no violar las Rules of Hooks.
  const { user: currentUser } = useAuth();
  const {
    users,
    pagination,
    isLoading,
    isError,
    error,
    refetch,
    searchInput,
    setSearchInput,
    page,
    setPage,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
  } = useUsersQuery();
  const { updateStatus } = useUserMutations();

  const [formDialog, setFormDialog] = useState<FormDialogState>({
    open: false,
    mode: 'create',
    user: null,
  });
  const [passwordDialogUser, setPasswordDialogUser] = useState<User | null>(null);
  const [statusTarget, setStatusTarget] = useState<User | null>(null);

  async function handleConfirmStatus() {
    if (!statusTarget) return;
    try {
      await updateStatus.mutateAsync({
        id: statusTarget.id,
        payload: { isActive: !statusTarget.isActive },
      });
      setStatusTarget(null);
    } catch {
      // El diálogo se queda abierto: el usuario puede reintentar o cerrarlo.
    }
  }

  // TODO: reemplazar por un RoleGuard genérico cuando construyamos la
  // infraestructura de autorización por roles (fase futura). Por ahora,
  // verificación puntual solo para este caso: RECRUITER no debe acceder
  // a Users, ni siquiera navegando la URL directamente (el ítem del
  // menú ya está oculto vía getVisibleNavItems, pero eso no bloquea la
  // navegación directa por URL).
  if (currentUser?.role === UserRole.RECRUITER) {
    return <Navigate to={paths.dashboard} replace />;
  }

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        sx={{ mb: 0.5 }}
      >
        <Typography variant="h4">Usuarios</Typography>
        <Button
          variant="contained"
          startIcon={<AddOutlinedIcon />}
          onClick={() => setFormDialog({ open: true, mode: 'create', user: null })}
        >
          Nuevo usuario
        </Button>
      </Stack>

      {/*
        TODO(temporal): mientras el backend siga contando a SYSTEM y al
        propio usuario autenticado dentro de pagination.total, el
        contador debe basarse en las filas realmente renderizadas
        (users.length), no en pagination.total. Revertir cuando el
        backend excluya ambos casos en el conteo.
      */}
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {users.length} usuario{users.length !== 1 ? 's' : ''} encontrado
        {users.length !== 1 ? 's' : ''}
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <TextField
          placeholder="Buscar por nombre o correo…"
          size="small"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          sx={{ maxWidth: { sm: 280 } }}
          fullWidth
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlinedIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            },
          }}
        />

        <TextField
          select
          size="small"
          label="Estado"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="all">Todos</MenuItem>
          <MenuItem value="active">Activo</MenuItem>
          <MenuItem value="inactive">Inactivo</MenuItem>
        </TextField>

        <TextField
          select
          size="small"
          label="Rol"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="all">Todos</MenuItem>
          {VISIBLE_USER_ROLES.map((role) => (
            <MenuItem key={role} value={role}>
              {role}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {isError && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              Reintentar
            </Button>
          }
        >
          {extractApiErrorMessage(error, 'No se pudo cargar la lista de usuarios.')}
        </Alert>
      )}

      {isLoading && <Skeleton variant="rounded" height={360} sx={{ borderRadius: 3 }} />}

      {!isLoading && !isError && users.length === 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            borderRadius: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(0,74,152,0.08)',
              color: 'primary.main',
              mb: 2,
            }}
          >
            <PeopleOutlineOutlinedIcon />
          </Box>
          <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
            No se encontraron usuarios
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360 }}>
            {searchInput || roleFilter !== 'all' || statusFilter !== 'all'
              ? 'Intenta con otros filtros o término de búsqueda.'
              : 'Todavía no hay usuarios registrados.'}
          </Typography>
        </Paper>
      )}

      {!isLoading && !isError && users.length > 0 && (
        <>
          <UsersTable
            users={users}
            onEdit={(user) => setFormDialog({ open: true, mode: 'edit', user })}
            onToggleStatus={setStatusTarget}
            onChangePassword={setPasswordDialogUser}
            statusPendingUserId={
              updateStatus.isPending ? updateStatus.variables?.id : undefined
            }
          />

          {pagination && pagination.totalPages > 1 && (
            <Stack alignItems="center" sx={{ mt: 3 }}>
              <Pagination
                count={pagination.totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                shape="rounded"
                color="primary"
              />
            </Stack>
          )}
        </>
      )}

      <UserFormDialog
        open={formDialog.open}
        mode={formDialog.mode}
        user={formDialog.user}
        onClose={() => setFormDialog((state) => ({ ...state, open: false }))}
      />

      <ChangePasswordDialog
        open={!!passwordDialogUser}
        user={passwordDialogUser}
        onClose={() => setPasswordDialogUser(null)}
      />

      <ConfirmDialog
        open={!!statusTarget}
        title={statusTarget?.isActive ? 'Desactivar usuario' : 'Activar usuario'}
        description={
          statusTarget
            ? `¿Confirmas que deseas ${statusTarget.isActive ? 'desactivar' : 'activar'} a ${statusTarget.firstName} ${statusTarget.lastName}?`
            : ''
        }
        confirmText={statusTarget?.isActive ? 'Sí, desactivar' : 'Sí, activar'}
        severity={statusTarget?.isActive ? 'warning' : 'info'}
        loading={updateStatus.isPending}
        onConfirm={handleConfirmStatus}
        onClose={() => setStatusTarget(null)}
      />
    </Box>
  );
}
