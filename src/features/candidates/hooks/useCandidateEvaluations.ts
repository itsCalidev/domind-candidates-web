import { useQuery } from '@tanstack/react-query';
import { candidatesService } from '../services/candidateService';

/**
 * GET /candidates/:id/evaluations — fuente única de verdad del progreso
 * de calificación por sección. Clave separada de ['candidates','detail',id]
 * a propósito: es un endpoint propio, no un campo embebido en el
 * candidato (ver candidateService.ts). useCandidateMutations invalida
 * esta clave después de un PUT exitoso.
 */
export function useGetEvaluations(candidateId: string | undefined) {
  return useQuery({
    queryKey: ['candidates', 'evaluations', candidateId],
    queryFn: () => candidatesService.getEvaluations(candidateId as string),
    enabled: !!candidateId,
  });
}
