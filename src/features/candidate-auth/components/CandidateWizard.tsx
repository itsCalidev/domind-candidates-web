import { useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Paper, Step, StepButton, Stepper, Typography } from '@mui/material';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import { candidatesService } from '@/features/candidates/services/candidateService';
import type { CandidateHousing } from '@/features/candidates/types/candidate.types';
import { useToast } from '@/shared/context/ToastContext';
import { useMagicLink } from '../context/MagicLinkContext';
import { CandidateHousingStep } from './CandidateHousingStep';

const WIZARD_STEPS = [
  'Información General',
  'Documentación',
  'Estructura Familiar',
  'Estado de Salud',
  'Vivienda',
  'Economía Familiar',
] as const;

const HOUSING_STEP_INDEX = 4;

/**
 * Placeholder honesto para los pasos que todavía no tienen un contrato
 * de PATCH confirmado contra el backend (Información General,
 * Documentación, Estructura Familiar, Estado de Salud, Economía
 * Familiar — ver el resumen de la entrega). No avanza el wizard ni
 * simula un guardado: reportarle al candidato un progreso que en
 * realidad nunca se mandó al backend sería peor que dejarlo bloqueado.
 */
function StepPendingContract({ label }: { label: string }) {
  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        {label}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Este paso todavía no está conectado al backend.
      </Typography>
    </Paper>
  );
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
 * Orquesta los 6 pasos del formulario de candidato — componente nuevo,
 * dedicado exclusivamente a este flujo (NO reutiliza CandidateSubTabs.tsx
 * ni ningún tab del panel administrativo, que además son de solo
 * lectura/edición por reclutador). Navegación estrictamente secuencial:
 * un paso solo se desbloquea cuando el anterior se guardó con éxito
 * (`furthestUnlockedStep`) — nunca se puede saltar adelante, tal como se
 * pidió explícitamente.
 */
export function CandidateWizard() {
  const { candidate, clearMagicLink } = useMagicLink();
  const { showToast } = useToast();
  const [activeStep, setActiveStep] = useState(0);
  const [furthestUnlockedStep, setFurthestUnlockedStep] = useState(0);
  const [housing, setHousing] = useState<CandidateHousing | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const candidateId = candidate?.candidateId;

  // Pre-llena el paso de Vivienda si el candidato ya había capturado
  // datos antes (ej. cerró la pestaña a medio formulario y volvió a
  // entrar con el mismo enlace) — reutiliza `getById`, la misma función
  // de SERVICIO que ya usa el panel administrativo (dato, no componente
  // visual), vía la ruta híbrida GET /candidates/:id.
  useEffect(() => {
    if (!candidateId) return;
    let isMounted = true;
    candidatesService
      .getById(candidateId)
      .then((detail) => {
        if (isMounted) setHousing(detail.housing);
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

  async function handleFinalSubmit() {
    if (!candidateId) return;
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
          <Button variant="contained" size="large" disabled={isSubmitting} onClick={handleFinalSubmit}>
            {isSubmitting ? 'Enviando…' : 'Enviar formulario'}
          </Button>
        </Paper>
      ) : activeStep === HOUSING_STEP_INDEX ? (
        <CandidateHousingStep
          candidateId={candidateId}
          initialValues={housing}
          onSaved={() => handleStepSaved(HOUSING_STEP_INDEX)}
        />
      ) : (
        <StepPendingContract label={WIZARD_STEPS[activeStep]} />
      )}
    </Box>
  );
}
