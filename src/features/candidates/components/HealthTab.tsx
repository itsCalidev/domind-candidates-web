import { HealthForm } from './forms/HealthForm';
import type { CandidateCaptureMode, CandidateCaptureStatus, CandidateHealth } from '../types/candidate.types';

interface HealthTabProps {
  candidateId: string;
  health: CandidateHealth;
  captureMode: CandidateCaptureMode;
  captureStatus: CandidateCaptureStatus;
}

/**
 * Envoltorio delgado: toda la lógica vive en HealthForm.tsx, compartida
 * con el paso correspondiente del Wizard de Autollenado
 * (`mode="candidate"`). Este componente solo fija `mode="admin"`.
 */
export function HealthTab({ candidateId, health, captureMode, captureStatus }: HealthTabProps) {
  return (
    <HealthForm
      mode="admin"
      candidateId={candidateId}
      health={health}
      captureMode={captureMode}
      captureStatus={captureStatus}
    />
  );
}
