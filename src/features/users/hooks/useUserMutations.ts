import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService } from '../services/usersService';
import { useToast } from '@/shared/context/ToastContext';
import { extractApiErrorMessage } from '@/shared/utils/apiError';
import type {
  CreateUserRequest,
  UpdateUserPasswordRequest,
  UpdateUserRequest,
  UpdateUserRoleRequest,
  UpdateUserStatusRequest,
} from '../types/user.types';

/**
 * Todas las mutaciones de Users en un solo hook. Cada una invalida el
 * listado al terminar con éxito, y expone su propio `isPending`/
 * `variables` — así el componente que la use sabe exactamente qué
 * acción (y, en el caso de status, qué fila) está en curso sin
 * necesitar estado adicional en el componente.
 *
 * Toasts: se centralizan aquí (no en cada componente que llama a la
 * mutación) porque las 4 acciones CRUD ya pasan por este único hook —
 * ponerlos en cada componente los duplicaría 3 veces. Éxito en las 4
 * acciones; error solo en Cambiar estado y Eliminar, porque Crear/Editar
 * ya muestran el error real del backend dentro del propio diálogo
 * (UserFormDialog) — un toast adicional ahí sería la misma información
 * repetida dos veces en pantalla.
 */
export function useUserMutations() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  function invalidateList() {
    return queryClient.invalidateQueries({ queryKey: ['users', 'list'] });
  }

  const createUser = useMutation({
    mutationFn: (payload: CreateUserRequest) => usersService.create(payload),
    onSuccess: () => {
      showToast('Usuario creado exitosamente.');
      return invalidateList();
    },
  });

  const updateUser = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserRequest }) =>
      usersService.update(id, payload),
    onSuccess: () => {
      showToast('Usuario actualizado exitosamente.');
      return invalidateList();
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserStatusRequest }) =>
      usersService.updateStatus(id, payload),
    onSuccess: (_data, variables) => {
      showToast(
        variables.payload.isActive ? 'Usuario activado exitosamente.' : 'Usuario desactivado exitosamente.',
      );
      return invalidateList();
    },
    onError: (error) => {
      showToast(extractApiErrorMessage(error, 'No se pudo cambiar el estado del usuario.'), 'error');
    },
  });

  const updateRole = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserRoleRequest }) =>
      usersService.updateRole(id, payload),
    onSuccess: () => {
      showToast('Rol del usuario actualizado exitosamente.');
      return invalidateList();
    },
    onError: (error) => {
      showToast(extractApiErrorMessage(error, 'No se pudo actualizar el rol del usuario.'), 'error');
    },
  });

  const updatePassword = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPasswordRequest }) =>
      usersService.updatePassword(id, payload),
    onSuccess: invalidateList,
  });

  const deleteUser = useMutation({
    mutationFn: (id: string) => usersService.remove(id),
    onSuccess: () => {
      showToast('Usuario eliminado definitivamente.');
      return invalidateList();
    },
    onError: (error) => {
      showToast(extractApiErrorMessage(error, 'No se pudo eliminar el usuario.'), 'error');
    },
  });

  return { createUser, updateUser, updateStatus, updateRole, updatePassword, deleteUser };
}
