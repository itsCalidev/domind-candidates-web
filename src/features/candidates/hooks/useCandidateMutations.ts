import { useMutation, useQueryClient } from '@tanstack/react-query';
import { candidatesService } from '../services/candidateService';
import { useToast } from '@/shared/context/ToastContext';
import { extractApiErrorMessage } from '@/shared/utils/apiError';
import type {
  CandidateStatus,
  EvaluationRating,
  EvaluationSection,
  NeighborhoodReferencePayload,
  PersonalReferencePayload,
  SocialNetworkPayload,
  WorkHistoryPayload,
} from '../types/candidate.types';

/**
 * Mutaciones de Candidates, siguiendo el mismo patrón que
 * useUserMutations: la mutación vive aquí, el toast también (para no
 * duplicarlo en cada componente que la invoque) y el componente solo
 * dispara y lee `isPending`.
 *
 * Se invalidan DOS claves porque `assignedRecruiter` se muestra en los
 * dos lados: la columna "Asignado a" del listado y la cabecera del
 * detalle. Invalidar solo el listado dejaría el detalle desactualizado
 * al asignar desde ahí.
 */
export function useCandidateMutations() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  function invalidateCandidates() {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: ['candidates', 'list'] }),
      queryClient.invalidateQueries({ queryKey: ['candidates', 'detail'] }),
    ]);
  }

  const assignRecruiter = useMutation({
    mutationFn: ({ id, recruiterId }: { id: string; recruiterId: string | null }) =>
      candidatesService.assignRecruiter(id, recruiterId),
    onSuccess: (_data, variables) => {
      showToast(
        variables.recruiterId === null
          ? 'Reclutador removido exitosamente.'
          : 'Reclutador asignado exitosamente.',
      );
      return invalidateCandidates();
    },
    onError: (error) => {
      showToast(
        extractApiErrorMessage(error, 'No se pudo actualizar el reclutador asignado.'),
        'error',
      );
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: CandidateStatus }) =>
      candidatesService.updateStatus(id, status),
    onSuccess: () => {
      showToast('Estado del candidato actualizado exitosamente.');
      return invalidateCandidates();
    },
    onError: (error) => {
      showToast(
        extractApiErrorMessage(error, 'No se pudo actualizar el estado del candidato.'),
        'error',
      );
    },
  });

  // Sin onSuccess/invalidación a propósito: descargar el reporte no
  // cambia nada en el servidor, así que no hay caché que refrescar. El
  // Blob resuelto se resuelve directo al componente, que decide el
  // nombre de archivo (necesita el folio) y dispara la descarga.
  const exportExcel = useMutation({
    mutationFn: (id: string) => candidatesService.exportExcel(id),
    onError: (error) => {
      showToast(extractApiErrorMessage(error, 'No se pudo descargar el reporte.'), 'error');
    },
  });

  // Sin toast de éxito propio: SectionGrader ya muestra su propio badge
  // "Sección evaluada" inline, un toast aparte sería ruido redundante.
  // Invalida ['candidates','evaluations',id] (no solo detail/list): es
  // la clave que usa useGetEvaluations, la fuente real del progreso —
  // sin esto, la barra de la cabecera y el propio SectionGrader se
  // quedarían mostrando el valor previo a guardar.
  const evaluateSection = useMutation({
    mutationFn: ({
      id,
      section,
      rating,
      comments,
    }: {
      id: string;
      section: EvaluationSection;
      rating: EvaluationRating;
      comments?: string;
    }) => candidatesService.evaluateSection(id, section, { rating, comments }),
    onSuccess: (_data, variables) =>
      Promise.all([
        invalidateCandidates(),
        queryClient.invalidateQueries({ queryKey: ['candidates', 'evaluations', variables.id] }),
      ]),
    onError: (error) => {
      showToast(extractApiErrorMessage(error, 'No se pudo guardar la calificación.'), 'error');
    },
  });

  // Las 3 mutaciones de work-history no necesitan patch manual del
  // resultado en la caché: WorkHistoryTab ya actualiza su tarjeta
  // directo con la respuesta resuelta de mutateAsync (ver ese
  // componente) — invalidar aquí solo mantiene fresco `candidate` para
  // la próxima vez que se monte la pestaña, no lo que se ve en pantalla
  // ahora mismo.
  const createWorkHistory = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: WorkHistoryPayload }) =>
      candidatesService.createWorkHistory(id, payload),
    onSuccess: () => {
      showToast('Antecedente laboral guardado exitosamente.');
      return invalidateCandidates();
    },
    onError: (error) => {
      showToast(extractApiErrorMessage(error, 'No se pudo guardar el antecedente laboral.'), 'error');
    },
  });

  const updateWorkHistory = useMutation({
    mutationFn: ({
      id,
      workId,
      payload,
    }: {
      id: string;
      workId: string;
      payload: WorkHistoryPayload;
    }) => candidatesService.updateWorkHistory(id, workId, payload),
    onSuccess: () => {
      showToast('Antecedente laboral actualizado exitosamente.');
      return invalidateCandidates();
    },
    onError: (error) => {
      showToast(extractApiErrorMessage(error, 'No se pudo actualizar el antecedente laboral.'), 'error');
    },
  });

  const deleteWorkHistory = useMutation({
    mutationFn: ({ id, workId }: { id: string; workId: string }) =>
      candidatesService.deleteWorkHistory(id, workId),
    onSuccess: () => {
      showToast('Antecedente laboral eliminado exitosamente.');
      return invalidateCandidates();
    },
    onError: (error) => {
      showToast(extractApiErrorMessage(error, 'No se pudo eliminar el antecedente laboral.'), 'error');
    },
  });

  // Mismo criterio que las 3 de work-history: ReferencesTab parchea su
  // propia tarjeta con la respuesta resuelta, invalidar aquí solo
  // mantiene fresco `candidate` para la próxima vez que se monte la pestaña.
  const createPersonalReference = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PersonalReferencePayload }) =>
      candidatesService.createPersonalReference(id, payload),
    onSuccess: () => {
      showToast('Referencia personal guardada exitosamente.');
      return invalidateCandidates();
    },
    onError: (error) => {
      showToast(extractApiErrorMessage(error, 'No se pudo guardar la referencia personal.'), 'error');
    },
  });

  const updatePersonalReference = useMutation({
    mutationFn: ({
      id,
      refId,
      payload,
    }: {
      id: string;
      refId: string;
      payload: PersonalReferencePayload;
    }) => candidatesService.updatePersonalReference(id, refId, payload),
    onSuccess: () => {
      showToast('Referencia personal actualizada exitosamente.');
      return invalidateCandidates();
    },
    onError: (error) => {
      showToast(extractApiErrorMessage(error, 'No se pudo actualizar la referencia personal.'), 'error');
    },
  });

  const deletePersonalReference = useMutation({
    mutationFn: ({ id, refId }: { id: string; refId: string }) =>
      candidatesService.deletePersonalReference(id, refId),
    onSuccess: () => {
      showToast('Referencia personal eliminada exitosamente.');
      return invalidateCandidates();
    },
    onError: (error) => {
      showToast(extractApiErrorMessage(error, 'No se pudo eliminar la referencia personal.'), 'error');
    },
  });

  const createNeighborhoodReference = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: NeighborhoodReferencePayload }) =>
      candidatesService.createNeighborhoodReference(id, payload),
    onSuccess: () => {
      showToast('Referencia vecinal guardada exitosamente.');
      return invalidateCandidates();
    },
    onError: (error) => {
      showToast(extractApiErrorMessage(error, 'No se pudo guardar la referencia vecinal.'), 'error');
    },
  });

  const updateNeighborhoodReference = useMutation({
    mutationFn: ({
      id,
      refId,
      payload,
    }: {
      id: string;
      refId: string;
      payload: NeighborhoodReferencePayload;
    }) => candidatesService.updateNeighborhoodReference(id, refId, payload),
    onSuccess: () => {
      showToast('Referencia vecinal actualizada exitosamente.');
      return invalidateCandidates();
    },
    onError: (error) => {
      showToast(extractApiErrorMessage(error, 'No se pudo actualizar la referencia vecinal.'), 'error');
    },
  });

  const deleteNeighborhoodReference = useMutation({
    mutationFn: ({ id, refId }: { id: string; refId: string }) =>
      candidatesService.deleteNeighborhoodReference(id, refId),
    onSuccess: () => {
      showToast('Referencia vecinal eliminada exitosamente.');
      return invalidateCandidates();
    },
    onError: (error) => {
      showToast(extractApiErrorMessage(error, 'No se pudo eliminar la referencia vecinal.'), 'error');
    },
  });

  const upsertSocialNetwork = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SocialNetworkPayload }) =>
      candidatesService.upsertSocialNetwork(id, payload),
    onSuccess: () => {
      showToast('Redes sociales guardadas exitosamente.');
      return invalidateCandidates();
    },
    onError: (error) => {
      showToast(extractApiErrorMessage(error, 'No se pudieron guardar las redes sociales.'), 'error');
    },
  });

  return {
    assignRecruiter,
    updateStatus,
    exportExcel,
    evaluateSection,
    createWorkHistory,
    updateWorkHistory,
    deleteWorkHistory,
    createPersonalReference,
    updatePersonalReference,
    deletePersonalReference,
    createNeighborhoodReference,
    updateNeighborhoodReference,
    deleteNeighborhoodReference,
    upsertSocialNetwork,
  };
}
