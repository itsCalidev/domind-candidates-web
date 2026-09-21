import { DocumentationForm } from './forms/DocumentationForm';
import type { CandidateCaptureMode, CandidateCaptureStatus } from '../types/candidate.types';

interface DocumentationTabProps {
  candidateId: string;
  captureMode: CandidateCaptureMode;
  captureStatus: CandidateCaptureStatus;
}

/**
 * Envoltorio delgado: toda la lógica vive en DocumentationForm.tsx,
 * compartida con el paso correspondiente del Wizard de Autollenado
 * (`mode="candidate"`). Este componente solo fija `mode="admin"`.
 */
export function DocumentationTab({ candidateId, captureMode, captureStatus }: DocumentationTabProps) {
  return (
    <DocumentationForm mode="admin" candidateId={candidateId} captureMode={captureMode} captureStatus={captureStatus} />
  );
}
