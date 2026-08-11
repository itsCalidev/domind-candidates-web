export type CandidateStatus =
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'ARCHIVED';

export interface CandidateListItem {
  id: string;
  folio: string;
  fullName: string;
  email: string;
  companyName: string;
  positionName: string;
  status: CandidateStatus;
  isActive: boolean;
}

export interface CandidateGeneralInfo {
  fullName: string;
  positionApplied: string;
  address: string;
  neighborhood: string;
  postalCode: string;
  phone: string;
  email: string;
  birthDate: string;
  birthPlace: string;
  civilStatus: string;
}

export interface CandidateDetail extends CandidateListItem {
  generalInfo: CandidateGeneralInfo;
}

export const CANDIDATE_STATUS_LABEL: Record<CandidateStatus, string> = {
  IN_PROGRESS: 'En progreso',
  COMPLETED: 'Completo',
  UNDER_REVIEW: 'En revisión',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
  ARCHIVED: 'Archivado',
};

export const CANDIDATE_STATUS_COLOR: Record<CandidateStatus, string> = {
  IN_PROGRESS: '#F39200',
  COMPLETED: '#67B1E3',
  UNDER_REVIEW: '#69478E',
  APPROVED: '#76B82A',
  REJECTED: '#FF0000',
  ARCHIVED: '#808080',
};
