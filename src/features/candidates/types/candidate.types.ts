export type CandidateStatus = 'pending' | 'in_process' | 'review' | 'completed';

export interface CandidateListItem {
  id: string;
  fullName: string;
  positionApplied: string;
  email: string;
  phone: string;
  status: CandidateStatus;
  progress: number; // 0-100, avance del cuestionario
  createdAt: string; // ISO date
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
  pending: 'Pendiente',
  in_process: 'En proceso',
  review: 'En revisión',
  completed: 'Completo',
};

export const CANDIDATE_STATUS_COLOR: Record<CandidateStatus, string> = {
  pending: '#F39200',
  in_process: '#67B1E3',
  review: '#69478E',
  completed: '#76B82A',
};
