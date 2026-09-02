import { useQuery } from '@tanstack/react-query';
import { candidatesService } from '../services/candidateService';

/**
 * GET /candidates/:id/evidence — fuente única de verdad de las fotos de
 * evidencia (galería de "Redes Sociales"). Clave separada de
 * ['candidates','detail',id] a propósito, mismo criterio que
 * useGetEvaluations: es un endpoint propio, no un campo embebido en el
 * candidato. useCandidateMutations invalida esta clave tras una subida
 * exitosa (ver uploadEvidence).
 */
export function useGetEvidence(candidateId: string | undefined) {
  return useQuery({
    queryKey: ['candidates', 'evidence', candidateId],
    queryFn: () => candidatesService.getEvidence(candidateId as string),
    enabled: !!candidateId,
  });
}
