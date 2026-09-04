import { useQuery } from '@tanstack/react-query';
import { candidatesService } from '../services/candidateService';
import type { EvidenceCategory } from '../types/candidate.types';

/**
 * GET /candidates/:id/evidence?category=... — fuente única de verdad de
 * las evidencias de una categoría (galerías de "Redes Sociales",
 * "Vivienda" y "Documentación"). Clave separada de
 * ['candidates','detail',id] a propósito, mismo criterio que
 * useGetEvaluations: es un endpoint propio, no un campo embebido en el
 * candidato. `category` va DENTRO de la query key (no solo como filtro de
 * la petición) porque 3 pestañas distintas piden 3 categorías distintas
 * del mismo candidato — sin esto, la caché de una pisaría la de otra.
 * useCandidateMutations invalida con la key corta `['candidates','evidence',id]`
 * tras crear/editar/borrar una evidencia, que por defecto en TanStack
 * Query v5 alcanza (por prefijo) a las 3 variantes con `category`.
 */
export function useGetEvidence(candidateId: string | undefined, category: EvidenceCategory) {
  return useQuery({
    queryKey: ['candidates', 'evidence', candidateId, category],
    queryFn: () => candidatesService.getEvidence(candidateId as string, category),
    enabled: !!candidateId,
  });
}
