import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  InputAdornment,
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
import { AddFilterButton } from './AddFilterButton';
import { FilterChip } from './FilterChip';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { SelectionActionBar } from '@/shared/components/SelectionActionBar';
import { useRowSelection } from '@/shared/hooks/useRowSelection';
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

type FilterKey = 'status' | 'role';

/**
 * Definición de filtros disponibles. Agregar un filtro nuevo (Empresa,
 * Fecha, etc.) más adelante es agregar una entrada aquí, no rediseñar
 * la UI de filtros.
 */
const FILTER_DEFINITIONS: Record<FilterKey, { label: string; options: { value: string; label: string }[] }> = {
  status: {
    label: 'Estado',
    options: [
      { value: 'active', label: 'Activo' },
      { value: 'inactive', label: 'Inactivo' },
    ],
  },
  role: {
    label: 'Rol',
    options: VISIBLE_USER_ROLES.map((role) => ({ value: role, label: role })),
  },
};

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

  const selection = useRowSelection<string>({
    pageIds: users.map((user) => user.id),
    // TODO: pagination.total todavía cuenta a SYSTEM y al usuario
    // autenticado (ver TODO del contador más abajo) — "seleccionar
    // todos los N" heredará esa misma imprecisión hasta que el backend
    // los excluya también del total. No es un bug nuevo de selección.
    totalCount: pagination?.total,
  });

  // Cambiar de búsqueda o filtros implica que "todo lo seleccionado"
  // ya no refiere al mismo conjunto de resultados — se limpia. Cambiar
  // de PÁGINA deliberadamente no está en estas dependencias: la
  // selección debe persistir al navegar entre páginas.
  useEffect(() => {
    selection.clearSelection();
  }, [searchInput, roleFilter, statusFilter, selection.clearSelection]);

  const [formDialog, setFormDialog] = useState<FormDialogState>({
    open: false,
    mode: 'create',
    user: null,
  });
  const [statusTarget, setStatusTarget] = useState<User | null>(null);
  const [activeFilterKeys, setActiveFilterKeys] = useState<FilterKey[]>([]);

  function handleAddFilter(key: string) {
    const filterKey = key as FilterKey;
    setActiveFilterKeys((prev) => [...prev, filterKey]);
    if (filterKey === 'status') setStatusFilter('active');
    if (filterKey === 'role') setRoleFilter(FILTER_DEFINITIONS.role.options[0].value as UserRole);
  }

  function handleRemoveFilter(key: FilterKey) {
    setActiveFilterKeys((prev) => prev.filter((k) => k !== key));
    if (key === 'status') setStatusFilter('all');
    if (key === 'role') setRoleFilter('all');
  }

  const availableFilterOptions = (Object.keys(FILTER_DEFINITIONS) as FilterKey[])
    .filter((key) => !activeFilterKeys.includes(key))
    .map((key) => ({ key, label: FILTER_DEFINITIONS[key].label }));

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
        (users.length), no en pagination.total.
      */}
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {users.length} usuario{users.length !== 1 ? 's' : ''} encontrado
        {users.length !== 1 ? 's' : ''}
      </Typography>

      <Stack
        direction="row"
        spacing={1.5}
        sx={{ mb: 3 }}
        flexWrap="wrap"
        useFlexGap
        alignItems="center"
      >
        <TextField
          placeholder="Buscar por nombre o correo…"
          size="small"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          sx={{ width: 280 }}
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

        {activeFilterKeys.includes('status') && (
          <FilterChip
            label={FILTER_DEFINITIONS.status.label}
            value={statusFilter}
            options={FILTER_DEFINITIONS.status.options}
            onChange={(value) => setStatusFilter(value as typeof statusFilter)}
            onRemove={() => handleRemoveFilter('status')}
          />
        )}

        {activeFilterKeys.includes('role') && (
          <FilterChip
            label={FILTER_DEFINITIONS.role.label}
            value={roleFilter}
            options={FILTER_DEFINITIONS.role.options}
            onChange={(value) => setRoleFilter(value as UserRole)}
            onRemove={() => handleRemoveFilter('role')}
          />
        )}

        <AddFilterButton options={availableFilterOptions} onAdd={handleAddFilter} />
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
            {searchInput || activeFilterKeys.length > 0
              ? 'Intenta con otros filtros o término de búsqueda.'
              : 'Todavía no hay usuarios registrados.'}
          </Typography>
        </Paper>
      )}

      {!isLoading && !isError && users.length > 0 && (
        <>
          {selection.hasSelection && (
            <SelectionActionBar
              selectedCount={selection.selectedCount}
              totalCount={pagination?.total}
              isAllSelected={selection.isAllSelected}
              canSelectAllMatching={!!pagination && pagination.totalPages > 1}
              onSelectAllMatching={selection.selectAllMatching}
              onClearSelection={selection.clearSelection}
              // El slot `actions` queda vacío intencionalmente: exportar/
              // eliminar/cambios masivos se conectan en una fase futura
              // pasándolos aquí, sin tocar este componente ni el hook.
            />
          )}

          <UsersTable
            users={users}
            onEdit={(user) => setFormDialog({ open: true, mode: 'edit', user })}
            onToggleStatus={setStatusTarget}
            statusPendingUserId={
              updateStatus.isPending ? updateStatus.variables?.id : undefined
            }
            headerState={selection.headerState}
            isSelected={selection.isSelected}
            toggleRow={selection.toggleRow}
            toggleAllOnPage={selection.toggleAllOnPage}
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
