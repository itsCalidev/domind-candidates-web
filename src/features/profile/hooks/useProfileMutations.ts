import { useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '../services/profileService';
import { useToast } from '@/shared/context/ToastContext';
import type { UpdateUserPasswordRequest } from '@/features/users/types/user.types';
import type { UpdateMyProfileRequest } from '../types/profile.types';

/**
 * Mutaciones de autogestión ("yo mismo"). `updatePassword` no lleva
 * toast/onError propio a propósito: lo usan dos pantallas con reacciones
 * distintas ante el éxito (ForcePasswordChangePage redirige al Dashboard;
 * ProfilePage solo limpia el formulario) — cada una decide su propio
 * mensaje, igual que ya hace useUserMutations.updatePassword.
 */
export function useProfileMutations() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const updateProfile = useMutation({
    mutationFn: (payload: UpdateMyProfileRequest) => profileService.updateMyProfile(payload),
    onSuccess: () => {
      showToast('Perfil actualizado exitosamente.');
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: ['users', 'me'] }),
        queryClient.invalidateQueries({ queryKey: ['users', 'list'] }),
      ]);
    },
  });

  const updatePassword = useMutation({
    mutationFn: (payload: UpdateUserPasswordRequest) => profileService.updateMyPassword(payload),
  });

  return { updateProfile, updatePassword };
}
