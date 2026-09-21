import { useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Paper, Step, StepButton, Stepper, Typography } from '@mui/material';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import { candidatesService } from '@/features/candidates/services/candidateService';
import { PersonalInfoForm } from '@/features/candidates/components/forms/PersonalInfoForm';
import { DocumentationForm } from '@/features/candidates/components/forms/DocumentationForm';
import { FamilyForm } from '@/features/candidates/components/forms/FamilyForm';
import { HealthForm } from '@/features/candidates/components/forms/HealthForm';
import { HousingForm } from '@/features/candidates/components/forms/HousingForm';
import { EconomyForm } from '@/features/candidates/components/forms/EconomyForm';
import { useGetEvidence } from '@/features/candidates/hooks/useCandidateEvidence';
import { getMissingDataReport } from '@/features/candidates/utils/candidateCompleteness';
import type { CandidateDetail } from '@/features/candidates/types/candidate.types';
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
  const [detail, setDetail] = useState<CandidateDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const candidateId = candidate?.candidateId;
  // La evidencia (documentos y fotos de vivienda) no vive embebida en
  // `CandidateDetail` — es su propio endpoint, igual que en
  // CandidateDetailPage (ver ese archivo). getMissingDataReport las
  // necesita para el checklist de "Documentación" y el mínimo de 3 fotos
  // de "Vivienda". Llamados aquí, antes de cualquier `return` temprano,
  // por las reglas de hooks de React.
  const documentEvidenceQuery = useGetEvidence(candidateId, 'DOCUMENT');
  const housingEvidenceQuery = useGetEvidence(candidateId, 'HOUSING');

  // Pre-llena cada paso si el candidato ya había capturado datos antes
  // (ej. cerró la pestaña a medio formulario y volvió a entrar con el
  // mismo enlace) — reutiliza `getById`, la misma función de SERVICIO
  // que ya usa el panel administrativo (dato, no componente visual), vía
  // la ruta híbrida GET /candidates/:id.
  useEffect(() => {
    if (!candidateId) return;
    let isMounted = true;
    candidatesService
      .getById(candidateId)
      .then((data) => {
        if (isMounted) setDetail(data);
      })
      .catch(() => {
        if (isMounted) showToast('No se pudo cargar tu información previa.', 'error');
      })
      .finally(() => {
        if (isMounted) setIsLoadingDetail(false);
      });
    return () => {
      isMounted = false;
    };
  }, [candidateId, showToast]);

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
   */
  function getMissingDataMessage(): string | null {
    if (!detail) return 'No se pudo verificar tu información. Intenta de nuevo.';
    // Sin esto, un fallo de red en /evidence haría que `?? []` se lea como
    // "no subiste nada" — un falso negativo que bloquearía el envío por un
    // motivo distinto al real. Mejor pedir que reintente a que mienta sobre
    // qué le falta.
    if (documentEvidenceQuery.isError || housingEvidenceQuery.isError) {
      return 'No se pudo verificar tu documentación y evidencia de vivienda. Intenta de nuevo.';
    }
    const report = getMissingDataReport(detail, documentEvidenceQuery.data ?? [], housingEvidenceQuery.data ?? []);
    if (report.isComplete) return null;
    const missingItems = Object.entries(report.bySection).flatMap(([section, fields]) =>
      fields.map((field) => `${section}: ${field}`),
    );
    return `No puedes enviar el formulario. Faltan datos obligatorios: ${missingItems.join(', ')}.`;
  }

  async function handleFinalSubmit() {
    if (!candidateId) return;
    const missingDataMessage = getMissingDataMessage();
    if (missingDataMessage) {
      showToast(missingDataMessage, 'error');
      return;
    }
    setIsSubmitting(true);
    try {
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
