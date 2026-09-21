import { useEffect, useRef, useState } from 'react';
import { Box, Button, CircularProgress, Paper, Step, StepButton, Stepper, Typography } from '@mui/material';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import { candidatesService } from '@/features/candidates/services/candidateService';
import { PersonalInfoForm } from '@/features/candidates/components/forms/PersonalInfoForm';
import { DocumentationForm } from '@/features/candidates/components/forms/DocumentationForm';
import { FamilyForm } from '@/features/candidates/components/forms/FamilyForm';
import { HealthForm } from '@/features/candidates/components/forms/HealthForm';
import { HousingForm } from '@/features/candidates/components/forms/HousingForm';
import { EconomyForm } from '@/features/candidates/components/forms/EconomyForm';
import { useCandidateDetail } from '@/features/candidates/hooks/useCandidateDetail';
import { useGetEvidence } from '@/features/candidates/hooks/useCandidateEvidence';
import { getMissingDataReport } from '@/features/candidates/utils/candidateCompleteness';
import type { CandidateDetail, CandidateGeneralInfo, CandidateHealth, CandidateHousing } from '@/features/candidates/types/candidate.types';
import { useToast } from '@/shared/context/ToastContext';
import { useMagicLink } from '../context/MagicLinkContext';

const WIZARD_STEPS = [
  'Información General',
  'Documentación',
  'Estructura Familiar',
  'Estado de Salud',
  'Vivienda',
  'Economía Familiar',
] as const;

const GENERAL_INFO_STEP_INDEX = 0;
const DOCUMENTATION_STEP_INDEX = 1;
const FAMILY_STEP_INDEX = 2;
const HEALTH_STEP_INDEX = 3;
const HOUSING_STEP_INDEX = 4;
const ECONOMY_STEP_INDEX = 5;

/** Placeholder que candidateService.ts pone en `generalInfo` cuando el backend no trae el dato — nunca es un valor real capturado. */
const NOT_REGISTERED = 'No registrado';

function hasText(value: string | null | undefined): boolean {
  return !!value && value.trim() !== '' && value !== NOT_REGISTERED;
}

/**
 * Heurísticas de "¿el candidato ya tocó este paso?", una por sección —
 * deliberadamente más laxas que `getMissingDataReport` (que exige TODOS
 * los campos para permitir el envío final). Aquí solo deciden dónde
 * reanudar el Wizard al recargar la página: un falso positivo (marcar un
 * paso "tocado" cuando en realidad está a medias) no bloquea nada, porque
 * `getMissingDataReport` sigue siendo quien exige completitud real antes
 * del envío — y el candidato puede volver a cualquier paso desbloqueado
 * con el Stepper.
 */
function hasGeneralInfoData(info: CandidateGeneralInfo): boolean {
  return hasText(info.address) || hasText(info.phone) || hasText(info.email);
}

function hasHealthData(health: CandidateHealth): boolean {
  return health.weight !== null || health.height !== null || hasText(health.currentHealth);
}

function hasHousingData(housing: CandidateHousing, evidenceCount: number): boolean {
  return hasText(housing.housingType) || hasText(housing.housingConditions) || evidenceCount > 0;
}

function hasEconomyData(detail: CandidateDetail): boolean {
  return detail.incomes.length > 0 || detail.economy.expensesTotal !== null;
}

function SubmittedScreen() {
  return (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <CheckCircleOutlinedIcon color="success" sx={{ fontSize: 64, mb: 2 }} />
      <Typography variant="h5" sx={{ mb: 1 }}>
        ¡Gracias por completar tu formulario!
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Tu reclutador ya fue notificado y revisará tu información en breve.
      </Typography>
    </Box>
  );
}

/**
 * Orquesta los 6 pasos del formulario de candidato reutilizando los
 * mismos formularios puros (`components/forms/*Form.tsx`, `mode="candidate"`)
 * que ya usa el panel administrativo en `mode="admin"` — un solo `useForm`
 * y un solo esquema Zod por sección, sin componentes duplicados. Navegación
 * estrictamente secuencial: un paso solo se desbloquea cuando el anterior
 * se guardó con éxito (`furthestUnlockedStep`) — nunca se puede saltar
 * adelante, tal como se pidió explícitamente.
 */
export function CandidateWizard() {
  const { candidate, clearMagicLink } = useMagicLink();
  const { showToast } = useToast();
  const [activeStep, setActiveStep] = useState(0);
  const [furthestUnlockedStep, setFurthestUnlockedStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const hasRestoredProgress = useRef(false);

  const candidateId = candidate?.candidateId;
  // TanStack Query (no el useState/useEffect crudo que tenía antes): la
  // misma query y clave (['candidates','detail',id]) que ya usa
  // CandidateDetailPage, así que cada mutación de los *Form.tsx
  // (updatePersonalInfo/updateFamily/updateHealth/updateHousing/
  // updateEconomy, todas con `invalidateCandidates()` en su `onSuccess`,
  // ver useCandidateMutations.ts) la invalida y dispara un refetch en
  // segundo plano automáticamente. `refetch` además se usa explícitamente
  // en `handleFinalSubmit` para no validar completitud contra una versión
  // obsoleta si el candidato hace clic justo después de guardar el último
  // paso, antes de que ese refetch en segundo plano termine.
  const {
    candidate: detail,
    isLoading: isLoadingDetail,
    isError: isDetailError,
    refetch: refetchDetail,
  } = useCandidateDetail(candidateId);
  // La evidencia (documentos y fotos de vivienda) no vive embebida en
  // `CandidateDetail` — es su propio endpoint, igual que en
  // CandidateDetailPage (ver ese archivo). getMissingDataReport las
  // necesita para el checklist de "Documentación" y el mínimo de 3 fotos
  // de "Vivienda".
  const documentEvidenceQuery = useGetEvidence(candidateId, 'DOCUMENT');
  const housingEvidenceQuery = useGetEvidence(candidateId, 'HOUSING');

  useEffect(() => {
    if (isDetailError) showToast('No se pudo cargar tu información previa.', 'error');
  }, [isDetailError, showToast]);

  // Restaura el progreso al recargar la página: si el candidato ya guardó
  // datos en el backend para un paso, lo marca desbloqueado y arranca en
  // el primer paso realmente pendiente, en vez de forzarlo a repetir
  // "Guardar y continuar" en pasos que el backend ya tiene. Se ejecuta UNA
  // sola vez (hasRestoredProgress) apenas `detail` y ambas evidencias
  // terminan de resolver — después de eso, la navegación del candidato
  // (Stepper, handleStepSaved) manda, sin que este efecto la vuelva a pisar.
  useEffect(() => {
    if (hasRestoredProgress.current) return;
    if (!detail) return;
    if (documentEvidenceQuery.isLoading || housingEvidenceQuery.isLoading) return;
    hasRestoredProgress.current = true;

    const stepIsFilled = [
      hasGeneralInfoData(detail.generalInfo),
      (documentEvidenceQuery.data?.length ?? 0) > 0,
      detail.familyMembers.length > 0,
      hasHealthData(detail.health),
      hasHousingData(detail.housing, housingEvidenceQuery.data?.length ?? 0),
      hasEconomyData(detail),
    ];

    let unlockedCount = 0;
    while (unlockedCount < stepIsFilled.length && stepIsFilled[unlockedCount]) {
      unlockedCount += 1;
    }

    if (unlockedCount > 0) {
      setFurthestUnlockedStep(unlockedCount);
      setActiveStep(Math.min(unlockedCount, WIZARD_STEPS.length - 1));
    }
  }, [detail, documentEvidenceQuery.data, documentEvidenceQuery.isLoading, housingEvidenceQuery.data, housingEvidenceQuery.isLoading]);

  function handleStepSaved(stepIndex: number) {
    setFurthestUnlockedStep((prev) => Math.max(prev, stepIndex + 1));
    setActiveStep((prev) => Math.min(prev + 1, WIZARD_STEPS.length - 1));
  }

  /**
   * Mismo validador de "Perfil Mínimo Viable" que ya usa el reclutador en
   * CandidateDetailPage para "Finalizar captura" (getMissingDataReport) —
   * una sola fuente de verdad de "qué le falta" a un candidato, sin
   * importar quién intente cerrar la captura. Aquí se abre en un Toast en
   * vez de un diálogo (el candidato no tiene un panel de detalle al que
   * volver a mirar la lista con calma): al aceptarlo, vuelve directo al
   * paso que le falta.
   *
   * Recibe `freshDetail` como parámetro en vez de cerrar sobre el `detail`
   * ya renderizado — `handleFinalSubmit` le pasa el resultado de un
   * `refetch()` recién resuelto, no el estado potencialmente obsoleto.
   */
  function getMissingDataMessage(freshDetail: CandidateDetail | null): string | null {
    if (!freshDetail) return 'No se pudo verificar tu información. Intenta de nuevo.';
    // Sin esto, un fallo de red en /evidence haría que `?? []` se lea como
    // "no subiste nada" — un falso negativo que bloquearía el envío por un
    // motivo distinto al real. Mejor pedir que reintente a que mienta sobre
    // qué le falta.
    if (documentEvidenceQuery.isError || housingEvidenceQuery.isError) {
      return 'No se pudo verificar tu documentación y evidencia de vivienda. Intenta de nuevo.';
    }
    const report = getMissingDataReport(freshDetail, documentEvidenceQuery.data ?? [], housingEvidenceQuery.data ?? []);
    if (report.isComplete) return null;
    const missingItems = Object.entries(report.bySection).flatMap(([section, fields]) =>
      fields.map((field) => `${section}: ${field}`),
    );
    return `No puedes enviar el formulario. Faltan datos obligatorios: ${missingItems.join(', ')}.`;
  }

  async function handleFinalSubmit() {
    if (!candidateId) return;
    setIsSubmitting(true);
    try {
      // Pide la versión más fresca antes de validar: si el candidato
      // guardó el último paso hace apenas un instante, el refetch en
      // segundo plano que dispara esa mutación (ver el comentario de
      // useCandidateDetail arriba) puede no haber resuelto todavía —
      // confiar en el `detail` ya renderizado ahí produciría el falso
      // "te falta todo" que se reportó.
      const { data: freshDetail } = await refetchDetail();
      const missingDataMessage = getMissingDataMessage(freshDetail ?? null);
      if (missingDataMessage) {
        showToast(missingDataMessage, 'error');
        return;
      }
      await candidatesService.submitForm(candidateId);
      clearMagicLink();
      setIsSubmitted(true);
    } catch {
      showToast('No se pudo enviar tu formulario. Intenta de nuevo.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSubmitted) {
    return <SubmittedScreen />;
  }

  if (!candidateId || isLoadingDetail) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const readyToSubmit = furthestUnlockedStep >= WIZARD_STEPS.length;
  // El botón de envío depende de esta evidencia para validar completitud
  // (ver getMissingDataMessage) — mientras carga o si falló, no tiene
  // caso ofrecer "Enviar formulario" todavía: isLoading evita un click en
  // falso mientras se resuelve, isError evita el falso negativo de tratar
  // un fallo de red como "no subiste nada".
  const isVerifyingEvidence = documentEvidenceQuery.isLoading || housingEvidenceQuery.isLoading;
  const evidenceLoadFailed = documentEvidenceQuery.isError || housingEvidenceQuery.isError;

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: { xs: 2, sm: 4 } }}>
      <Typography variant="h5" sx={{ mb: 0.5 }}>
        Hola, {candidate.firstName}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Folio {candidate.folio} — completa cada paso para terminar tu registro.
      </Typography>

      <Stepper nonLinear activeStep={activeStep} sx={{ mb: 4, flexWrap: 'wrap', rowGap: 2 }}>
        {WIZARD_STEPS.map((label, index) => (
          <Step key={label} completed={index < furthestUnlockedStep}>
            <StepButton disabled={index > furthestUnlockedStep} onClick={() => setActiveStep(index)}>
              {label}
            </StepButton>
          </Step>
        ))}
      </Stepper>

      {readyToSubmit ? (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, textAlign: 'center' }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Ya completaste todos los pasos
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Revisa que todo esté correcto y envía tu formulario final.
          </Typography>
          {evidenceLoadFailed && (
            <Typography variant="body2" color="error.main" sx={{ mb: 2 }}>
              No se pudo verificar tu documentación y evidencia de vivienda. Recarga la página e intenta de nuevo.
            </Typography>
          )}
          <Button
            variant="contained"
            size="large"
            disabled={isSubmitting || isVerifyingEvidence || evidenceLoadFailed}
            onClick={handleFinalSubmit}
          >
            {isSubmitting ? 'Enviando…' : isVerifyingEvidence ? 'Verificando…' : 'Enviar formulario'}
          </Button>
        </Paper>
      ) : activeStep === GENERAL_INFO_STEP_INDEX ? (
        <PersonalInfoForm
          mode="candidate"
          candidateId={candidateId}
          initialValues={detail?.generalInfo ?? null}
          onSaved={() => handleStepSaved(GENERAL_INFO_STEP_INDEX)}
        />
      ) : activeStep === DOCUMENTATION_STEP_INDEX ? (
        <DocumentationForm
          mode="candidate"
          candidateId={candidateId}
          onSaved={() => handleStepSaved(DOCUMENTATION_STEP_INDEX)}
        />
      ) : activeStep === FAMILY_STEP_INDEX ? (
        <FamilyForm
          mode="candidate"
          candidateId={candidateId}
          family={detail?.family ?? null}
          familyMembers={detail?.familyMembers ?? null}
          onSaved={() => handleStepSaved(FAMILY_STEP_INDEX)}
        />
      ) : activeStep === HEALTH_STEP_INDEX ? (
        <HealthForm
          mode="candidate"
          candidateId={candidateId}
          health={detail?.health ?? null}
          onSaved={() => handleStepSaved(HEALTH_STEP_INDEX)}
        />
      ) : activeStep === HOUSING_STEP_INDEX ? (
        <HousingForm
          mode="candidate"
          candidateId={candidateId}
          housing={detail?.housing ?? null}
          onSaved={() => handleStepSaved(HOUSING_STEP_INDEX)}
        />
      ) : activeStep === ECONOMY_STEP_INDEX ? (
        <EconomyForm
          mode="candidate"
          candidateId={candidateId}
          economy={detail?.economy ?? null}
          incomes={detail?.incomes ?? null}
          vehicles={detail?.vehicles ?? null}
          debts={detail?.debts ?? null}
          bankCards={detail?.bankCards ?? null}
          otherExpenses={detail?.otherExpenses ?? null}
          onSaved={() => handleStepSaved(ECONOMY_STEP_INDEX)}
        />
      ) : null}
    </Box>
  );
}
