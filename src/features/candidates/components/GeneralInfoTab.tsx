import { PersonalInfoForm } from './forms/PersonalInfoForm';
import type { CandidateCaptureMode, CandidateCaptureStatus, CandidateGeneralInfo } from '../types/candidate.types';

interface GeneralInfoTabProps {
  candidateId: string;
  info: CandidateGeneralInfo;
  captureMode: CandidateCaptureMode;
  captureStatus: CandidateCaptureStatus;
}

/**
 * Envoltorio delgado: toda la lógica (useForm, schema, vista de lectura,
 * toggle de edición) vive en PersonalInfoForm.tsx, compartida con el paso
 * 1 del Wizard de Autollenado (`mode="candidate"`). Este componente solo
 * fija `mode="admin"` para el panel del reclutador.
 */
export function GeneralInfoTab({ candidateId, info, captureMode, captureStatus }: GeneralInfoTabProps) {
  return (
    <PersonalInfoForm
      mode="admin"
      candidateId={candidateId}
      initialValues={info}
      captureMode={captureMode}
      captureStatus={captureStatus}
    />
  );
}
