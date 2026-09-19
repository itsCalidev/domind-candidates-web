import { useMutation, useQueryClient } from '@tanstack/react-query';
import { candidatesService } from '../services/candidateService';
import { useToast } from '@/shared/context/ToastContext';
import { extractApiErrorMessage } from '@/shared/utils/apiError';
import type {
  CandidateCaptureStatus,
  CandidateHealthPayload,
  CandidateHousingPayload,
  CandidateStatus,
  CreateAndAssignCandidatePayload,
  DocumentType,
  EvaluationRating,
  EvaluationSection,
  EvidenceCategory,
  InterviewerIntegrationPayload,
  NeighborhoodReferencePayload,
  PersonalInfoPayload,
  PersonalReferencePayload,
  SocialNetworkPayload,
  UpdateCandidateEconomyPayload,
  UpdateCandidateFamilyPayload,
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

  // Sin invalidateCandidates(): enviar el enlace no cambia ningún campo
  // que el listado/detalle muestren hoy (no hay un "estado de magic link"
  // confirmado en el contrato) — mismo criterio que getReportSummary, que
  // tampoco invalida nada por ser una acción de solo efecto externo.
  const sendMagicLink = useMutation({
    mutationFn: (id: string) => candidatesService.sendMagicLink(id),
    onSuccess: () => {
      showToast('Enlace mágico enviado exitosamente.');
    },
    onError: (error) => {
      showToast(extractApiErrorMessage(error, 'No se pudo enviar el enlace mágico.'), 'error');
    },
  });

  const createAndAssignCandidate = useMutation({
    mutationFn: (payload: CreateAndAssignCandidatePayload) =>
      candidatesService.createAndAssignCandidate(payload),
    onSuccess: () => {
      showToast('Candidato creado y asignado exitosamente.');
      return invalidateCandidates();
    },
    onError: (error) => {
      showToast(extractApiErrorMessage(error, 'No se pudo crear al candidato.'), 'error');
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

  const updateCaptureStatus = useMutation({
    mutationFn: ({ id, captureStatus }: { id: string; captureStatus: CandidateCaptureStatus }) =>
      candidatesService.updateCaptureStatus(id, captureStatus),
    onSuccess: () => {
      showToast('Estado de captura actualizado exitosamente.');
      return invalidateCandidates();
    },
    onError: (error) => {
      showToast(
        extractApiErrorMessage(error, 'No se pudo actualizar el estado de captura.'),
        'error',
      );
    },
  });

  const updatePersonalInfo = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<PersonalInfoPayload> }) =>
      candidatesService.updatePersonalInfo(id, payload),
    onSuccess: () => {
      showToast('Datos personales actualizados exitosamente.');
      return invalidateCandidates();
    },
    onError: (error) => {
      showToast(extractApiErrorMessage(error, 'No se pudieron actualizar los datos personales.'), 'error');
    },
  });

  const updateFamily = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCandidateFamilyPayload }) =>
      candidatesService.updateFamily(id, payload),
    onSuccess: () => {
      showToast('Estructura familiar actualizada exitosamente.');
      return invalidateCandidates();
    },
    onError: (error) => {
      showToast(extractApiErrorMessage(error, 'No se pudo actualizar la estructura familiar.'), 'error');
    },
  });

  const updateHealth = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CandidateHealthPayload> }) =>
      candidatesService.updateHealth(id, payload),
    onSuccess: () => {
      showToast('Estado de salud actualizado exitosamente.');
      return invalidateCandidates();
    },
    onError: (error) => {
      showToast(extractApiErrorMessage(error, 'No se pudo actualizar el estado de salud.'), 'error');
    },
  });

  // El service method (`updateHousing`) ya existía — lo usaba solo el
  // flujo de Magic Link (candidate-auth) llamándolo directo. Esta
  // mutación es la envoltura del lado admin (toast + invalidateCandidates),
  // mismo criterio que el resto de las pestañas de detalle.
  const updateHousing = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CandidateHousingPayload> }) =>
      candidatesService.updateHousing(id, payload),
    onSuccess: () => {
      showToast('Datos de vivienda actualizados exitosamente.');
      return invalidateCandidates();
    },
    onError: (error) => {
      showToast(extractApiErrorMessage(error, 'No se pudo actualizar la vivienda.'), 'error');
    },
  });

  // Sin `Partial`, a diferencia de updatePersonalInfo/updateHealth/updateHousing:
  // el backend reemplaza incomes/vehicles/debts/bankCards por completo en
  // cada PATCH, así que EconomyTab siempre manda el objeto entero.
  const updateEconomy = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCandidateEconomyPayload }) =>
      candidatesService.updateEconomy(id, payload),
    onSuccess: () => {
      showToast('Economía familiar actualizada exitosamente.');
      return invalidateCandidates();
    },
    onError: (error) => {
      showToast(extractApiErrorMessage(error, 'No se pudo actualizar la economía familiar.'), 'error');
    },
  });

  // Sin onSuccess/invalidación a propósito: leer el resumen no cambia
  // nada en el servidor, así que no hay caché que refrescar. El JSON
  // resuelto se lee directo del componente (useCandidateReportPdf), que
  // dispara el flujo de html2canvas + jsPDF.
  const getReportSummary = useMutation({
    mutationFn: (id: string) => candidatesService.getReportSummary(id),
    onError: (error) => {
      showToast(extractApiErrorMessage(error, 'No se pudo generar el reporte.'), 'error');
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

  const upsertInterviewerIntegration = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: InterviewerIntegrationPayload }) =>
      candidatesService.upsertInterviewerIntegration(id, payload),
    onSuccess: () => {
      showToast('Conclusión guardada exitosamente.');
      return invalidateCandidates();
    },
    onError: (error) => {
      showToast(extractApiErrorMessage(error, 'No se pudo guardar la conclusión.'), 'error');
    },
  });

  // Invalida solo ['candidates','evidence',id] (mismo criterio que
  // evaluateSection con ['candidates','evaluations',id]): el listado/detalle
  // del candidato no cambia, solo sus evidencias — useGetEvidence
  // (useCandidateEvidence.ts) vuelve a pedir el arreglo solo, sin que
  // EvidenceGallery necesite leer la respuesta resuelta a mano. La key
  // corta (sin `category`) alcanza por prefijo a las 3 variantes por
  // categoría de la query — no hace falta saber cuál tocó esta mutación.
  const uploadEvidence = useMutation({
    mutationFn: ({
      id,
      file,
      category,
      documentType,
    }: {
      id: string;
      file: File;
      category: EvidenceCategory;
      documentType?: DocumentType;
    }) => candidatesService.uploadEvidence(id, file, category, documentType),
    onSuccess: (_data, variables) => {
      showToast('Evidencia subida exitosamente.');
      return queryClient.invalidateQueries({ queryKey: ['candidates', 'evidence', variables.id] });
    },
    onError: (error) => {
      showToast(extractApiErrorMessage(error, 'No se pudo subir la evidencia.'), 'error');
    },
  });

  const updateEvidence = useMutation({
    mutationFn: ({ id, evidenceId, file }: { id: string; evidenceId: string; file: File }) =>
      candidatesService.updateEvidence(id, evidenceId, file),
    onSuccess: (_data, variables) => {
      showToast('Evidencia actualizada exitosamente.');
      return queryClient.invalidateQueries({ queryKey: ['candidates', 'evidence', variables.id] });
    },
    onError: (error) => {
      showToast(extractApiErrorMessage(error, 'No se pudo actualizar la evidencia.'), 'error');
    },
  });

  const deleteEvidence = useMutation({
    mutationFn: ({ id, evidenceId }: { id: string; evidenceId: string }) =>
      candidatesService.deleteEvidence(id, evidenceId),
    onSuccess: (_data, variables) => {
      showToast('Evidencia eliminada exitosamente.');
      return queryClient.invalidateQueries({ queryKey: ['candidates', 'evidence', variables.id] });
    },
    onError: (error) => {
      showToast(extractApiErrorMessage(error, 'No se pudo eliminar la evidencia.'), 'error');
    },
  });

  return {
    assignRecruiter,
    sendMagicLink,
    createAndAssignCandidate,
    updateStatus,
    updateCaptureStatus,
    updatePersonalInfo,
    updateFamily,
    updateHealth,
    updateHousing,
    updateEconomy,
    getReportSummary,
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
    upsertInterviewerIntegration,
    uploadEvidence,
    updateEvidence,
    deleteEvidence,
  };
}
