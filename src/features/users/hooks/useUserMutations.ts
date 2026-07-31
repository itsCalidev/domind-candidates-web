import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService } from '../services/usersService';
import type {
  CreateUserRequest,
  UpdateUserPasswordRequest,
  UpdateUserRequest,
  UpdateUserStatusRequest,
} from '../types/user.types';

/**
 * Todas las mutaciones de Users en un solo hook. Cada una invalida el
 * listado al terminar con éxito, y expone su propio `isPending`/
 * `variables` — así el componente que la use sabe exactamente qué
 * acción (y, en el caso de status, qué fila) está en curso sin
 * necesitar estado adicional en el componente.
 */
export function useUserMutations() {
  const queryClient = useQueryClient();

  function invalidateList() {
    return queryClient.invalidateQueries({ queryKey: ['users', 'list'] });
  }

  const createUser = useMutation({
    mutationFn: (payload: CreateUserRequest) => usersService.create(payload),
    onSuccess: invalidateList,
  });

  const updateUser = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserRequest }) =>
      usersService.update(id, payload),
    onSuccess: invalidateList,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserStatusRequest }) =>
      usersService.updateStatus(id, payload),
    onSuccess: invalidateList,
  });

  const updatePassword = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPasswordRequest }) =>
      usersService.updatePassword(id, payload),
    onSuccess: invalidateList,
  });

  return { createUser, updateUser, updateStatus, updatePassword };
}
