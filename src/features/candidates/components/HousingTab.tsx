import { HousingForm } from './forms/HousingForm';
import type { CandidateCaptureMode, CandidateCaptureStatus, CandidateHousing } from '../types/candidate.types';

interface HousingTabProps {
  candidateId: string;
  housing: CandidateHousing;
  captureMode: CandidateCaptureMode;
  captureStatus: CandidateCaptureStatus;
}

/**
 * Envoltorio delgado: toda la lógica vive en HousingForm.tsx, compartida
 * con el paso correspondiente del Wizard de Autollenado
 * (`mode="candidate"`) — retrofit que reemplaza al viejo
 * CandidateHousingStep.tsx (esquema Zod duplicado, ya eliminado). Este
 * componente solo fija `mode="admin"`.
 */
export function HousingTab({ candidateId, housing, captureMode, captureStatus }: HousingTabProps) {
  return (
    <HousingForm
      mode="admin"
      candidateId={candidateId}
      housing={housing}
      captureMode={captureMode}
      captureStatus={captureStatus}
    />
  );
}
