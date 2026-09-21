import { FamilyForm } from './forms/FamilyForm';
import type {
  CandidateCaptureMode,
  CandidateCaptureStatus,
  CandidateFamily,
  FamilyMember,
} from '../types/candidate.types';

interface FamilyTabProps {
  candidateId: string;
  family: CandidateFamily;
  familyMembers: FamilyMember[];
  captureMode: CandidateCaptureMode;
  captureStatus: CandidateCaptureStatus;
}

/**
 * Envoltorio delgado: toda la lógica vive en FamilyForm.tsx, compartida
 * con el paso correspondiente del Wizard de Autollenado
 * (`mode="candidate"`). Este componente solo fija `mode="admin"`.
 */
export function FamilyTab({ candidateId, family, familyMembers, captureMode, captureStatus }: FamilyTabProps) {
  return (
    <FamilyForm
      mode="admin"
      candidateId={candidateId}
      family={family}
      familyMembers={familyMembers}
      captureMode={captureMode}
      captureStatus={captureStatus}
    />
  );
}
