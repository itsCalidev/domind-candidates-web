import { useQuery } from '@tanstack/react-query';
import { candidatesService } from '../services/candidateService';

/**
 * Detalle de un candidato vía TanStack Query, igual que useCandidatesList
 * y useUsersQuery. Antes usaba useState/useEffect crudo, lo que dejaba el
 * detalle fuera de la caché: tras asignar un reclutador no había nada que
 * invalidar y la cabecera seguía mostrando el valor viejo. La clave
 * ['candidates', 'detail', id] comparte prefijo con la del listado, así
 * que useCandidateMutations puede invalidar ambas por separado.
 *
 * Devuelve la misma forma { candidate, isLoading } que antes para no
 * obligar a CandidateDetailPage a cambiar.
 */
export function useCandidateDetail(id: string | undefined) {
  const query = useQuery({
    queryKey: ['candidates', 'detail', id],
    queryFn: () => candidatesService.getById(id as string),
    enabled: !!id,
  });

  return {
    candidate: query.data ?? null,
    // Sin `id` la query queda deshabilitada y isLoading se quedaría en
    // true para siempre; ese caso es "no hay nada que cargar", no "está
    // cargando" — la página debe pasar directo a "Candidato no encontrado".
    isLoading: !!id && query.isLoading,
  };
}
