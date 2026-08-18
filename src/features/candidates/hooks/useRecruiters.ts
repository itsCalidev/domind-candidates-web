import { useQuery } from '@tanstack/react-query';
import { usersService } from '@/features/users/services/usersService';
import { UserRole } from '@/features/auth/types/role.enum';
import { PAGE_SIZE_OPTIONS } from '@/shared/constants/table';

/** Máximo que acepta el backend por página (el DTO valida contra esta misma lista). */
const MAX_PAGE_SIZE = PAGE_SIZE_OPTIONS[PAGE_SIZE_OPTIONS.length - 1];

/**
 * Reclutadores activos, para el selector de asignación. Reutiliza
 * GET /users?role=RECRUITER a través de usersService — no hace falta un
 * endpoint ni un servicio nuevo.
 *
 * Se pide una sola página del tamaño máximo permitido: hoy existen 3
 * reclutadores, así que caben de sobra. Si alguna vez se superan los
 * 100, este hook tendría que paginar o el selector volverse asíncrono;
 * hasta entonces, paginar aquí sería complejidad sin beneficio.
 *
 * Solo se listan los activos: asignar un candidato a un reclutador
 * desactivado no tendría sentido operativo.
 */
export function useRecruiters(enabled = true) {
  const query = useQuery({
    queryKey: ['users', 'recruiters'],
    queryFn: () =>
      usersService.getList({
        role: UserRole.RECRUITER,
        isActive: true,
        page: 1,
        limit: MAX_PAGE_SIZE,
      }),
    enabled,
  });

  return {
    recruiters: query.data?.items ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}
